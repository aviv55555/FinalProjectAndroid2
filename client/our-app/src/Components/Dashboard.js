"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./FireBase";
import 'bootstrap/dist/css/bootstrap.min.css';
import Feed from "./Feed";
import WelcomePage from "./WelcomePage";
/**
 * Dashboard component listens for Firebase authentication state changes.
 * While loading, it shows a loading message. When the auth state is known,
 * it conditionally renders the Feed component for logged-in users,
 * or a WelcomePage component for guests.
 */
function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser || null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return <div className="container mt-4">Loading...</div>;
  }

  return (
    <div className="container mt-4">
      {user ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
          </div>
          <Feed />
        </div>
      ) : (
        <WelcomePage />
      )}
    </div>
  );
}

export default Dashboard;
