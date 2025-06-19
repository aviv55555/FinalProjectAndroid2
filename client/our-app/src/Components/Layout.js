import React, { useState, useEffect } from "react";
import { auth } from "./FireBase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSearchClick = () => {
    navigate("/usersearch");
  };

  const handleFeedClick = () => {
    navigate("/feed");
  };

  const handleProfileClick = () => {
    if (user) {
      navigate(`/profile/${user.uid}`);
    }
  };

  // פונקציה שמחזירה את מחלקת ה-Bootstrap לכפתור לפי הכתובת הנוכחית
  const getButtonClass = (path) => {
    if (path === "/feed" && location.pathname === "/feed") {
      return "btn btn-primary";
    }
    if (
      path === "/profile" &&
      location.pathname.startsWith(`/profile/${user?.uid || ""}`)
    ) {
      return "btn btn-primary";
    }
    if (path === "/usersearch" && location.pathname === "/usersearch") {
      return "btn btn-primary";
    }
    return "btn btn-outline-primary";
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
        <div className="fw-bold fs-4">
          Hello, {user ? user.displayName || "User" : "Guest"}
        </div>

        {user && (
          <div className="d-flex gap-3 align-items-center">
            <button
              className={getButtonClass("/feed")}
              onClick={handleFeedClick}
              type="button"
            >
              Feed
            </button>

            <button
              className={getButtonClass("/profile")}
              onClick={handleProfileClick}
              type="button"
            >
              Profile
            </button>

            <button
              className={getButtonClass("/usersearch")}
              onClick={handleSearchClick}
              type="button"
            >
              Search
            </button>

            <button className="btn btn-danger" onClick={handleSignOut} type="button">
              Sign Out
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow-1 p-4">{children}</main>
    </div>
  );
};

export default Layout;
