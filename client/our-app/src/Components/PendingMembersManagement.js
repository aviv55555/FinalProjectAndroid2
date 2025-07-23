"use client";
import React, { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { database } from "./FireBase";
/**
 * PendingMembersManagement is a component that manages the approval process
 * for users who requested to join a group and are currently pending.
 * It fetches the list of pending members from Database for the given groupId,
 * and displays them with options to either approve or reject each user.
 * Approving moves the user from pendingMembers to members in the database,
 * while rejecting simply removes the user from pendingMembers.
 */

export default function PendingMembersManagement({ groupId, onApprove, onReject }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingUsersDetails, setPendingUsersDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const pendingRef = ref(database, `groupPending/${groupId}`);
    const unsubscribe = onValue(pendingRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.entries(data).map(([userId, info]) => ({
        userId,
        ...info,
      }));
      setPendingUsers(users);

      // Fetch user details (firstName, lastName)
      const details = {};
      await Promise.all(
        users.map(async ({ userId }) => {
          try {
            const userSnap = await get(ref(database, `users/${userId}`));
            if (userSnap.exists()) {
              const { firstName = "", lastName = "" } = userSnap.val();
              details[userId] = `${firstName} ${lastName}`.trim() || "Unknown User";
            } else {
              details[userId] = "Unknown User";
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
            details[userId] = "Unknown User";
          }
        })
      );
      setPendingUsersDetails(details);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) return <p>Loading pending members...</p>;
  if (pendingUsers.length === 0) return <p>No pending members.</p>;

  return (
    <div className="card shadow-sm p-3 mb-4" style={{ maxHeight: "80vh", overflowY: "auto" }}>
      <h5>Pending Join Requests</h5>
      <ul className="list-group">
        {pendingUsers.map(({ userId, requestedAt }) => (
          <li key={userId} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{pendingUsersDetails[userId] || userId}</strong><br />
              {requestedAt && <small>Requested at: {new Date(requestedAt).toLocaleString()}</small>}
            </div>
            <div>
              <button className="btn btn-success btn-sm me-2" onClick={() => onApprove(userId)}>
                Approve
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onReject(userId)}>
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
