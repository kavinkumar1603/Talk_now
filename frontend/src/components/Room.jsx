import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  ArrowLeft,
  Smile,
  Send,
  Circle,
  Menu,
  X
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const Room = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  // STATE
  const [status, setStatus] = useState("Checking...");
  const [isValidRoom, setIsValidRoom] = useState(false);
  const [messages, setMessages] = useState([]); // Real-time messages
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]); // Real-time users list

  // SOCKET REF
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* ============================
     INITIALIZATION & SOCKET
  ============================ */

  useEffect(() => {
    // 1. Get user from local storage
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    console.log("Room initialized with user:", parsedUser);
    setCurrentUser(parsedUser);

    // 2. Room Validation
    const checkRoom = async () => {
      try {
        const cleanRoomId = roomId.trim();
        const response = await fetch(
          `http://localhost:3000/rooms/${cleanRoomId}`
        );

        if (response.ok) {
          setStatus("Room Found. Connecting...");
          setIsValidRoom(true);
        } else {
          const data = await response.json();
          setStatus(
            `Error: ${data.msg || response.statusText || "Room not found"}`
          );
          setIsValidRoom(false);
        }
      } catch (error) {
        console.error(error);
        setStatus("Error connecting to server");
        setIsValidRoom(false);
      }
    };

    if (roomId) checkRoom();
  }, [roomId, navigate]);

  // 3. Socket Connection (runs only after room is valid)
  useEffect(() => {
    if (!isValidRoom || !currentUser) return;

    // Connect to Socket.IO server (Port 3000)
    socketRef.current = io("http://localhost:3000");

    // Join Room
    socketRef.current.emit("join_room", {
      roomId: roomId,
      username: currentUser.name
    });

    // Listen for incoming messages
    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(), // Simple unique ID
          sender: data.username,
          text: data.message,
          self: data.username === currentUser.name
        }
      ]);
    });

    // Listen for room users list
    socketRef.current.on("room_users", (data) => {
      setUsers(data);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isValidRoom, currentUser, roomId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ============================
     HANDLERS
  ============================ */

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !socketRef.current) return;

    const messageData = {
      roomId: roomId,
      message: message,
      username: currentUser.name
    };

    // Emit message to server
    socketRef.current.emit("send_message", messageData);

    // Optimistically add message to UI (Socket.io usually broadcasts to others, 
    // but our backend broadcasts to *everyone* including sender using io.to(). 
    // If backend uses socket.broadcast.to(), we need to add manualy here.
    // Based on backend code: io.to(roomId).emit(...) -> Sender receives it too.
    // So we DON'T need to manually add it here to avoid duplicates, 
    // UNLESS we want instant UI feedback before server roundtrip.
    // Let's rely on the server 'receive_message' event for consistency for now,
    // or checks strictly against the event logic.)

    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleLeaveRoom = () => {
    navigate("/dashboard");
  };

  /* ============================
     LOADING / ERROR STATE UI
  ============================ */

  if (!isValidRoom) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white font-sans">
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl px-10 py-12 text-center max-w-md">
          <h1 className="text-2xl font-bold text-zinc-900 mb-3">
            Room: {roomId}
          </h1>
          <p className="text-zinc-600 mb-6">{status}</p>

          {status.startsWith("Error") && (
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ============================
     MAIN CHAT UI
  ============================ */

  return (
    <div className="h-screen w-full bg-white font-sans flex overflow-hidden">

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR — USERS */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-zinc-50 border-r border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLeaveRoom}
              className="p-2 rounded-lg hover:bg-zinc-200 md:hidden"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Room {roomId}
              </p>
              <p className="text-xs text-zinc-500">
                Online Members ({users.length})
              </p>
            </div>
          </div>

          {/* Close Sidebar (Mobile) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm">
                  {(user.username || "?").charAt(0)}
                </div>
                <span className="text-sm font-medium text-zinc-800">
                  {user.username || "Unknown User"}
                </span>
              </div>

              <Circle
                size={10}
                className={
                  user.online
                    ? "text-green-500 fill-green-500"
                    : "text-zinc-400"
                }
              />
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT CHAT PANEL */}
      <section className="flex-1 flex flex-col">

        {/* Chat Header */}
        <header className="flex-none px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-semibold text-zinc-900">
              Group Chat
            </h2>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Leave room
          </button>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-6 py-6 bg-zinc-50">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-zinc-400 mt-10">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.self ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm break-words
                    ${msg.self
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white border border-zinc-200 text-zinc-700 rounded-bl-none"
                    }`}
                >
                  {!msg.self && (
                    <p className={`text-xs font-bold mb-1 ${msg.sender === "System" ? "text-indigo-500" : "text-zinc-500"}`}>
                      {msg.sender}
                    </p>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Message Input */}
        <footer className="flex-none px-6 py-4 border-t border-zinc-100 bg-white">
          <div className="max-w-4xl mx-auto flex items-center gap-3">

            <button className="p-2 text-zinc-400 hover:text-zinc-600">
              <Smile size={20} />
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
            />

            <button
              onClick={handleSendMessage}
              className="bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700"
            >
              <Send size={18} />
            </button>

          </div>
        </footer>
      </section>
    </div>
  );
};

export default Room;
