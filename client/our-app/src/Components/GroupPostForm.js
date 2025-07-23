import React from "react";
/**
 * GroupPostForm is a reusable form component used to create new posts within a group.
 * It includes controlled inputs for the post's title and content, and a submission button.
 */

export default function GroupPostForm({ title, content, onChangeTitle, onChangeContent, onSubmit }) {
  return (
    <div className="card p-3 mb-4 shadow-sm bg-light">
      <h5>Create New Comment</h5>
      <input
        className="form-control mb-2"
        placeholder="Post Title"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
      />
      <textarea
        className="form-control mb-2"
        rows={3}
        placeholder="Post Content"
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
      />
      <button className="btn btn-primary" onClick={onSubmit}>
        Post
      </button>
    </div>
  );
}
