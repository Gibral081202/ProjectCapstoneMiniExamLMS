import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
} from "../services/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", durationInMinutes: "", openTime: "", closeTime: "", token: "" });
  const [editingId, setEditingId] = useState(null);
  const [showPending, setShowPending] = useState(false);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const navigate = useNavigate();
  const superAdminEmail = "anugrahg38@gmail.com";
  const isSuperAdmin = user && user.email === superAdminEmail;

  const fetchExams = async () => {
    setLoading(true);
    const snap = await getExams();
    setExams(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const fetchPendingTeachers = async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    setPendingTeachers(
      usersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "pending-teacher")
    );
  };

  const approveTeacher = async (id) => {
    await updateDoc(doc(db, "users", id), { role: "teacher" });
    fetchPendingTeachers();
  };

  useEffect(() => {
    fetchExams();
  }, []);

  function generateToken(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.durationInMinutes) return;
    let examToken = form.token || generateToken();
    const examData = {
      title: form.title,
      durationInMinutes: Number(form.durationInMinutes),
      openTime: form.openTime ? new Date(form.openTime).toISOString() : null,
      closeTime: form.closeTime ? new Date(form.closeTime).toISOString() : null,
      createdBy: "admin",
      token: examToken,
    };
    if (editingId) {
      await updateExam(editingId, examData);
    } else {
      await createExam(examData);
    }
    setForm({ title: "", durationInMinutes: "", openTime: "", closeTime: "", token: "" });
    setEditingId(null);
    fetchExams();
  };

  const handleEdit = (exam) => {
    setForm({
      title: exam.title,
      durationInMinutes: exam.durationInMinutes,
      openTime: exam.openTime ? exam.openTime.slice(0, 16) : "",
      closeTime: exam.closeTime ? exam.closeTime.slice(0, 16) : "",
      token: exam.token || "",
    });
    setEditingId(exam.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this exam?")) {
      await deleteExam(id);
      fetchExams();
    }
  };

  const handleQuestions = (examId) => {
    navigate(`/admin/exam/${examId}/questions`);
  };

  const handleSubmissions = () => {
    navigate("/admin/submissions");
  };

  const handleShowPending = async () => {
    await fetchPendingTeachers();
    setShowPending(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <button onClick={() => navigate('/superadmin')} className="bg-purple-600 text-white px-4 py-2 rounded">Super Admin Dashboard</button>
          )}
          {isSuperAdmin && (
            <button onClick={handleShowPending} className="bg-yellow-500 text-white px-4 py-2 rounded">Pending Teachers</button>
          )}
          <button onClick={handleSubmissions} className="bg-blue-500 text-white px-4 py-2 rounded">Submissions</button>
          <button onClick={() => navigate('/profile')} className="bg-gray-400 text-white px-4 py-2 rounded">Profile Settings</button>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </div>
      {showPending && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Teacher Accounts</h2>
          {pendingTeachers.length === 0 ? (
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
                {pendingTeachers.map((t) => (
                  <tr key={t.id}>
                    <td className="p-2 border">{t.displayName}</td>
                    <td className="p-2 border">{t.email}</td>
                    <td className="p-2 border">
                      <button onClick={() => approveTeacher(t.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button onClick={() => setShowPending(false)} className="bg-gray-300 px-4 py-2 rounded">Close</button>
        </div>
      )}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit Exam" : "Create Exam"}</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 flex-wrap items-end">
          <input
            className="border px-3 py-2 rounded w-64"
            placeholder="Exam Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className="border px-3 py-2 rounded w-40"
            placeholder="Duration (minutes)"
            type="number"
            value={form.durationInMinutes}
            onChange={(e) => setForm({ ...form, durationInMinutes: e.target.value })}
            required
            min={1}
          />
          <div className="flex flex-col">
            <label className="text-xs font-semibold mb-1">Open Time</label>
            <input
              className="border px-3 py-2 rounded w-56"
              type="datetime-local"
              value={form.openTime}
              onChange={(e) => setForm({ ...form, openTime: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold mb-1">Close Time</label>
            <input
              className="border px-3 py-2 rounded w-56"
              type="datetime-local"
              value={form.closeTime}
              onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm({ title: "", durationInMinutes: "", openTime: "", closeTime: "", token: "" }); setEditingId(null); }} className="ml-2 text-gray-600 underline">
              Cancel
            </button>
          )}
        </form>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Exams</h2>
        {loading ? (
          <div>Loading...</div>
        ) : exams.length === 0 ? (
          <div>No exams found.</div>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Duration (min)</th>
                <th className="p-2 border">Open Time</th>
                <th className="p-2 border">Close Time</th>
                <th className="p-2 border">Token</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id}>
                  <td className="p-2 border">{exam.title}</td>
                  <td className="p-2 border">{exam.durationInMinutes}</td>
                  <td className="p-2 border">{exam.openTime ? new Date(exam.openTime).toLocaleString() : "-"}</td>
                  <td className="p-2 border">{exam.closeTime ? new Date(exam.closeTime).toLocaleString() : "-"}</td>
                  <td className="p-2 border font-mono text-xs">{exam.token}</td>
                  <td className="p-2 border flex gap-2">
                    <button onClick={() => handleEdit(exam)} className="bg-yellow-400 px-3 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(exam.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                    <button onClick={() => handleQuestions(exam.id)} className="bg-green-600 text-white px-3 py-1 rounded">Questions</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 