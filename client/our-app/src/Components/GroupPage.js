"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, update, push, onValue, remove } from "firebase/database";
import { database, auth } from "./FireBase";
import { onAuthStateChanged } from "firebase/auth";
import AdvancedSearch from "./AdvancedSearch";
import Post from "./Post";
import ManageMembers from "./ManageMembers"; 
import { useNavigate } from "react-router-dom";
import PendingMembersManagement from "./PendingMembersManagement";
import RequestJoinButton from "./RequestJoinButton";

/**
 * GroupPage component displays a full group interface including group information,
 * posts, member management, and join requests for only manager. It
 * enables post creation and filtering, and lets admins manage join requests and members.
 */
export default function GroupPage() {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [wasRejected, setWasRejected] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(true);

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [searchByUserName, setSearchByUserName] = useState("");
  const [searchByPostText, setSearchByPostText] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingUsersDetails, setPendingUsersDetails] = useState({});
  const [pendingLoading, setPendingLoading] = useState(true);


  const [showManageMembers, setShowManageMembers] = useState(false);
  const [members, setMembers] = useState([]);

  const [adminName, setAdminName] = useState("");

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [userImages, setUserImages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
  const fetchGroup = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(database, `groups/${groupId}`));
      if (snap.exists()) {
        const data = snap.val();
        setGroupData(data);
        setIsAdmin(currentUser?.uid === data.adminId);

        if (data.adminId) {
          const userSnap = await get(ref(database, `users/${data.adminId}`));
          if (userSnap.exists()) {
            const { firstName = "", lastName = "" } = userSnap.val();
            setAdminName(`${firstName} ${lastName}`.trim());
          } else {
            setAdminName("Unknown");
          }
        }
      } else {
        setGroupData(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("Error fetching group:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchGroup();
}, [groupId, currentUser]);


  useEffect(() => {
    if (!currentUser) {
      setIsMember(false);
      setWasRejected(false);
      setMembershipLoading(false);
      return;
    }

    const memberRef = ref(database, `groupMembers/${groupId}/${currentUser.uid}`);
    const rejectedRef = ref(database, `groupRejected/${groupId}/${currentUser.uid}`);

    Promise.all([get(memberRef), get(rejectedRef)])
      .then(([memberSnap, rejectedSnap]) => {
        setIsMember(memberSnap.exists());
        setWasRejected(rejectedSnap.exists());
      })
      .catch((err) => {
        console.error("Error checking membership:", err);
      })
      .finally(() => setMembershipLoading(false));
  }, [currentUser, groupId]);

  useEffect(() => {
    if (!groupId) return;
    const membersRef = ref(database, `groupMembers/${groupId}`);
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setMembers(Object.keys(data));
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const postsRef = ref(database, `groupPosts/${groupId}`);
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const postsArray = Object.entries(data).map(([id, post]) => ({ id, ...post }));
      postsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(postsArray);
      setFilteredPosts(postsArray);
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (!isAdmin) return;

    setPendingLoading(true);
    const pendingRef = ref(database, `groupPending/${groupId}`);
    const unsubscribe = onValue(pendingRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const users = Object.entries(data).map(([userId, info]) => ({
        userId,
        ...info,
      }));
      setPendingUsers(users);

      const details = {};
      await Promise.all(
        users.map(async ({ userId }) => {
          const userSnap = await get(ref(database,`users/${userId}`));
          if (userSnap.exists()) {
            const { firstName = "", lastName = "" } = userSnap.val();
            details[userId] = `${firstName} ${lastName}`.trim() || "Unknown User";
          } else {
            details[userId] = "Unknown User";
          }
        })
      );

      setPendingUsersDetails(details);
      setPendingLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAdmin]);

  useEffect(() => {
    let filtered = posts;
    if (searchByUserName.trim()) {
      const query = searchByUserName.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.firstName?.toLowerCase().includes(query) ||
          post.lastName?.toLowerCase().includes(query)
      );
    }

    if (searchByPostText.trim()) {
      const query = searchByPostText.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query)
      );
    }

    if (searchDateFrom || searchDateTo) {
      filtered = filtered.filter((post) => {
        const postDate = new Date(post.createdAt);
        const from = searchDateFrom ? new Date(searchDateFrom) : null;
        const to = searchDateTo ? new Date(searchDateTo) : null;

        if (from && to) return postDate >= from && postDate <= to;
        if (from) return postDate >= from;
        if (to) return postDate <= to;
        return true;
      });
    }

    setFilteredPosts(filtered);
  }, [searchByUserName, searchByPostText, searchDateFrom, searchDateTo, posts]);

  const handleNewPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert("Title and content cannot be empty!");
      return;
    }
    if (!currentUser) {
      alert("You must be logged in to post");
      return;
    }
    if (!isMember && !isAdmin) {
      alert("Only group members can post.");
      return;
    }
    const postRef = ref(database, `groupPosts/${groupId}`);
    const newPost = {
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      userId: currentUser.uid,
      firstName: currentUser.displayName?.split(" ")[0] || "Unknown",
      lastName: currentUser.displayName?.split(" ")[1] || "",
      image: currentUser.photoURL || "",
      createdAt: new Date().toISOString(),
    };
    try {
      await push(postRef, newPost);
      setNewPostTitle("");
      setNewPostContent("");
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post");
    }
  };
