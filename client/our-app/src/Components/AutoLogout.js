import { useEffect, useRef } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "./FireBase";
import { useNavigate, useLocation } from "react-router-dom";

const IDLE_TIMEOUT = 60 * 60 * 1000; // an hour
/**
 * AutoLogout is a background React component that automatically logs out
 * an authenticated Firebase user after 1 hour of inactivity.
 * It listens for user actions (mouse, keyboard, touch) to reset the timer,
 * and uses Firebase Auth and React Router to sign out and redirect if needed.
 * This component renders nothing and runs silently in the background.
 */

export default function AutoLogout() {
  const timeoutRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const logout = async () => {
      try {
        if (userRef.current) {
          await signOut(auth);
          if (location.pathname !== "/signup") {
            navigate("/");
          }
          alert("You Logged out!!");
        }
      } catch (err) {
        console.error("ERROR", err);
      }
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (userRef.current) {
        timeoutRef.current = setTimeout(logout, IDLE_TIMEOUT);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      userRef.current = user;
      resetTimer();
    });

    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      unsubscribe();
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigate, location]);

  return null;
}
