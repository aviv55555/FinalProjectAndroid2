"use client";
import { useEffect, useState } from "react";
import SignIn from "./SignIn";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./FireBase";
import 'bootstrap/dist/css/bootstrap.min.css';
import Feed from "./Feed";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // בודק התחברות עם פיירבייס
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
        <SignIn />
      )}
    </div>
  );
}

export default Dashboard;