useEffect(() => {
  async function fetchUserImages() {
    const uniqueUserIds = [...new Set(posts.map(post => post.userId))];
    const imagesMap = {};

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const userSnap = await get(ref(database, `users/${userId}`));
          if (userSnap.exists()) {
            imagesMap[userId] = userSnap.val().image || "";
          } else {
            imagesMap[userId] = "";
          }
        } catch (error) {
          console.error("Error fetching image for user", userId, error);
          imagesMap[userId] = "";
        }
      })
    );

    setUserImages(imagesMap);
  }

  if (posts.length > 0) {
    fetchUserImages();
  }
}, [posts]);

  const handleDeletePost = async (postId, postUserId) => {
  if (!currentUser) return;

  if (currentUser.uid !== postUserId && !isAdmin) {
    alert("You don't have permission to delete this post");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this post?")) return;

  try {
    await remove(ref(database, `groupPosts/${groupId}/${postId}`));
  } catch (error) {
    console.error("Error deleting post:", error);
    alert("Failed to delete post");
  }
};

  const handleEditSavePost = async (postId, newTitle, newContent) => {
    try {
      await update(ref(database,`groupPosts/${groupId}/${postId}`), {
        title: newTitle,
        content: newContent,
      });
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Failed to save post");
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await update(ref(database, `groupMembers/${groupId}/${userId}`), {
        joinedAt: new Date().toISOString(),
      });
      await remove(ref(database, `groupPending/${groupId}/${userId}`));
      setPendingUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user");
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await remove(ref(database, `groupPending/${groupId}/${userId}`));
      await update(ref(database, `groupRejected/${groupId}/${userId}`), {
        rejectedAt: new Date().toISOString(),
      });
      setPendingUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user");
    }
  };
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };
  const handleRemoveMember = async (userIdToRemove) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await remove(ref(database, `groupMembers/${groupId}/${userIdToRemove}`));
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };
  const handleDeleteGroup = async () => {
  if (!window.confirm("Are you sure you want to delete this group? This action is irreversible.")) return;

  try {
    await Promise.all([
      remove(ref(database, `groups/${groupId}`)),
      remove(ref(database, `groupMembers/${groupId}`)),
      remove(ref(database, `groupPosts/${groupId}`)),
      remove(ref(database, `groupPending/${groupId}`)),
      remove(ref(database, `groupRejected/${groupId}`)),
       remove(ref(database, `groupsAdmin/${groupData.adminId}/${groupId}`))
    ]);

    alert("Group deleted successfully.");
    window.location.href = "/groups"; 
  } catch (error) {
    console.error("Error deleting group:", error);
    alert("Failed to delete group");
  }
};
  if (loading || membershipLoading) return <p className="text-center mt-5">Loading...</p>;
  if (!groupData) return <p className="text-center mt-5">Group not found</p>;

  if (!isAdmin && !isMember) {
    return (
      <div className="container mt-5 text-center">
        <h3>{groupData.name}</h3>
        <p>{groupData.description}</p>
        <p className="text-danger">You are not a member of this group.</p>
        {wasRejected ? (
          <div>
            <p className="text-danger">Your join request was rejected.</p>
            {currentUser && (
              <RequestJoinButton groupId={groupId} userId={currentUser.uid} />
            )}
          </div>
        ) : currentUser ? (
          <RequestJoinButton groupId={groupId} userId={currentUser.uid} />
        ) : (
          <p>Please log in to request joining.</p>
        )}
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ maxWidth: "900px" }}>
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm p-4 mb-4">
            <h2>{groupData.name}</h2>
