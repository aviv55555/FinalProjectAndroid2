"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./FireBase";         
import { useParams } from "react-router-dom";
import PrivateChat from "./PrivateChat";
/**
 * ChatWrapper component fetches the current authenticated user ID
 * using Firebase Auth, and extracts the other user's ID from the URL.
 * It waits for authentication to complete, then renders the PrivateChat
 * component passing both user IDs as props.
 * Shows a loading message while authentication is being checked.
 */

export default function ChatWrapper() {
  const { otherUserId } = useParams();       // /chat/:otherUserId
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUserId(u?.uid || null));
    return () => unsubscribe();
  }, []);

  if (!currentUserId) return <p>Loading chat…</p>;
  return <PrivateChat currentUserId={currentUserId} otherUserId={otherUserId} />;
}