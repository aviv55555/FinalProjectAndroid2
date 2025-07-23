import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "./FireBase";
import './ManageMembers.css';
/**
 * ManageMembers component fetches and displays a list of group members including the admin.
 * It fetches each member's details (name and profile image) from Firebase Realtime Database.
 * The admin is displayed separately at the top with a distinct style.
 * Non-admin members are listed with a "Remove" button next to each, allowing the admin
 * to remove them from the group via the passed onRemoveMember callback.
 */
export default function ManageMembers({ members, adminId, onRemoveMember }) {
  const [membersData, setMembersData] = useState({});

  useEffect(() => {
    async function fetchMembersData() {
      const data = {};
      for (const uid of members) {
        try {
          const snap = await get(ref(database, `users/${uid}`));
          if (snap.exists()) {
            data[uid] = snap.val();
          } else {
            data[uid] = { firstName: "Unknown", lastName: "", image: "" };
          }
        } catch {
          data[uid] = { firstName: "Unknown", lastName: "", image: "" };
        }
      }
      setMembersData(data);
    }
    fetchMembersData();
  }, [members]);

  return (
    <div className="manage-members-container">
  <h5 className="manage-members-title">Manage Members</h5>

  {members.length === 0 ? (
    <p>No members in this group.</p>
  ) : (
    <ul className="manage-members-list">
      {adminId && membersData[adminId] && (
        <li className="manage-members-item admin" key={adminId}>
          <div className="member-info">
            {membersData[adminId].image ? (
              <img
                src={membersData[adminId].image}
                alt={`${membersData[adminId].firstName} ${membersData[adminId].lastName}`}
                className="member-avatar admin"
              />
            ) : (
              <div className="member-avatar admin" />
            )}
            <span>
              {membersData[adminId].firstName} {membersData[adminId].lastName} (Admin)
            </span>
          </div>
        </li>
      )}

      {members
        .filter((uid) => String(uid) !== String(adminId))
        .map((uid) => (
          <li className="manage-members-item" key={uid}>
            <div className="member-info">
              {membersData[uid]?.image ? (
                <img
                  src={membersData[uid].image}
                  alt={`${membersData[uid].firstName} ${membersData[uid].lastName}`}
                  className="member-avatar"
                />
              ) : (
                <div className="member-avatar" />
              )}
              <span>
                {membersData[uid]?.firstName} {membersData[uid]?.lastName}
              </span>
            </div>
            <button
              className="btn btn-danger btn-sm remove-btn"
              onClick={() => onRemoveMember(uid)}
            >
              Remove
            </button>
          </li>
        ))}
    </ul>
  )}
</div>

  );
}
