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
import { useNavigate } from "react-router-dom";


const backgroundStyle = {
  backgroundImage: "url('/assets/loginPic.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
/* 
This React component handles user sign-in using Firebase Authentication.
It supports email/password login, Google OAuth login, and password reset.
After login, the user is redirected to the /feed page.
The component also includes form validation, error handling, loading indicators, and password visibility toggle.
*/
const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed")
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
        console.log("User exists in DB");
        navigate("/feed")
      } else {
        await deleteUser(user);
        alert("You are not registered. Please sign up first.");
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
    <div className="signin-background" style={backgroundStyle}>
    <div className="card shadow-lg p-4 bg-white bg-opacity-90" style={{ maxWidth: "400px", width: "100%", borderRadius: "15px" }}>
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

      <div className="form-group mb-4 position-relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-control"
          style={{ height: "45px" }}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              viewBox="0 0 24 24"
              width="20"
              fill="#007bff"
            >
              <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
              <circle cx="12" cy="12" r="2.5" fill="#007bff" />
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
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger text-center mb-3" role="alert">
          {error}
        </div>
      )}

      <div className="text-center mb-3">
        <button
          type="submit"
          className="btn btn-primary w-100"
          style={{ height: "45px" }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </form>

    <div className="text-center mb-3">
      <button
        className="btn btn-danger w-100"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{ height: "45px" }}
      >
        {loading ? "Loading..." : "Sign in with Google"}
      </button>
    </div>

    <div className="text-center" style={{ color: "#555" }}>
      <p>
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary fw-bold">
          Sign Up
        </Link>
      </p>
      <button
        type="button"
        className="btn btn-link p-0"
        onClick={handleResetPassword}
        style={{ fontSize: "1rem" }}
      >
        Forgot Your password?
      </button>
    </div>
  </div>
</div>
  );
};

export default SignIn;
