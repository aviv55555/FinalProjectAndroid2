"use client";
import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "./FireBase";
import { useNavigate } from "react-router-dom";
import './Feed.css';
import Post from "./Post";
import PostForm from "./PostForm";
import AdvancedSearch from "./AdvancedSearch";
/*
  Feed component that displays posts from the current user and users they follow.
  It listens to authentication state changes, fetches posts from the server, enriches them
  with user data from Firebase Realtime Database, and supports advanced filtering by
  username, post content, and date range. Users can create, edit, and delete posts,
  with real-time updates to the feed. Navigation to user profiles is also supported.
*/

export default function Feed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchByUserName, setSearchByUserName] = useState("");
  const [searchByPostText, setSearchByPostText] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [followingUids, setFollowingUids] = useState(new Set());
  const [userImages, setUserImages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
      try {
        const snap = await get(ref(database, `users/${currentUser.uid}/following`));
        const data = snap.val() || {};               
        const uids = Object.keys(data);
        uids.push(currentUser.uid);                
        setFollowingUids(new Set(uids));
      } catch (err) {
        console.error("Failed to fetch following list:", err);
      }
    } else {
      setFollowingUids(new Set());
    }
  });

  return () => unsubscribe();
}, []);

  useEffect(() => {
  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/posts");
      const { posts } = await res.json();

      const visible = posts.filter(p => followingUids.has(p.userId));

      const sorted = visible.sort(
        (a, b) => new Date(b.createdAt || b.stampDate) - new Date(a.createdAt || a.stampDate)
      );

      // User image mapping
      const userImagesMap = {};
      for (const post of sorted) {
        try {
          const snap = await get(ref(database, `users/${post.userId}`));
          const u = snap.exists() ? snap.val() : {};
          userImagesMap[post.userId] = u.image || null;
        } catch {
          userImagesMap[post.userId] = null;
        }
      }

      const withUserData = await Promise.all(
        sorted.map(async (post) => {
          try {
            const snap = await get(ref(database, `users/${post.userId}`));
            const u = snap.exists() ? snap.val() : {};
            return {
              ...post,
              firstName: u.firstName || "Unknown",
              lastName: u.lastName || "",
              image: u.image || null,
            };
          } catch (_) {
            return { ...post, firstName: "Unknown", lastName: "", image: null };
          }
        })
      );

      setUserImages(userImagesMap);
      setPosts(withUserData);
      setFilteredPosts(withUserData);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };
  fetchPosts();
}, [followingUids]);

  useEffect(() => {
    let filtered = posts;

    if (searchByUserName.trim() !== "") {
      const queryLower = searchByUserName.toLowerCase();
      filtered = filtered.filter((post) => {
        const firstName = post.firstName?.toLowerCase() || "";
        const lastName = post.lastName?.toLowerCase() || "";
        return firstName.includes(queryLower) || lastName.includes(queryLower);
      });
    }

    if (searchByPostText.trim() !== "") {
      const queryLower = searchByPostText.toLowerCase();
      filtered = filtered.filter((post) => {
        const title = post.title?.toLowerCase() || "";
        const content = post.content?.toLowerCase() || "";
        return title.includes(queryLower) || content.includes(queryLower);
      });
    }

    if (searchDateFrom !== "" || searchDateTo !== "") {
      filtered = filtered.filter((post) => {
        const postDate = new Date(post.createdAt || post.stampDate);
        const fromDate = searchDateFrom ? new Date(searchDateFrom) : null;
        let toDate = searchDateTo ? new Date(searchDateTo) : null;
        if (toDate) toDate.setDate(toDate.getDate() + 1);

        if (fromDate && toDate) return postDate >= fromDate && postDate < toDate;
        else if (fromDate) return postDate >= fromDate;
        else if (toDate) return postDate < toDate;
        return true;
      });
    }

    setFilteredPosts(filtered);
  }, [searchByUserName, searchByPostText, searchDateFrom, searchDateTo, posts]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handlePostCreated = async (newPost) => {
  if (!followingUids.has(newPost.userId)) return;
  try {
    const userSnap = await get(ref(database, `users/${newPost.userId}`));
    const userData = userSnap.exists() ? userSnap.val() : {};

    const enrichedPost = {
      ...newPost,
      firstName: userData.firstName || "Unknown",
      lastName: userData.lastName || "",
      image: userData.image || null,
    };

    setPosts((prev) => [enrichedPost, ...prev]);
    setFilteredPosts((prev) => [enrichedPost, ...prev]);

  } catch (err) {
    console.error("Error enriching post data:", err);
    alert("Post created but failed to load user info.");
  }
};



  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete post");
      }

      setPosts((prev) => prev.filter((post) => post._id !== postId && post.id !== postId));
      alert("Post deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting post: " + error.message);
    }
  };

  const handleEditSave = async (postId, title, content) => {
  try {
    const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update post");

    setPosts(prev => prev.map(p => p._id === data.post._id ? data.post : p));
    setFilteredPosts(prev => prev.map(p => p._id === data.post._id ? data.post : p));
    alert("Post updated successfully!");
  } catch (error) {
    console.error("Update error:", error);
    alert("Error updating post: " + error.message);
  }
};

  return (
    <div className="container feed-container">
  {user && <PostForm user={user} onPostCreated={handlePostCreated} />}

  <div className="feed-search-wrapper">
    <AdvancedSearch
      open={advancedSearchOpen}
      onToggle={() => setAdvancedSearchOpen((prev) => !prev)}
      searchByUserName={searchByUserName}
      setSearchByUserName={setSearchByUserName}
      searchByPostText={searchByPostText}
      setSearchByPostText={setSearchByPostText}
      searchDateFrom={searchDateFrom}
      setSearchDateFrom={setSearchDateFrom}
      searchDateTo={searchDateTo}
      setSearchDateTo={setSearchDateTo}
    />
  </div>

  <div className="feed-posts-wrapper">
    {filteredPosts.length === 0 && (
      <p className="feed-no-posts">No posts found.</p>
    )}

    {filteredPosts.map((post) => (
      <div key={post._id || post.id} className="feed-post">
        <Post
          post={post}
          user={user}
          onDelete={handleDelete}
          onEditSave={handleEditSave}
          onUserClick={handleUserClick}
          userImage={userImages[post.userId] || ""}
        />
      </div>
    ))}
  </div>
</div>
  );
}
