"use client";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, set, push } from "firebase/database";
import { database } from "./FireBase";
import 'bootstrap/dist/css/bootstrap.min.css';

const CreateGroup = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!groupName.trim()) {
      setError("Group name is required.");
      return;
    }

    try {
      // צור groupId חדש אוטומטית
      const newGroupRef = push(ref(database, "groups"));
      const groupId = newGroupRef.key;

      const groupData = {
        name: groupName,
        description,
        adminId: userId,
        createdAt: new Date().toISOString()
      };

      // שמירה במסד
      await set(newGroupRef, groupData);
      await set(ref(database, `groupsAdmin/${userId}/${groupId}`), groupName);

      setSuccess(true);
      setGroupName("");
      setDescription("");

      setTimeout(() => {
        navigate(`/profile/${userId}`);
      }, 1500);
    } catch (err) {
      console.error("Error creating group:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <div className="card shadow-sm p-4">
        <h3 className="mb-4 text-center">Create New Group</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group mb-3">
            <label>Group Name</label>
            <input
              type="text"
              className="form-control"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-4">
            <label>Description (optional)</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">Group created successfully!</div>}

          <button type="submit" className="btn btn-success w-100">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
