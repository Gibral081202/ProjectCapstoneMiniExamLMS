import React, { useEffect, useState } from "react";
import { getSubmissionsByExam, getExams } from "../services/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminSubmissionsPage() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentNames, setStudentNames] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      const snap = await getExams();
      setExams(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    setLoading(true);
    getSubmissionsByExam(selectedExam).then(async (snap) => {
      const subs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSubmissions(subs);
      // Fetch student names
      const names = {};
      await Promise.all(subs.map(async (sub) => {
        if (sub.studentId) {
          const userSnap = await getDoc(doc(db, "users", sub.studentId));
          names[sub.studentId] = userSnap.exists() ? (userSnap.data().displayName || userSnap.data().email || sub.studentId) : sub.studentId;
        }
      }));
      setStudentNames(names);
      setLoading(false);
    });
  }, [selectedExam]);

  return (
    <div className="p-8">
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow"
        >
          ← Back to Dashboard
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6">All Submissions</h1>
      <div className="mb-4">
        <label className="font-semibold mr-2">Select Exam:</label>
        <select
          className="border px-3 py-2 rounded"
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
        >
          <option value="">-- Select --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>{exam.title}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Student Name</th>
              <th className="p-2 border">Score</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Violations</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td className="p-2 border">{studentNames[sub.studentId] || <span className="text-gray-400">Loading...</span>}</td>
                <td className="p-2 border">{sub.score}</td>
                <td className="p-2 border">{sub.status}</td>
                <td className="p-2 border">{sub.violations}</td>
                <td className="p-2 border">
                  <button onClick={() => navigate(`/admin/submission/${sub.id}`)} className="bg-blue-600 text-white px-3 py-1 rounded">View & Grade</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 