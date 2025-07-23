import React, { useState } from "react";
import { Carousel } from "react-bootstrap";
import './Post.css';
/*
This Post component displays a single post with features for viewing, editing, and deleting.
- It shows the author's name and profile image.
- If the current user is the post's author, they can edit or delete the post.
- When editing, input fields replace the text to allow changes.
- Media (images/videos) attached to the post are shown in a carousel slider for easy browsing.
- Dates are formatted to a readable string.
- The component handles user interactions like clicking on the author's name and saving or canceling edits.
- It uses React Bootstrap's Carousel component to display multiple media items in slides.
*/

export default function Post({ post, user,isAdmin, onDelete, onEditSave, onUserClick, userImage }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);

  const postId = post._id || post.id;
  const isAuthor = user && user.uid === post.userId;
  const canModify = isAuthor || isAdmin;
  const handleEditClick = () => {
    setIsEditing(true);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleSave = async () => {
    if (editTitle.trim() === "" || editContent.trim() === "") {
      alert("Title and content cannot be empty.");
      return;
    }
    try {
      await onEditSave(postId, editTitle, editContent, user.uid);
      setIsEditing(false);
    } catch (error) {
      alert("Error saving post: " + error.message);
    }
  };

  const handleDeleteClick = async () => {
    try {
      await onDelete(postId, user.uid);
      alert("Post deleted successfully!");
    } catch (error) {
      alert("Error deleting post: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date available";
    const date = new Date(dateString);
    return date.toLocaleString("default", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="post-container">
      <div className="post-header" onClick={() => onUserClick(post.userId)}>
  {userImage ? (
    <img src={userImage} alt="User profile" className="post-profile-image" />
  ) : (
    <img src="/default-profile.png" alt="Default profile" className="post-profile-image" />
  )}
  <span className="post-author-name">
    {post.firstName} {post.lastName}
  </span>
</div>
      {isEditing ? (
        <>
          <input
            type="text"
            className="form-control mb-2"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <textarea
            className="form-control mb-2"
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <button className="btn btn-success me-2" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={handleCancelEdit}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <h5 className="post-title">{post.title}</h5>
          <p className="post-content">{post.content}</p>
          {post.media?.length > 0 && (
            <Carousel
  indicators={post.media.length > 1}
  controls={post.media.length > 2}
  interval={null}
>
  {Array.from({ length: Math.ceil(post.media.length / 2) }).map((_, i) => (
    <Carousel.Item key={i}>
      <div className="d-flex justify-content-center gap-3">
        {post.media.slice(i * 2, i * 2 + 2).map((item, idx) =>
          item.type?.startsWith("video/") ? (
            <video
              key={idx}
              src={item.url}
              controls
              className="post-media-item"
            />
          ) : (
            <img
              key={idx}
              src={item.url}
              alt={`Media ${idx}`}
              className="post-media-item"
            />
          )
        )}
      </div>
    </Carousel.Item>
  ))}
</Carousel>)}
          
          <div className="post-footer mt-2">
            <small className="post-date">
              {formatDate(post.createdAt || post.stampDate)}
            </small>
            {canModify && (
  <div className="post-actions">
    {isAuthor && (
      <button className="btn btn-sm btn-primary me-2" onClick={handleEditClick}>
        Edit
      </button>
    )}
    <button className="btn btn-sm btn-danger" onClick={handleDeleteClick}>
      Delete
    </button>
  </div>
)}
          </div>
        </>
      )}
    </div>
    
  );
}
