import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, get, child } from "firebase/database";
import { useNavigate } from "react-router-dom";
/**
 * This component fetches and displays all user-created groups from Database.
 * For each group, it also retrieves the admin's full name using the adminId.
 * Groups are displayed in Bootstrap cards with interactive hover effects.
 * Clicking a group navigates the user to the individual group page.
 */

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroupsWithAdmins = async () => {
      const db = getDatabase();
      const groupsRef = ref(db, "groups");

      onValue(groupsRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setGroups([]);
          return;
        }

        const groupsArray = await Promise.all(
          Object.entries(data).map(async ([id, groupData]) => {
            let adminName = "Unknown";

            if (groupData.adminId) {
              try {
                const userSnapshot = await get(
                  child(ref(db), `users/${groupData.adminId}`)
                );
                if (userSnapshot.exists()) {
                  const userData = userSnapshot.val();
                  adminName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
                }
              } catch (error) {
                console.error("Error fetching admin user:", error);
              }
            }

            return {
              id,
              ...groupData,
              adminName,
            };
          })
        );

        setGroups(groupsArray);
      });
    };

    fetchGroupsWithAdmins();
  }, []);

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className="container">
      <h2 className="mb-4">All Groups</h2>
      {groups.length === 0 ? (
        <p>No groups found.</p>
      ) : (
        <div className="row g-4">
          {groups.map((group) => (
            <div key={group.id} className="col-md-6 col-lg-4">
              <div
                className="card h-100 shadow-sm"
                style={{
                  borderRadius: "15px",
                  border: "2px solid #007bff",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onClick={() => handleGroupClick(group.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-primary mb-3">{group.name}</h5>
                  <p className="card-text flex-grow-1">{group.description}</p>
                  <p className="text-muted mb-0">
                    <strong>Admin:</strong> {group.adminName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;
