import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth, updateEmail, updatePassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function ProfileSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      fetchProfile();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      setDisplayName(snap.data().displayName || "");
    } else {
      // If user doc does not exist, set displayName from auth
      setDisplayName(user.displayName || "");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      // Ensure user doc exists
      const userDocRef = doc(db, "users", user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: displayName || user.displayName || "",
          role: user.email === "anugrahg38@gmail.com" ? "superadmin" : "student",
        });
      }
      if (displayName) {
        await updateDoc(userDocRef, { displayName });
      }
      if (email && email !== user.email) {
        await updateEmail(getAuth().currentUser, email);
      }
      if (password) {
        await updatePassword(getAuth().currentUser, password);
      }
      setMessage("Profile updated successfully.");
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Display Name</label>
          <input
            className="border px-3 py-2 rounded w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email</label>
          <input
            className="border px-3 py-2 rounded w-full"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">New Password</label>
          <input
            className="border px-3 py-2 rounded w-full"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
          <button
            type="button"
            className="bg-gray-400 text-white px-6 py-2 rounded"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
} 