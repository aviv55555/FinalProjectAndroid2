import React from "react";
import Post from "./Post";
/**
 * GroupPostList is a presentational component responsible for rendering a list of group posts.
 * It receives an array of posts and maps each one to a <Post /> component.
 * The component handles delete and edit events through callback props passed from the parent.
 * If no posts are found, it displays a fallback message.
 */

export default function GroupPostList({ posts, currentUser, onDelete, onEditSave, onUserClick }) {
  if (posts.length === 0) return <p>No posts found.</p>;

  return posts.map((post) => (
    <Post
      key={post.id}
      post={post}
      user={currentUser}
      onDelete={() => onDelete(post.id, post.userId)}
      onEditSave={onEditSave}
      onUserClick={onUserClick}
    />
  ));
}