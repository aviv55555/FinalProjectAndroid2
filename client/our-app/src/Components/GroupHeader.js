import React from "react";
/**
 * GroupHeader component displays group information including the group name,
 * description, and creation date. If the user is an admin and in editing mode,
 * it shows an editable input field for changing the group title along with Save
 * and Cancel buttons. Otherwise, it shows the group name with an Edit button for
 * admins to toggle editing mode. This component uses callback props to handle
 * title changes, saving, canceling, and toggling edit mode.
 */
export default function GroupHeader({ groupData, isAdmin, isEditingTitle, newTitle, onChangeTitle, onSave, onCancel, onEditClick }) {
  return (
    <>
      {isAdmin && isEditingTitle ? (
        <>
          <input
            value={newTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="form-control mb-2"
          />
          <button className="btn btn-success me-2" onClick={onSave}>Save</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </>
      ) : (
        <h2 className="d-flex justify-content-between align-items-center">
          <span>{groupData.name}</span>
          {isAdmin && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onEditClick}
            >
              Edit Title
            </button>
          )}
        </h2>
      )}
      <p><strong>Description:</strong> {groupData.description || "No description."}</p>
      <p><strong>Created At:</strong> {new Date(groupData.createdAt).toLocaleString()}</p>
    </>
  );
}
