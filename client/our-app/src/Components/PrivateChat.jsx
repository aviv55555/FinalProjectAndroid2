"use client";
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { ref, get } from "firebase/database";
import { database } from "./FireBase";
import './PrivateChat.css';

const socket = io("http://localhost:3000");

export default function PrivateChat({ currentUserId, otherUserId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const bottomRef = useRef(null);

  // Get the second username from Firebase
  useEffect(() => {
    if (!otherUserId) return;
    get(ref(database, `users/${otherUserId}`))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.val();
          setOtherUserName(`${(d.firstName || "")} ${(d.lastName || "")}`.trim());
        } else setOtherUserName(otherUserId);
      })
      .catch(() => setOtherUserName(otherUserId));
  }, [otherUserId]);

  // Fetch message history
  useEffect(() => {
    if (!currentUserId || !otherUserId) return;
    axios
      .get(`http://localhost:3000/messages/${currentUserId}/${otherUserId}`)
      .then((r) => setMessages(r.data))
      .catch(console.error);
  }, [currentUserId, otherUserId]);

  // Connecting to Socket.IO and listening for new messages
  useEffect(() => {
    if (!currentUserId) return;
    socket.emit("join", currentUserId);

    const handler = (m) => {
      const isRelevant =
        (m.senderId === currentUserId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === currentUserId);
      if (isRelevant) {
        setMessages((prev) => [...prev, m]);
      }

      if (m.receiverId === currentUserId && m.senderId === otherUserId) {
        alert(`New message from ${otherUserName}: ${m.content}`);
      }
    };
    socket.on("private message", handler);
    return () => socket.off("private message", handler);
  }, [currentUserId, otherUserId, otherUserName]);

  // Automatic scrolling to the bottom of the conversation
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // send message by Socket.IO
  const send = () => {
    if (!input.trim()) return;
    socket.emit("private message", {
      senderId: currentUserId,
      receiverId: otherUserId,
      content: input.trim(),
    });
    setInput("");
  };

  return (
    <div className="private-chat-container">
      <h5 className="private-chat-title">Chat with {otherUserName || "..."}</h5>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div
            key={m._id ?? i}
            className={`d-flex ${m.senderId === currentUserId ? "justify-content-end" : "justify-content-start"}`}
          >
            <div className={`chat-bubble ${m.senderId === currentUserId ? "self" : "other"}`}>
              {m.content && <span>{m.content}</span>}
              {m.imageUrl && (
                <img src={m.imageUrl} alt="sent" className="chat-image" />
              )}
              <div className="chat-timestamp">
                {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-group">
        <input
          className="form-control"
          value={input}
          placeholder="Type a message…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn btn-primary" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
