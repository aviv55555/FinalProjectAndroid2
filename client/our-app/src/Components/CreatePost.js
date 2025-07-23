import React, { useState } from "react";
/**
 * CreatePost component allows users to create a new post with optional
 * title, content, and media (image or video). It handles media file selection,
 * previews the media, uploads it to a server endpoint. It provides
 * feedback on uploading state and input validation.
 */

export default function CreatePost({ onCreatePost }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim() && !mediaFile) {
      alert("You must enter title, content, or media.");
      return;
    }

    setUploading(true);

    let mediaUrl = "";
    let mediaType = "";

    if (mediaFile) {
      const formData = new FormData();
      formData.append("file", mediaFile);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        mediaUrl = data.url;
        mediaType = mediaFile.type.startsWith("video") ? "video" : "image";
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload media.");
        setUploading(false);
        return;
      }
    }

    onCreatePost({
      title,
      content,
      mediaUrl,
      mediaType,
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setContent("");
    setMediaFile(null);
    setPreviewUrl("");
    setUploading(false);
  };

  return (
    <div className="card p-3 mb-4 shadow-sm bg-light">
      <h5>Create New Post</h5>
      <input
        type="text"
        className="form-control mb-2"
        placeholder="Post Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="form-control mb-2"
        rows={3}
        placeholder="Post Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <input
        type="file"
        accept="image/,video/"
        className="form-control mb-2"
        onChange={handleFileChange}
      />

      {previewUrl && (
        <div className="mb-2">
          {mediaFile?.type.startsWith("video") ? (
            <video src={previewUrl} controls style={{ width: "100%", maxHeight: 300 }} />
          ) : (
            <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />
          )}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Post"}
      </button>
    </div>
  );
}
