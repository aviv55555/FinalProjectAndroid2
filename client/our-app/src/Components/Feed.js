"use client";
import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { database, auth } from "./FireBase";
import { useNavigate } from "react-router-dom";

import Post from "./Post";
import PostForm from "./PostForm";
import AdvancedSearch from "./AdvancedSearch";

export default function Feed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // חיפוש מתקדם
  const [searchByUserName, setSearchByUserName] = useState("");
  const [searchByPostText, setSearchByPostText] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  const navigate = useNavigate();

  // מעקב אחרי משתמש
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // טעינת פוסטים מהשרת
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/posts");
        const data = await res.json();
        const posts = data.posts;

        // ממיין לפי תאריך
        const sortedPosts = posts.sort(
          (a, b) =>
            new Date(b.createdAt || b.stampDate) - new Date(a.createdAt || a.stampDate)
        );

        // מוסיף פרטי משתמש לכל פוסט
        const postsWithUserData = await Promise.all(
          sortedPosts.map(async (post) => {
            try {
              const userSnap = await get(ref(database, `users/${post.userId}`));
              const userData = userSnap.exists() ? userSnap.val() : {};

              return {
                ...post,
                firstName: userData.firstName || "Unknown",
                lastName: userData.lastName || "",
                image: userData.image || null,
              };
            } catch (err) {
              console.error("Failed to fetch user data for post:", post.id, err);
              return {
                ...post,
                firstName: "Unknown",
                lastName: "",
                image: null,
              };
            }
          })
        );

        setPosts(postsWithUserData);
        setFilteredPosts(postsWithUserData);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };

    fetchPosts();
  }, []);

  // סינון מתקדם
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

        if (toDate) {
          toDate.setDate(toDate.getDate() + 1);
        }

        if (fromDate && toDate) {
          return postDate >= fromDate && postDate < toDate;
        } else if (fromDate) {
          return postDate >= fromDate;
        } else if (toDate) {
          return postDate < toDate;
        }
        return true;
      });
    }

    setFilteredPosts(filtered);
  }, [searchByUserName, searchByPostText, searchDateFrom, searchDateTo, posts]);

  // מעבר לפרופיל משתמש
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // יצירת פוסט חדש - מוסיף לפוסטים
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // מחיקת פוסט
  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "delete",
          data: { postId, userId: user.uid },
        }),
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

  // שמירת עריכת פוסט
  const handleEditSave = async (postId, newTitle, newContent) => {
    try {
      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "update",
          data: {
            postId,
            userId: user.uid,
            newTitle,
            newContent,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update post");
      }

      const updatedResult = await response.json();

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId || post.id === postId ? updatedResult.post : post
        )
      );

      alert("Post updated successfully!");
    } catch (error) {
      console.error("Update error:", error);
      alert("Error updating post: " + error.message);
    }
  };

  return (
    <div className="container mt-4">
      {user && <PostForm user={user} onPostCreated={handlePostCreated} />}

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

      <div className="mb-5">
        {filteredPosts.length === 0 && <p>No posts found.</p>}

        {filteredPosts.map((post) => (
          <Post
            key={post._id || post.id}
            post={post}
            user={user}
            onDelete={handleDelete}
            onEditSave={handleEditSave}
            onUserClick={handleUserClick}
          />
        ))}
      </div>
    </div>
  );
}