<div className="mb-2">
  <strong>Description:</strong>{" "}
  {isAdmin && isEditingDescription ? (
    <>
      <textarea
        className="form-control my-2"
        rows={3}
        value={editedDescription}
        onChange={(e) => setEditedDescription(e.target.value)}
      />
      <button
        className="btn btn-success btn-sm me-2"
        onClick={async () => {
          try {
            await update(ref(database, `groups/${groupId}`), {
              description: editedDescription.trim()
            });
            setGroupData((prev) => ({
              ...prev,
              description: editedDescription.trim()
            }));
            setIsEditingDescription(false);
          } catch (err) {
            console.error("Failed to update description:", err);
            alert("Error saving description");
          }
        }}
      >
        Save
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => {
          setIsEditingDescription(false);
          setEditedDescription(groupData.description || "");
        }}
      >
        Cancel
      </button>
    </>
  ) : (
    <>
      {groupData.description || "No description provided."}
    </>
  )}
</div>
            <p><strong>Admin:</strong> {adminName}</p>
            <p><strong>Created At:</strong> {new Date(groupData.createdAt).toLocaleString()}</p>
            {isAdmin && (
  <div className="d-flex gap-2 mt-2">
    <button
      className="btn btn-outline-primary"
      onClick={() => {
        setEditedDescription(groupData.description || "");
        setIsEditingDescription(true);
      }}
    >
      Edit Description
    </button>

    <button
      className="btn btn-danger"
      onClick={handleDeleteGroup}
    >
      Delete Group
    </button>
  </div>
)}
          </div>
        {isAdmin && (
  <AdvancedSearch
    open={advancedSearchOpen}
    onToggle={() => setAdvancedSearchOpen((prev) => !prev)}
    searchByUserName={searchByUserName}
    setSearchByUserName={setSearchByUserName}
    searchByPostText={searchByPostText}
    setSearchByPostText={setSearchByPostText}
    searchDateFrom={searchDateFrom}
    setSearchDateFrom={setSearchDateFrom}
    searchDateTo={searchDateTo}
    setSearchDateTo={setSearchDateTo}
  />
)}

        {currentUser && (
          <div className="card p-3 mb-4 shadow-sm bg-light">
            <h5>Add New Comment</h5>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Comment Title"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder="Comment Content"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleNewPost}>Send</button>
          </div>
        )}

        <div>
          {filteredPosts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            filteredPosts.map((post) => (
  <Post
    key={post.id}
    post={post}
    user={currentUser}
    isAdmin={isAdmin} 
    onDelete={() => handleDeletePost(post.id, post.userId)}
    onEditSave={handleEditSavePost}
    onUserClick={handleUserClick}
    userImage={userImages[post.userId] || ""}
  />
))
          )}
        </div>
      </div>

      {isAdmin && (
  <div className="col-md-4">
    <PendingMembersManagement
  groupId={groupId}
  pendingUsers={pendingUsers}
  pendingUsersDetails={pendingUsersDetails}
  pendingLoading={pendingLoading}
  onApprove={handleApproveUser}
  onReject={handleRejectUser}
/>

    {isAdmin && (
      <div className="mb-3">
        <button
          className="btn btn-secondary"
          onClick={() => setShowManageMembers((prev) => !prev)}
        >
          {showManageMembers ? "Hide Manage Members" : "Manage Members"}
        </button>
      </div>
    )}
    {showManageMembers && (
      <ManageMembers members={members} adminId={groupData.adminId} onRemoveMember={handleRemoveMember} />
    )}
  </div>
)}
    </div>
  </div>
);
}