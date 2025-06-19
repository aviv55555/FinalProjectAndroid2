import React, { useState, useEffect, useRef } from "react";
import { ref, get, update, remove } from "firebase/database";
import { auth, database } from "./FireBase";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  deleteUser,
} from "firebase/auth";

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
      await update(ref(database, `users/${userId}`), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        dob: userData.dob,
        gender: userData.gender,
        image: imageURL,
      });
      alert("Profile updated successfully!");
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

      // בודקים את ספק ההתחברות (provider)
      const providerId = user.providerData[0]?.providerId;

      if (providerId === "password") {
        // אימות מחודש עם סיסמה

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
        // אימות מחודש עם Google Popup

        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);

      } else {
        alert("Re-authentication method not supported for this provider.");
        return;
      }

      // מחיקת הנתונים מה־Realtime Database
      await remove(ref(database, `users/${user.uid}`));

      // מחיקת המשתמש מ־Firebase Auth
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
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h3 className="text-center mb-4">EDIT PROFILE</h3>

      <div className="d-flex flex-column align-items-center mb-3">
        <div
          onClick={() => fileInputRef.current.click()}
          style={{
            cursor: "pointer",
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "2px solid #007bff",
            overflow: "hidden",
            objectFit: "cover",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Profile Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#f0f0f0",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#888",
                fontSize: 14,
              }}
            >
              Add Profile Picture
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            fontWeight: "bold",
            color: "#007bff",
            cursor: "pointer",
          }}
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
        className="btn btn-primary w-100 mb-3"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>

      <button
        className="btn btn-danger w-100"
        onClick={handleDeleteProfile}
        style={{ marginTop: 10 }}
      >
        DELETE PROFILE
      </button>
    </div>
  );
};

export default EditProfile;
