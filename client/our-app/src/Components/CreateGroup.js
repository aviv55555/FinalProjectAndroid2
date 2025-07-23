"use client";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, set, push } from "firebase/database";
import { database } from "./FireBase";
import 'bootstrap/dist/css/bootstrap.min.css';
import './CreateGroup.css';
/**
 * CreateGroup component provides a form for authenticated users to create new groups.
 * It collects group name and optional description, validates input,
 * generates a unique group ID, saves group data and membership in Database,
 * shows success or error messages, and redirects the user to their profile upon creation.
 */

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
      const newGroupRef = push(ref(database, "groups"));
      const groupId = newGroupRef.key;

      const groupData = {
        name: groupName,
        description,
        adminId: userId,
        createdAt: new Date().toISOString()
      };

      await set(newGroupRef, groupData);
      await set(ref(database, `groupMembers/${groupId}/${userId}`), {
        joinedAt: new Date().toISOString(),
      });
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
    <div className="container create-group-container">
  <div className="create-group-card">
    <h3 className="create-group-title">Create New Group</h3>
    <form onSubmit={handleCreate}>
      <div className="form-group create-group-input">
        <label className="create-group-label">Group Name</label>
        <input
          type="text"
          className="form-control"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
      </div>
      <div className="form-group create-group-textarea">
        <label className="create-group-label">Description (optional)</label>
        <textarea
          className="form-control"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />
      </div>

      {error && <div className="alert alert-danger create-group-alert">{error}</div>}
      {success && <div className="alert alert-success create-group-alert">Group created successfully!</div>}

      <button type="submit" className="btn btn-success create-group-button">
        Create Group
      </button>
    </form>
  </div>
</div>
  );
};

export default CreateGroup;
