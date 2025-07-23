import React, { useState } from "react";
/*
PostForm allows a logged-in user to create a new post with a title, text content, and multiple media files (images or videos).
- It manages internal state for all inputs and handles file selection with preview.
- Media files are uploaded asynchronously to Cloudinary before the post is sent to the backend API.
- The file input is reset using a key to allow clearing the selection visually.
*/
export default function PostForm({ user, onPostCreated }) {
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(Date.now()); 

  const handleFileChange = (e) => {
  setMediaFiles(Array.from(e.target.files)); 
};
  const uploadMultipleFilesToCloudinary = async (files) => {
  return Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "MediaTravel");

      const res = await fetch("https://api.cloudinary.com/v1_1/dtlt1pphc/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload media");

      const data = await res.json();
      return {
        url: data.secure_url,
        type: file.type,
      };
    })
  );
};

  const handlePostSubmit = async (e) => {
  e.preventDefault();

  if (!user || postTitle.trim() === "" || postContent.trim() === "") {
    alert("Please fill in all fields and ensure you're logged in.");
    return;
  }

  setUploading(true);

  try {
    let uploadedMedia = [];

    if (mediaFiles.length > 0) {
      uploadedMedia = await uploadMultipleFilesToCloudinary(mediaFiles);
    }

    const response = await fetch("http://localhost:3000/api/posts", {
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
          media: uploadedMedia,
          createdAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create post");
    }

    const result = await response.json();
    console.log("Created post:", result.post);

    if (!result.post._id && result.post.id) {
      result.post._id = result.post.id;
    }

    onPostCreated(result.post);
    alert("Post uploaded successfully!");

    setPostTitle("");
    setPostContent("");
    setMediaFiles([]);
    setInputKey(Date.now()); 
  } catch (error) {
    console.error("Error uploading post:", error);
    alert("Error uploading post: " + error.message);
  } finally {
    setUploading(false);
  }
};

  return (
    <form onSubmit={handlePostSubmit} className="mb-4 shadow p-3 rounded bg-white">
      <h5>Create a New Post</h5>
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

      <input
      key={inputKey}
        type="file"
        accept="image/*,video/*" 
        className="form-control mb-2"
        onChange={handleFileChange}
        multiple
      />

{mediaFiles.length > 0 && (
  <div className="preview-container mb-3 d-flex flex-wrap gap-2">
    {mediaFiles.map((file, index) => {
      const fileURL = URL.createObjectURL(file);
      return file.type.startsWith("video/") ? (
        <video
          key={index}
          src={fileURL}
          width={120}
          height={80}
          controls
          className="rounded border"
        />
      ) : (
        <img
          key={index}
          src={fileURL}
          alt={`preview-${index}`}
          width={120}
          height={80}
          className="rounded border object-fit-cover"
        />
      );
    })}
  </div>
)}
      <button type="submit" className="btn btn-primary" disabled={uploading}>
        {uploading ? "Uploading..." : "Post"}
      </button>
    </form>
  );
}
