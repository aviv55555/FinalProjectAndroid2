"use client";
import { useEffect, useState } from "react";
import { ref, get, update } from "firebase/database";
import { database, auth } from "./FireBase"; 
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import './Profile.css';
/*
  Profile component displaying user details: personal info, followers, groups, and planned trips.
  Fetches data from Firebase and an Express server, supports follow/unfollow, navigation to chat and profile editing.
*/

const Profile = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [groupsMember, setGroupsMember] = useState([]);
  const [groupsAdmin, setGroupsAdmin] = useState([]);
  const [trips, setTrips] = useState([]); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUserId(user.uid);
      else setCurrentUserId(null);
    });
    return () => unsubscribe();
  }, []);

  const getGroupsForUser = async (userId) => {
    const groupMembersRef = ref(database, "groupMembers");
    const snapshot = await get(groupMembersRef);
    if (!snapshot.exists()) return [];

    const allGroups = snapshot.val();
    const userGroups = [];

    for (const [groupId, users] of Object.entries(allGroups)) {
      if (users && userId in users) {
        const groupSnap = await get(ref(database, `groups/${groupId}`));
        const groupData = groupSnap.exists() ? groupSnap.val() : { name: "Unknown Group" };
        userGroups.push({ id: groupId, name: groupData.name || "Unnamed Group" });
      }
    }

    return userGroups;
  };

  const fetchTrips = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/trips?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch trips');
      const data = await res.json();
      setTrips(data.trips || []);
    } catch (err) {
      console.error("Error fetching trips:", err);
      setTrips([]);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData(data);

          setFollowersList(data.followers ? Object.keys(data.followers) : []);
          setFollowingList(data.following ? Object.keys(data.following) : []);
          setIsFollowing(data.followers && currentUserId && currentUserId in data.followers);

          const groups = await getGroupsForUser(userId);
          setGroupsMember(groups);

          const adminSnap = await get(ref(database, `groupsAdmin/${userId}`));
          if (adminSnap.exists()) {
            const groupsObj = adminSnap.val();
            const groupsArray = Object.entries(groupsObj).map(([id, data]) => ({
              id,
              name: typeof data === "string" ? data : data.name || "Unnamed Group",
            }));
            setGroupsAdmin(groupsArray);
          } else {
            setGroupsAdmin([]);
          }

          await fetchTrips(userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, currentUserId]);

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === userId) return;

    const updates = {};
    if (isFollowing) {
      updates[`users/${userId}/followers/${currentUserId}`] = null;
      updates[`users/${currentUserId}/following/${userId}`] = null;
    } else {
      updates[`users/${userId}/followers/${currentUserId}`] = true;
      updates[`users/${currentUserId}/following/${userId}`] = true;
    }

    try {
      await update(ref(database), updates);
      setIsFollowing(!isFollowing);

      setFollowersList((prev) =>
        isFollowing ? prev.filter((id) => id !== currentUserId) : [...prev, currentUserId]
      );
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatTripDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IL", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) return <p>Loading...</p>;
  if (!userData) return <p>User not found.</p>;

  const isOwnProfile = currentUserId === userId;

const handleDeleteTrip = async (tripId) => {
  if (!window.confirm("Are you sure you want to delete this trip?")) return;

  try {
    const response = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete trip");
    }

    setTrips((prevTrips) => prevTrips.filter((trip) => trip._id !== tripId));
    alert("Trip deleted successfully!");
  } catch (error) {
    console.error("Error deleting trip:", error);
    alert("Error deleting trip: " + error.message);
  }
};
  return (
    <div className="container mt-4 profile-container">
      <div className="card shadow-sm p-4 profile-card">
        <div className="text-center">
          {userData.image ? (
            <img src={userData.image} alt="Profile" className="profile-image" />
          ) : (
            <div className="profile-image-placeholder" />
          )}

          <h2 className="profile-name">{userData.firstName} {userData.lastName}</h2>
          <p className="profile-email">{userData.email}</p>

          <div className="d-flex justify-content-center profile-follow-info mb-3">
            <div className="text-center">
              <div>{followersList.length}</div>
              <div className="profile-follow-subtext">Followers</div>
            </div>
            <div className="text-center">
              <div>{followingList.length}</div>
              <div className="profile-follow-subtext">Following</div>
            </div>
          </div>

          <p className="profile-date">
            Member since: <strong>{formatDate(userData.createdAt)}</strong>
          </p>
          {!isOwnProfile && currentUserId && (
            <div className="profile-buttons d-flex flex-column align-items-center gap-2">
              <button
                className={`btn ${isFollowing ? "btn-outline-danger" : "btn-primary"} px-4`}
                style={{ borderRadius: 25, fontWeight: 600 }}
                onClick={handleFollowToggle}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>

              <button
                className="btn btn-outline-secondary px-4"
                style={{ borderRadius: 25, fontWeight: 600 }}
                onClick={() => navigate(`/chat/${userId}`)}
              >
                Message
              </button>
            </div>
          )}
        </div>

        {isOwnProfile && (
          <button className="btn btn-warning profile-edit-btn" onClick={() => navigate(`/edit-profile/${userId}`)}>
            Edit Profile
          </button>
        )}

        <div className="profile-groups-section">
          <h5>Groups Member Of</h5>
          {groupsMember.length === 0 ? (
            <p className="text-muted">No groups joined.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {groupsMember.map((group) => (
                <li key={group.id} className="list-group-item px-0">
                  <a href={`/group/${group.id}`} className="text-decoration-none text-primary fw-bold">
                    {group.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="profile-groups-section">
          <h5>Groups Admin Of</h5>

          {isOwnProfile && (
            <div className="mb-3">
              <button
                className="btn btn-success"
                onClick={() => navigate(`/create-group/${userId}`)}
              >
                + Create New Group
              </button>
            </div>
          )}

          {groupsAdmin.length === 0 ? (
            <p className="text-muted">No groups managed.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {groupsAdmin.map((group) => (
                <li key={group.id} className="list-group-item px-0">
                  <a href={`/group/${group.id}`} className="text-decoration-none text-primary fw-bold">
                    {group.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="profile-trips-section mt-4">
         <div className="profile-trips-section mt-4">
  <h5>My Planned Trips</h5>
  {trips.length === 0 ? (
  <p className="text-muted">No trips planned yet.</p>
) : (
  trips.map((trip) => (
    <div key={trip._id} className="card mb-3">
      <div className="card-body">
        <p>
          <strong>Trip dates:</strong> {formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}
        </p>
        <p><strong>Countries and Cities to visit:</strong></p>
        <ul>
          {trip.points.map((point, idx) => (
            <li key={idx}>
              {point.country}
              {point.city ? ` - ${point.city}` : ""}
            </li>
          ))}
        </ul>
        {isOwnProfile && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => handleDeleteTrip(trip._id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  ))
)}

</div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
