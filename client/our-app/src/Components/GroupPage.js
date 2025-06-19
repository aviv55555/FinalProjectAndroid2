"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, update, push, onValue } from "firebase/database";
import { database, auth } from "./FireBase";
import { onAuthStateChanged } from "firebase/auth";
import Post from "./Post"; // נניח שהקומפוננטה Post נמצאת בקובץ נפרד
import 'bootstrap/dist/css/bootstrap.min.css';

const GroupPage = () => {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // פוסטים של הקבוצה
  const [posts, setPosts] = useState([]);

  // טופס פוסט חדש
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  // קבלת המשתמש המחובר
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // טעינת פרטי הקבוצה ובדיקת הרשאות
  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const snap = await get(ref(database, `groups/${groupId}`));
        if (snap.exists()) {
          const data = snap.val();
          setGroupData(data);
          setNewTitle(data.name || "");
          setIsAdmin(currentUser?.uid === data.adminId);
        } else {
          setGroupData(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error fetching group:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, currentUser]);

  // טעינת פוסטים של הקבוצה בזמן אמת
  useEffect(() => {
    const postsRef = ref(database, `groupPosts/${groupId}`);
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val() || {};
      // ממירים למערך עם מזהה
      const postsArray = Object.entries(data).map(([id, post]) => ({ id, ...post }));
      // מיין לפי תאריך יורד (חדשים קודם)
      postsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(postsArray);
    });

    return () => unsubscribe();
  }, [groupId]);

  // פונקציות לעריכת כותרת קבוצה
  const handleTitleChange = (e) => setNewTitle(e.target.value);
  const saveNewTitle = async () => {
    if (!newTitle.trim()) {
      alert("Title cannot be empty");
      return;
    }
    try {
      await update(ref(database, `groups/${groupId}`), { name: newTitle.trim() });
      setGroupData(prev => ({ ...prev, name: newTitle.trim() }));
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating title:", error);
      alert("Failed to update title");
    }
  };
  const cancelEditing = () => {
    setNewTitle(groupData.name);
    setIsEditingTitle(false);
  };

  // פרסום פוסט חדש
  const handleNewPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Title and content cannot be empty");
      return;
    }
    if (!currentUser) {
      alert("You must be logged in to post");
      return;
    }
    const postRef = ref(database, `groupPosts/${groupId}`);
    const newPost = {
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      userId: currentUser.uid,
      firstName: currentUser.displayName?.split(" ")[0] || "Unknown",
      lastName: currentUser.displayName?.split(" ")[1] || "",
      image: currentUser.photoURL || "",
      createdAt: new Date().toISOString(),
    };
    try {
      await push(postRef, newPost);
      setNewPostTitle("");
      setNewPostContent("");
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post");
    }
  };

  // מחיקת פוסט (רק למחבר הפוסט או מנהל)
  const handleDeletePost = async (postId, postUserId) => {
    if (!currentUser) return;
    if (currentUser.uid !== postUserId && currentUser.uid !== groupData.adminId) {
      alert("You don't have permission to delete this post");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await update(ref(database, `groupPosts/${groupId}/${postId}`), null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  // עריכת פוסט
  const handleEditSavePost = async (postId, newTitle, newContent) => {
    try {
      await update(ref(database, `groupPosts/${groupId}/${postId}`), {
        title: newTitle,
        content: newContent,
      });
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Failed to save post");
    }
  };

  // ניווט לפרופיל משתמש - תוכל לשנות את הלוגיקה לפי צורך
  const handleUserClick = (userId) => {
    // לדוגמה: ניווט לדף פרופיל
    window.location.href = `/profile/${userId}`;
  };

  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (!groupData) return <p className="text-center mt-5">Group not found</p>;

  return (
    <div className="container mt-5" style={{ maxWidth: 700 }}>
      <div className="card shadow-sm p-4 mb-4">
        {/* כותרת הקבוצה או שדה עריכה */}
        {isAdmin && isEditingTitle ? (
          <div className="mb-3">
            <input
              type="text"
              className="form-control mb-2"
              value={newTitle}
              onChange={handleTitleChange}
              autoFocus
            />
            <button className="btn btn-success me-2" onClick={saveNewTitle}>Save</button>
            <button className="btn btn-secondary" onClick={cancelEditing}>Cancel</button>
          </div>
        ) : (
          <h2 className="mb-3 d-flex align-items-center justify-content-between">
            <span>{groupData.name}</span>
            {isAdmin && (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setIsEditingTitle(true)}
              >
                Edit Title
              </button>
            )}
          </h2>
        )}

        <p><strong>Description:</strong> {groupData.description || "No description provided."}</p>
        <p><strong>Admin ID:</strong> {groupData.adminId}</p>
        <p><strong>Created At:</strong> {new Date(groupData.createdAt).toLocaleString()}</p>

        {isAdmin && (
          <div className="mt-4">
            <h5>Admin Controls</h5>
            <button
              className="btn btn-success"
              onClick={() => alert("Manage members functionality not implemented yet")}
            >
              Manage Members
            </button>
          </div>
        )}
      </div>

      {/* טופס פרסום פוסט חדש */}
      {currentUser && (
        <div className="card p-3 mb-4 shadow-sm bg-light">
          <h5>Create New Post</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Post Title"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
          />
          <textarea
            className="form-control mb-2"
            rows={3}
            placeholder="Post Content"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleNewPost}>
            Post
          </button>
        </div>
      )}

      {/* רשימת הפוסטים */}
      <div>
        {posts.length === 0 ? (
          <p>No posts yet</p>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              user={currentUser}
              onDelete={() => handleDeletePost(post.id, post.userId)}
              onEditSave={handleEditSavePost}
              onUserClick={handleUserClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupPage;
