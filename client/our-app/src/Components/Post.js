import React, { useState } from "react";

export default function Post({ post, user, onDelete, onEditSave, onUserClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);

  const postId = post._id || post.id;
  const isAuthor = user && user.uid === post.userId;

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
    await onEditSave(postId, editTitle, editContent);
    setIsEditing(false);
  };

  // פונקציית formatDate - חובה להוסיף אותה כאן!
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
    <div className="mb-3 p-3 shadow rounded bg-white">
      <div
        className="d-flex align-items-center gap-3 mb-2"
        style={{ cursor: "pointer" }}
        onClick={() => onUserClick(post.userId)}
      >
        {post.image ? (
          <img
            src={post.image}
            alt="User"
            style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              backgroundColor: "#e0e0e0",
            }}
          />
        )}
        <span className="fw-semibold">
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
          <h5>{post.title}</h5>
          <p>{post.content}</p>
          <small className="text-muted">{formatDate(post.createdAt || post.stampDate)}</small>
          {isAuthor && (
            <div className="mt-2">
              <button className="btn btn-sm btn-primary me-2" onClick={handleEditClick}>
                Edit
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(postId)}>
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
