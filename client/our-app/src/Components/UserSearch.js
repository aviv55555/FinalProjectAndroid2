"use client";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "./FireBase";
import 'bootstrap/dist/css/bootstrap.min.css';

const UserSearch = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await get(ref(database, "users"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const userList = Object.entries(data).map(([uid, user]) => ({
            uid,
            ...user,
          }));
          setUsers(userList);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Search Users</h3>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Enter a name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <ul className="list-group">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li key={user.uid} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{user.firstName} {user.lastName}</strong>
                <br />
                <small>{user.email}</small>
              </div>
              <a href={`/profile/${user.uid}`} className="btn btn-sm btn-outline-primary">צפה בפרופיל</a>
            </li>
          ))
        ) : (
          <li className="list-group-item text-center">לא נמצאו משתמשים</li>
        )}
      </ul>
    </div>
  );
};

export default UserSearch;
