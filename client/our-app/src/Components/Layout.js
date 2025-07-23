"use client";
import React, { useState, useEffect } from "react";
import { auth, database } from "./FireBase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";
import ChatList from "./ChatList";
import { io } from "socket.io-client";
/**
 * This Layout component provides a shared structure for all pages in the application,
 * including a dynamic top navigation bar and personalized greeting based on the authenticated user.
 * It listens to Firebase Authentication and displays buttons based on the user’s login status.
 * Navigation buttons highlight the current page.
 */

const socket = io("http://localhost:3000");

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [displayName, setName] = useState("Guest");
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [showChatList, setShowChatList] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, (cu) => {
      if (!cu) {
        setUser(null);
        setName("Guest");
        setUnreadChatsCount(0);
        return;
      }

      setUser(cu);
      const userRef = ref(database, `users/${cu.uid}`);
      const unsub = onValue(userRef, (snap) => {
        if (!snap.exists()) {
          setName(cu.displayName || "User");
        } else {
          const d = snap.val();
          setName(
            d.firstName && d.lastName
              ? `${d.firstName} ${d.lastName}`
              : cu.displayName || "User"
          );
        }
      });
      return () => unsub();
    });
  }, []);

  // Connecting to socket.io and listening for new messages
  useEffect(() => {
    if (!user) return;
// Join the user's room
    socket.emit("join", user.uid);

    // Function to update new message points in real time
    const handleNewMessage = (message) => {
      // If the message is to the current user, increment the counter by 1
      if (message.receiverId === user.uid) {
        setUnreadChatsCount((prev) => prev + 1);
      }
    };

    socket.on("private message", handleNewMessage);

    // Initialize the unread message count from the server on login
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`http://localhost:3000/chatlist/${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch chat list");
        const chats = await res.json();

        // Sum of unread messages from all conversations
        const totalUnread = chats.reduce(
          (sum, chat) => sum + (chat.unreadCount || 0),
          0
        );
        setUnreadChatsCount(totalUnread);
      } catch (err) {
        console.error("Error fetching unread counts:", err);
      }
    };

    fetchUnreadCount();

    return () => {
      socket.off("private message", handleNewMessage);
    };
  }, [user]);

  const nav = (path) => () => navigate(path);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/welcome");
  };

  const getBtnClass = (path) =>
    location.pathname === path ||
    (path.startsWith("/profile") &&
      location.pathname.startsWith(`/profile/${user?.uid || ""}`))
      ? "btn btn-primary"
      : "btn btn-outline-primary";

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
        <div className="fw-bold fs-4">Hello, {displayName}</div>

        {user && (
          <div className="d-flex gap-3 align-items-center position-relative">
            <button className={getBtnClass("/feed")} onClick={nav("/feed")}>
              Feed
            </button>
            <button
              className={getBtnClass("/profile")}
              onClick={nav(`/profile/${user.uid}`)}
            >
              Profile
            </button>
            <button className={getBtnClass("/usersearch")} onClick={nav("/usersearch")}>
              Search
            </button>
            <button className={getBtnClass("/groups")} onClick={nav("/groups")}>
              Groups
            </button>
            <button className={getBtnClass("/map")} onClick={nav("/map")}>Map</button>

            <div style={{ position: "relative" }}>
              <button
                className={getBtnClass("/chatlist")}
                onClick={() => {
                  setShowChatList((prev) => !prev);
                  // You can reset the unread count when you open the list
                  setUnreadChatsCount(0);
                }}
              >
                Chat
              </button>
              {unreadChatsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    backgroundColor: "red",
                    borderRadius: "50%",
                    width: "12px",
                    height: "12px",
                    display: "inline-block",
                  }}
                />
              )}
              {showChatList && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    width: "300px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    zIndex: 1000,
                  }}
                >
                  <ChatList onUnreadChange={setUnreadChatsCount} />
                </div>
              )}
            </div>
            <button
              className={getBtnClass("/statistics")}
              onClick={nav("/statistics")}
            >
              Statistics
            </button>
            <button className="btn btn-danger" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow-1 p-4">{children}</main>
    </div>
  );
};

export default Layout;
