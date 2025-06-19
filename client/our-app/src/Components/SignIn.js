"use client";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  deleteUser,
} from "firebase/auth";
import { auth } from "./FireBase";
import { getDatabase, ref, get } from "firebase/database";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

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

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid email or password");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setError(null);
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        console.log("✅ User exists in DB");
        // login success
      } else {
        await deleteUser(user); // remove from auth
        alert("🛑 You are not registered. Please sign up first.");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Error signing in with Google");
    } finally {
      setLoading(false);
    }
  };
const handleResetPassword = async () => {
  if (!email) {
    setError("Please enter your email first");
    return;
  }

  try {
    setError(null);
    await sendPasswordResetEmail(auth, email);
    alert("A password reset email has been sent.");
  } catch (err) {
    console.error("Reset password error:", err);
    setError("Failed to send reset email. Please check the email address.");
  }
};

  return (
    <div style={backgroundStyle}>
      <div
        className="card shadow-lg p-4 bg-white bg-opacity-90"
        style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}
      >
        <h2 className="text-center mb-4">Sign In</h2>

        <form onSubmit={handleSignIn}>
          <div className="form-group mb-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              style={{ height: "45px" }}
              required
            />
          </div>

          <div className="form-group mb-4">
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              style={{ height: "45px" }}
              required
            />
          </div>

          {error && (
            <div
              className="alert alert-danger text-center mb-3"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            style={{ height: "45px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            className="btn btn-danger w-100"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? "Loading..." : "Sign in with Google"}
          </button>
        </div>

        <div className="text-center mt-3">
          <p style={{ color: "#555" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary fw-bold">
              Sign Up
            </Link>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={handleResetPassword}
              style={{ fontSize: "1rem" }}
            >
            Forgot Your password?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
