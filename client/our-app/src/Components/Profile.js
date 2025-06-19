"use client";
import { useEffect, useState } from "react";
import { ref, get, update } from "firebase/database";
import { database, auth } from "./FireBase"; // ודא ש-auth מיוצא מ-FireBase.js
import { useParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [groupsMember, setGroupsMember] = useState([]);
  const [groupsAdmin, setGroupsAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // קבלת משתמש מחובר
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUserId(user.uid);
      else setCurrentUserId(null);
    });
    return () => unsubscribe();
  }, []);

  // טען פרטי משתמש, עוקבים, נעקבים, קבוצות חבר וקבוצות מנהל
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

          // עוקבים ונעקבים (המרה ממפת מפתחות לרשימה)
          setFollowersList(data.followers ? Object.keys(data.followers) : []);
          setFollowingList(data.following ? Object.keys(data.following) : []);
          setIsFollowing(data.followers && currentUserId && currentUserId in data.followers);

          // טען קבוצות חבר בהן
          const memberSnap = await get(ref(database, `groupsMember/${userId}`));
          setGroupsMember(memberSnap.exists() ? Object.values(memberSnap.val()) : []);

          // טען קבוצות מנהל
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

        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, currentUserId]);

  // טיפול בלחיצה על כפתור Follow/Unfollow
  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === userId) return;

    const updates = {};
    if (isFollowing) {
      // להסיר עוקב
      updates[`users/${userId}/followers/${currentUserId}`] = null;
      updates[`users/${currentUserId}/following/${userId}`] = null;
    } else {
      // להוסיף עוקב
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

  // פורמט תאריך Member since בפורמט מילולי באנגלית
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) return <p>Loading...</p>;
  if (!userData) return <p>User not found.</p>;

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <div className="card shadow-sm p-4">
        <div className="text-center">
          {userData.image ? (
            <img
              src={userData.image}
              alt="Profile"
              className="rounded-circle mb-3"
              style={{ width: 150, height: 150, objectFit: "cover" }}
            />
          ) : (
            <div
              className="rounded-circle mb-3"
              style={{ width: 150, height: 150, backgroundColor: "#f0f0f0" }}
            />
          )}

          <h2 className="mb-1">{userData.firstName} {userData.lastName}</h2>
          <p className="text-muted mb-2">{userData.email}</p>

          {/* Followers & Following side by side - Instagram style */}
          <div className="d-flex justify-content-center gap-5 mb-3" style={{ fontWeight: 600, fontSize: 16 }}>
            <div className="text-center">
              <div>{followersList.length}</div>
              <div className="text-muted" style={{ fontWeight: 400, fontSize: 14 }}>Followers</div>
            </div>
            <div className="text-center">
              <div>{followingList.length}</div>
              <div className="text-muted" style={{ fontWeight: 400, fontSize: 14 }}>Following</div>
            </div>
          </div>

          {/* Member since */}
          <p className="text-muted mb-3" style={{ fontSize: 14 }}>
            Member since: <strong>{formatDate(userData.createdAt)}</strong>
          </p>

          {/* Follow / Unfollow button */}
          {!isOwnProfile && currentUserId && (
            <button
              className={`btn ${isFollowing ? "btn-outline-danger" : "btn-primary"} px-4`}
              style={{ borderRadius: 25, fontWeight: 600 }}
              onClick={handleFollowToggle}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>

        {isOwnProfile && (
        <button
          className="btn btn-warning px-4 mb-3"
          style={{ borderRadius: 25, fontWeight: 600 }}
          onClick={() => {
          navigate(`/edit-profile/${userId}`);
          // כאן אפשר להוסיף לוגיקה לעריכה או ניווט לעמוד עריכה
        }}
        >
          Edit Profile
        </button>
        )}

        {/* Groups Member Of */}
        <div className="mt-4">
          <h5>Groups Member Of</h5>
          {groupsMember.length === 0 ? (
            <p className="text-muted">No groups joined.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {groupsMember.map((group, idx) => (
                <li key={idx} className="list-group-item px-0">{group}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Groups Admin Of */}
<div className="mt-4">
  <h5>Groups Admin Of</h5>

  {/* כפתור יצירת קבוצה חדשה */}
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
  {groupsAdmin.map((group, idx) => (
    <li key={idx} className="list-group-item px-0">
      <a href={`/group/${group.id}`} className="text-decoration-none text-primary fw-bold">
        {group.name}
      </a>
    </li>
  ))}
</ul>

  )}
</div>

      </div>
    </div>
  );
};

export default Profile; 