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

// רקע - נשתמש כ-class
const backgroundStyle = {
  backgroundImage: "url('/assets/loginPic.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

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

      console.log("User saved to database");
      navigate("/");
    } catch (err) {
      setError(err.message);
      console.error("Signup error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={backgroundStyle}>
      <div
        className="card shadow-lg p-4 bg-white bg-opacity-90"
        style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}
      >
        <h2 className="text-center mb-4">Create Your Account</h2>

        <div className="d-flex justify-content-center mb-3">
          <div
            onClick={() => fileInputRef.current.click()}
            style={{
              cursor: "pointer",
              width: "140px",
              height: "140px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #007bff",
              overflow: "hidden",
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Profile Preview"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
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
                  fontSize: "14px",
                }}
              >
                Add Profile Picture
              </div>
            )}
          </div>
        </div>

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
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-control mb-3"
                placeholder="Re-type Password"
                value={rePassword}
                onChange={(e) => setRePassword(e.target.value)}
                required
              />
            </>
          )}

          {error && (
            <div className="alert alert-danger text-center mb-3" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            style={{ height: "45px" }}
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        {!isGoogleSignUp && (
          <div className="text-center mt-3">
            <button
              className="btn btn-danger w-100"
              onClick={handleGoogleSignUp}
              disabled={loading}
              style={{ height: "45px" }}
            >
              {loading ? "Loading..." : "Sign Up with Google"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
