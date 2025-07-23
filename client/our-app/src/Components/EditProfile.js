import React, { useState, useEffect, useRef } from "react";
import { ref, get, update, remove } from "firebase/database";
import { auth, database } from "./FireBase";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,updatePassword
} from "firebase/auth";
import './EditProfile.css';
/**
 * EditProfile component allows users to view and update their personal details,
 * including name, date of birth, gender, profile picture, and password.
 * It fetches the current data from Firebase Realtime Database, provides image preview and upload,
 * handles password change with secure re-authentication,
 * and also supports profile deletion with confirmation and re-authentication.
 */

const EditProfile = () => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    image: null,
    imageURL: "",
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dob: data.dob || "",
          gender: data.gender || "",
          image: null,
          imageURL: data.image || "",
        });
        setPreview(data.image || null);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserData((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = () => {
    return new Promise((resolve, reject) => {
      if (!userData.image) {
        resolve(userData.imageURL || null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject("Failed to upload image");
      };
      reader.readAsDataURL(userData.image);
    });
  };

  const handleSave = async () => {
  setSaving(true);
  try {
    const imageURL = await handleImageUpload();

    if (newPassword) {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      if (!currentPassword) {
        throw new Error("Current password is required to change password.");
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    }

    await update(ref(database, `users/${userId}`), {
      firstName: userData.firstName,
      lastName: userData.lastName,
      dob: userData.dob,
      gender: userData.gender,
      image: imageURL,
    });

    alert("Profile updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    navigate(`/profile/${userId}`);
  } catch (error) {
    alert("Failed to update profile: " + error.message);
  } finally {
    setSaving(false);
  }
};

  const handleDeleteProfile = async () => {
    if (!window.confirm("Are you sure you want to DELETE your profile?")) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const providerId = user.providerData[0]?.providerId;

      if (providerId === "password") {

        const password = window.prompt(
          "Please enter your password to confirm deletion:"
        );
        if (!password) {
          alert("Password is required to delete your profile.");
          return;
        }

        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

      } else if (providerId === "google.com") {

        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);

      } else {
        alert("Re-authentication method not supported for this provider.");
        return;
      }
      await remove(ref(database, `users/${user.uid}`));

      await deleteUser(user);

      alert("Profile deleted successfully.");
      navigate("/");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete profile: " + error.message);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="container edit-profile-container">
  <h3 className="edit-profile-title">EDIT PROFILE</h3>

  <div className="d-flex flex-column align-items-center mb-3">
    <div
      className="profile-image-wrapper"
      onClick={() => fileInputRef.current.click()}
    >
      {preview ? (
        <img
          src={preview}
          alt="Profile Preview"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div className="profile-image-placeholder">Add Profile Picture</div>
      )}
    </div>
    <div
      className="change-photo-link"
      onClick={() => fileInputRef.current.click()}
    >
      CHANGE PROFILE PHOTO
    </div>
  </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageChange}
      />

      <input
        type="text"
        name="firstName"
        className="form-control mb-3"
        placeholder="First Name"
        value={userData.firstName}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="lastName"
        className="form-control mb-3"
        placeholder="Last Name"
        value={userData.lastName}
        onChange={handleChange}
        required
      />
      <input
  type="password"
  className="form-control mb-3"
  placeholder="Current Password (required if changing password)"
  value={currentPassword}
  onChange={(e) => setCurrentPassword(e.target.value)}
/>
<input
  type="password"
  className="form-control mb-3"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
/>

      <input
        type="date"
        name="dob"
        className="form-control mb-3"
        value={userData.dob}
        onChange={handleChange}
        required
      />
      <select
        name="gender"
        className="form-control mb-3"
        value={userData.gender}
        onChange={handleChange}
        required
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <button
    className="btn btn-primary edit-profile-button"
    onClick={handleSave}
    disabled={saving}
  >
    {saving ? "Saving..." : "Save"}
  </button>

  <button
    className="btn btn-danger delete-profile-button"
    onClick={handleDeleteProfile}
  >
    DELETE PROFILE
  </button>
    </div>
  );
};

export default EditProfile;
