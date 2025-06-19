import React, { useState } from "react";

export default function PostForm({ user, onPostCreated }) {
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!user || postTitle.trim() === "" || postContent.trim() === "") {
      alert("Please fill in all fields and ensure you're logged in.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: "post",
          data: {
            userId: user.uid,
            firstName: user.displayName?.split(" ")[0],
            lastName: user.displayName?.split(" ")[1] || "",
            title: postTitle,
            content: postContent,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      const result = await response.json();
      alert("Post uploaded successfully!");
      onPostCreated(result.post);

      setPostTitle("");
      setPostContent("");
    } catch (error) {
      console.error("Error uploading post:", error);
      alert("Error uploading post: " + error.message);
    }
  };

  return (
    <form onSubmit={handlePostSubmit} className="mb-4 shadow p-3 rounded bg-white">
      <h5>Create a new post</h5>
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Post title"
        value={postTitle}
        onChange={(e) => setPostTitle(e.target.value)}
      />
      <textarea
        className="form-control mb-2"
        placeholder="Post content"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
        rows={3}
      />
      <button type="submit" className="btn btn-primary">
        Post
      </button>
    </form>
  );
}
