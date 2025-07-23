"use client";
import React, { useState, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "./FireBase";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import './SignUp.css';

const backgroundStyle = {
  backgroundImage: "url('/assets/loginPic.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const EyeIcon = ({ visible }) => (
  visible ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      fill="#007bff"
    >
      <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
      <circle cx="12" cy="12" r="2.5" fill="#007bff"/>
    </svg>
  ) : (
    <svg
  xmlns="http://www.w3.org/2000/svg"
  height="20"
  viewBox="0 0 24 24"
  width="20"
  fill="none"
  stroke="#007bff"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
  <circle cx="12" cy="12" r="3" />
  <line x1="1" y1="1" x2="23" y2="23" />
</svg>
  )
);
// This component implements a user sign-up form with Firebase Authentication and Realtime Database.
// Users can register with email and password or sign up via Google.
// It includes image upload (stored as Base64), password visibility toggles, and basic form validation.
// On success, the user's profile is saved to the database and the user is redirected to the /feed page.

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = () => {
    return new Promise((resolve, reject) => {
      if (!image) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject("Failed to upload image");
      };
      reader.readAsDataURL(image);
    });
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      setEmail(user.email || "");
      const [fName, lName] = user.displayName?.split(" ") || ["", ""];
      setFirstName(fName);
      setLastName(lName);
      setIsGoogleSignUp(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isGoogleSignUp && password !== rePassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      let user;
      if (!isGoogleSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        user = userCredential.user;
      } else {
        user = auth.currentUser;
      }

      const imageURL = await handleImageUpload();

      await set(ref(database, "users/" + user.uid), {
        uid: user.uid,
        email,
        firstName,
        lastName,
        dob,
        gender,
        image: imageURL,
        createdAt: new Date().toISOString(),
        followersCount: 0,
        followingCount: 0,
        groupsMember: {},
        groupsManaged: {},
      });

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });
      await user.reload();
      console.log("User saved to database");
      navigate("/feed");
    } catch (err) {
      setError(err.message);
      console.error("Signup error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background" style={backgroundStyle}>
    <div className="signup-card">
      <h2 className="text-center mb-4">Create Your Account</h2>

<div
  className="profile-image-wrapper"
  onClick={() => fileInputRef.current.click()}
>
  {preview ? (
    <img src={preview} alt="Profile" />
  ) : (
    <span className="add-icon">Upload profile picture</span>
  )}
</div>

{/* קלט קובץ – מוסתר */}
<input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  style={{ display: "none" }}
  onChange={handleImageChange}
/>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

          <input
            type="text"
            className="form-control mb-3"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="date"
            className="form-control mb-3"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />
          <select
            className="form-control mb-3"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input
            type="email"
            className="form-control mb-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!isGoogleSignUp && (
          <>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>

            <div className="position-relative">
              <input
                type={showRePassword ? "text" : "password"}
                className="form-control"
                placeholder="Re-type Password"
                value={rePassword}
                onChange={(e) => setRePassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowRePassword(!showRePassword)}
                aria-label={showRePassword ? "Hide password" : "Show password"}
              >
                <EyeIcon visible={showRePassword} />
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="alert alert-danger error-alert" role="alert">
            {error}
          </div>
        )}

        <div className="text-center mb-3">
          <button
            type="submit"
            className="btn btn-primary w-100"
            style={{ maxWidth: "300px", height: "45px" }}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </div>
      </form>

       {!isGoogleSignUp && (
        <div className="text-center mb-3">
          <button
            className="btn btn-danger w-100"
            onClick={handleGoogleSignUp}
            disabled={loading}
            style={{ maxWidth: "300px", height: "45px" }}
          >
            {loading ? "Loading..." : "Sign Up with Google"}
          </button>
        </div>
      )}

      <div className="text-center" style={{ color: "#555" }}>
        <p>
          Do you have an account?{" "}
          <Link to="/signin" className="text-primary fw-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  </div>
  );
};

export default SignUp;
