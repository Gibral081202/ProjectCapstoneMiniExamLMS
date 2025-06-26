import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAuth, updateEmail, updatePassword, sendPasswordResetEmail } from "firebase/auth";

export default function SuperAdminDashboard() {
  const { logout, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("pending");
  const navigate = useNavigate();
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', password: '' });
  const [loadingAction, setLoadingAction] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const approveTeacher = async (id) => {
    await updateDoc(doc(db, "users", id), { role: "teacher" });
    fetchUsers();
  };

  const rejectTeacher = async (id) => {
    await deleteDoc(doc(db, "users", id));
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete this user?")) {
      await deleteDoc(doc(db, "users", id));
      fetchUsers();
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({ displayName: user.displayName || '', email: user.email || '', password: '' });
    setMessage("");
    setError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const handleEditSave = async () => {
    setLoadingAction(true);
    setMessage("");
    setError("");
    try {
      // Update Firestore
      await updateDoc(doc(db, "users", editingUser.id), {
        displayName: editForm.displayName,
        email: editForm.email,
      });
      // Optionally update Auth (only possible for current user in client SDK)
      // For demo, only update Firestore
      // Audit log
      await addAuditLog('edit', editingUser.id, editForm.email);
      setMessage("User updated successfully.");
      setEditingUser(null);
      setEditForm({ displayName: '', email: '', password: '' });
      fetchUsers();
    } catch (err) {
      setError("Failed to update user: " + err.message);
    } finally {
      setLoadingAction(false);
      setConfirmEdit(false);
    }
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setEditForm({ displayName: '', email: '', password: '' });
    setConfirmEdit(false);
  };

  const handleSendReset = async () => {
    setLoadingAction(true);
    setMessage("");
    setError("");
    try {
      await sendPasswordResetEmail(getAuth(), editForm.email);
      setMessage("Password reset email sent to " + editForm.email);
    } catch (err) {
      setError("Failed to send reset email: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteUser = async (id, email) => {
    setLoadingAction(true);
    setMessage("");
    setError("");
    try {
      await deleteDoc(doc(db, "users", id));
      await addAuditLog('delete', id, email);
      setMessage("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      setError("Failed to delete user: " + err.message);
    } finally {
      setLoadingAction(false);
      setConfirmDelete(null);
    }
  };

  // Audit log function (optional, simple demo)
  const addAuditLog = async (action, userId, email) => {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId,
          email,
          performedBy: user.email,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {}
  };

  const superAdminEmail = "anugrahg38@gmail.com";
  if (!user || user.email !== superAdminEmail) {
    navigate("/login");
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/profile')} className="bg-gray-400 text-white px-4 py-2 rounded">Profile Settings</button>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab("pending")}
          className={`px-4 py-2 rounded ${tab === "pending" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}>Pending Teachers</button>
        <button onClick={() => setTab("teachers")}
          className={`px-4 py-2 rounded ${tab === "teachers" ? "bg-blue-500 text-white" : "bg-gray-200"}`}>All Teachers</button>
        <button onClick={() => setTab("students")}
          className={`px-4 py-2 rounded ${tab === "students" ? "bg-green-500 text-white" : "bg-gray-200"}`}>All Students</button>
      </div>
      {tab === "pending" && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Teacher Accounts</h2>
          {users.filter(u => u.role === "pending-teacher").length === 0 ? (
            <div>No pending teachers.</div>
          ) : (
            <table className="w-full table-auto border mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === "pending-teacher").map((t) => (
                  <tr key={t.id}>
                    <td className="p-2 border">{t.displayName}</td>
                    <td className="p-2 border">{t.email}</td>
                    <td className="p-2 border flex gap-2">
                      <button onClick={() => approveTeacher(t.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                      <button onClick={() => rejectTeacher(t.id)} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "teachers" && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">All Teachers</h2>
          {users.filter(u => u.role === "teacher").length === 0 ? (
            <div>No teachers.</div>
          ) : (
            <table className="w-full table-auto border mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === "teacher").map((t) => (
                  <tr key={t.id}>
                    <td className="p-2 border">{t.displayName}</td>
                    <td className="p-2 border">{t.email}</td>
                    <td className="p-2 border flex gap-2">
                      <button onClick={() => handleEditClick(t)} className="bg-blue-500 text-white px-3 py-1 rounded" disabled={t.email === superAdminEmail}>Edit</button>
                      <button onClick={() => setConfirmDelete({ id: t.id, email: t.email })} className="bg-red-500 text-white px-3 py-1 rounded" disabled={t.email === superAdminEmail}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Edit User</h3>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Display Name</label>
                  <input name="displayName" value={editForm.displayName} onChange={handleEditChange} className="border px-3 py-2 rounded w-full" />
                </div>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Email</label>
                  <input name="email" value={editForm.email} onChange={handleEditChange} className="border px-3 py-2 rounded w-full" />
                </div>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">New Password</label>
                  <input name="password" value={editForm.password} onChange={handleEditChange} className="border px-3 py-2 rounded w-full" type="password" placeholder="Set new password (optional)" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setConfirmEdit(true)} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loadingAction}>Save</button>
                  <button onClick={handleSendReset} className="bg-yellow-500 text-white px-4 py-2 rounded" disabled={loadingAction}>Send Reset Email</button>
                  <button onClick={handleEditCancel} className="bg-gray-400 text-white px-4 py-2 rounded" disabled={loadingAction}>Cancel</button>
                </div>
                {loadingAction && <div className="mt-2 text-blue-600">Saving...</div>}
              </div>
            </div>
          )}
          {confirmEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow">
                <div className="mb-4">Are you sure you want to save changes to this user?</div>
                <div className="flex gap-2">
                  <button onClick={handleEditSave} className="bg-blue-600 text-white px-4 py-2 rounded">Yes, Save</button>
                  <button onClick={() => setConfirmEdit(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow">
                <div className="mb-4">Are you sure you want to delete this user?</div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteUser(confirmDelete.id, confirmDelete.email)} className="bg-red-600 text-white px-4 py-2 rounded">Yes, Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === "students" && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">All Students</h2>
          {users.filter(u => u.role === "student").length === 0 ? (
            <div>No students.</div>
          ) : (
            <table className="w-full table-auto border mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === "student").map((t) => (
                  <tr key={t.id}>
                    <td className="p-2 border">{t.displayName}</td>
                    <td className="p-2 border">{t.email}</td>
                    <td className="p-2 border flex gap-2">
                      <button onClick={() => handleEditClick(t)} className="bg-blue-500 text-white px-3 py-1 rounded" disabled={t.email === superAdminEmail}>Edit</button>
                      <button onClick={() => setConfirmDelete({ id: t.id, email: t.email })} className="bg-red-500 text-white px-3 py-1 rounded" disabled={t.email === superAdminEmail}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Edit User</h3>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Display Name</label>
                  <input name="displayName" value={editForm.displayName} onChange={handleEditChange} className="border px-3 py-2 rounded w-full" />
                </div>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">Email</label>
                  <input name="email" value={editForm.email} onChange={handleEditChange} className="border px-3 py-2 rounded w-full" />
                </div>
                <div className="mb-2">
                  <label className="block font-semibold mb-1">New Password</label>
                  <input name="password" value={editForm.password} onChange={handleEditChange} className="border px-3 py-2 rounded w-full" type="password" placeholder="Set new password (optional)" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setConfirmEdit(true)} className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loadingAction}>Save</button>
                  <button onClick={handleSendReset} className="bg-yellow-500 text-white px-4 py-2 rounded" disabled={loadingAction}>Send Reset Email</button>
                  <button onClick={handleEditCancel} className="bg-gray-400 text-white px-4 py-2 rounded" disabled={loadingAction}>Cancel</button>
                </div>
                {loadingAction && <div className="mt-2 text-blue-600">Saving...</div>}
              </div>
            </div>
          )}
          {confirmEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow">
                <div className="mb-4">Are you sure you want to save changes to this user?</div>
                <div className="flex gap-2">
                  <button onClick={handleEditSave} className="bg-blue-600 text-white px-4 py-2 rounded">Yes, Save</button>
                  <button onClick={() => setConfirmEdit(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded shadow">
                <div className="mb-4">Are you sure you want to delete this user?</div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteUser(confirmDelete.id, confirmDelete.email)} className="bg-red-600 text-white px-4 py-2 rounded">Yes, Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
    </div>
  );
} 