import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getExams, getSubmissionsByStudent } from "../services/firestore";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { logout, user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const navigate = useNavigate();
  const [unlockedExams, setUnlockedExams] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unlockedExams') || '[]');
    } catch {
      return [];
    }
  });
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [examsSnap, subsSnap] = await Promise.all([
        getExams(),
        getSubmissionsByStudent(user.uid),
      ]);
      setExams(examsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setSubmissions(subsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [user.uid]);

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = (submissionId) => {
    navigate(`/results/${submissionId}`);
  };

  const handleRedeemToken = () => {
    setTokenError("");
    const exam = exams.find((e) => e.token && e.token.toUpperCase() === tokenInput.trim().toUpperCase());
    if (exam) {
      if (!unlockedExams.includes(exam.id)) {
        const updated = [...unlockedExams, exam.id];
        setUnlockedExams(updated);
        localStorage.setItem('unlockedExams', JSON.stringify(updated));
      }
      setTokenInput("");
    } else {
      setTokenError("Invalid token. Please check and try again.");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <div className="flex gap-2">
          {user && user.email === 'anugrahg38@gmail.com' && (
            <button onClick={() => navigate('/superadmin')} className="bg-purple-600 text-white px-4 py-2 rounded">Super Admin Dashboard</button>
          )}
          <button onClick={() => navigate('/profile')} className="bg-gray-400 text-white px-4 py-2 rounded">Profile Settings</button>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </div>
      </div>
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Exams</h2>
        <div className="mb-4 flex gap-2 items-end">
          <input
            className="border px-3 py-2 rounded w-64"
            placeholder="Enter Exam Token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <button onClick={handleRedeemToken} className="bg-blue-600 text-white px-4 py-2 rounded">Redeem</button>
          {tokenError && <span className="text-red-600 ml-2">{tokenError}</span>}
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : exams.length === 0 ? (
          <div>No exams available.</div>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Title</th>
                <th className="p-2 border">Duration (min)</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const alreadySubmitted = submissions.some((sub) => sub.examId === exam.id);
                const isUnlocked = unlockedExams.includes(exam.id);
                return (
                  <tr key={exam.id}>
                    <td className="p-2 border">{exam.title}</td>
                    <td className="p-2 border">{exam.durationInMinutes}</td>
                    <td className="p-2 border">
                      {alreadySubmitted ? (
                        <span className="text-gray-500">Already Submitted</span>
                      ) : isUnlocked ? (
                        <button onClick={() => handleStartExam(exam.id)} className="bg-blue-600 text-white px-3 py-1 rounded">Start Exam</button>
                      ) : (
                        <span className="text-gray-400">Enter token to unlock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">My Submissions</h2>
        {loading ? (
          <div>Loading...</div>
        ) : submissions.length === 0 ? (
          <div>No submissions yet.</div>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Exam</th>
                <th className="p-2 border">Score</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.filter((sub) => exams.some((e) => e.id === sub.examId)).map((sub) => {
                const exam = exams.find((e) => e.id === sub.examId);
                return (
                  <tr key={sub.id}>
                    <td className="p-2 border">{exam ? exam.title : sub.examId}</td>
                    <td className="p-2 border">{sub.score}</td>
                    <td className="p-2 border">{sub.status}</td>
                    <td className="p-2 border">
                      <button onClick={() => handleViewResults(sub.id)} className="bg-green-600 text-white px-3 py-1 rounded">View Results</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 