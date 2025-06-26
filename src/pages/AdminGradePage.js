import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSubmissionById, updateSubmission, getQuestions } from "../services/firestore";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminGradePage() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualScores, setManualScores] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [autoGraded, setAutoGraded] = useState(false);
  const [notes, setNotes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      const snap = await getSubmissionById(submissionId);
      const data = snap.data();
      setSubmission(data);
      // Fetch student email and name
      if (data && data.studentId) {
        const userSnap = await getDoc(doc(db, "users", data.studentId));
        setStudentEmail(userSnap.exists() ? userSnap.data().email : data.studentId);
        setStudentName(userSnap.exists() ? userSnap.data().displayName || "-" : "-");
      }
      // Fetch questions for this exam
      if (data && data.examId) {
        const qSnap = await getQuestions(data.examId);
        setQuestions(qSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    };
    fetchSubmission();
  }, [submissionId]);

  useEffect(() => {
    // Only auto-grade if not already done
    if (
      submission &&
      questions.length > 0 &&
      !autoGraded &&
      submission.answers &&
      submission.answers[0] &&
      !submission.answers[0].questionText
    ) {
      let total = 0;
      let manual = {};
      let maxScore = 0;
      const updatedAnswers = submission.answers.map((a) => {
        const q = questions.find((q) => q.id === a.questionId);
        if (!q) return a;
        if (q.type === "multipleChoice" || q.type === "trueFalse") {
          const isCorrect = a.studentAnswer === q.correctAnswer;
          maxScore += 10;
          total += isCorrect ? 10 : 0;
          return { ...a, score: isCorrect ? 10 : 0, questionText: q.questionText };
        } else if (q.type === "matching") {
          let matchScore = 0;
          if (q.itemsToMatch && q.itemsToMatch.right) {
            q.itemsToMatch.right.forEach((item, idx) => {
              const ans = a.studentAnswer && a.studentAnswer[idx];
              if (ans && ans === q.itemsToMatch.left[idx]) matchScore++;
            });
            const score = matchScore === q.itemsToMatch.right.length ? 10 : 0;
            maxScore += 10;
            total += score;
            return { ...a, score, questionText: q.questionText };
          }
          return { ...a, score: 0, questionText: q.questionText };
        } else {
          maxScore += 10;
          manual[a.questionId] = a.score || 0;
          return { ...a, questionText: q.questionText };
        }
      });
      setManualScores(manual);
      setTotalScore(total);
      setFinalScore(submission.score || 0);
      setSubmission((s) => ({ ...s, answers: updatedAnswers, maxScore }));
      setAutoGraded(true);
    }
  }, [submission, questions, autoGraded]);

  const handleScoreChange = (qid, value) => {
    setManualScores((s) => ({ ...s, [qid]: Number(value) }));
  };

  const handleFinalScoreChange = (e) => {
    setFinalScore(Number(e.target.value));
  };

  const handleNoteChange = (qid, value) => {
    setNotes((n) => ({ ...n, [qid]: value }));
  };

  const handleSave = async () => {
    const updatedAnswers = submission.answers.map((a) => {
      if (manualScores[a.questionId] !== undefined) {
        return { ...a, score: manualScores[a.questionId], note: notes[a.questionId] || a.note };
      }
      return a;
    });
    const maxScore = updatedAnswers.length * 10;
    const autoScore = updatedAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    // Final score is percentage out of 100
    const final = Math.round((autoScore / maxScore) * 100);
    await updateSubmission(submissionId, {
      answers: updatedAnswers,
      score: final,
      status: "graded",
    });
    setTotalScore(autoScore);
    alert("Grading saved!");
    navigate(-1);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!submission) return <div className="p-8">Submission not found.</div>;

  const isGraded = submission.status === "graded";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin/submissions")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow"
        >
          ← Back to Submissions
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Grade Submission</h1>
      <div className="mb-2">Student: <span className="font-semibold">{studentName}</span> ({studentEmail})</div>
      <div className="mb-2">Current Score: <span className="font-semibold">{totalScore}</span></div>
      <div className="mb-2">Status: <span className="font-semibold">{submission.status}</span></div>
      {isGraded && (
        <div className="mb-4 text-green-700 font-semibold">This submission has already been graded. Grading cannot be changed.</div>
      )}
      <h2 className="text-lg font-semibold mt-6 mb-2">Answers</h2>
      <ul className="list-disc pl-6">
        {submission.answers.map((a, i) => (
          <li key={i} className="mb-2">
            <div><span className="font-semibold">Q:</span> {a.questionText || a.questionId}</div>
            <div><span className="font-semibold">A:</span> {JSON.stringify(a.studentAnswer)}</div>
            {(questions.find((q) => q.id === a.questionId)?.type === "essay" || questions.find((q) => q.id === a.questionId)?.type === "shortAnswer") && (
              <>
                <select
                  className="border px-2 py-1 rounded mt-2"
                  value={manualScores[a.questionId] || ""}
                  onChange={(e) => handleScoreChange(a.questionId, e.target.value)}
                  disabled={isGraded}
                >
                  <option value="">Select Score</option>
                  <option value={10}>10 (Correct)</option>
                  <option value={0}>0 (Incorrect)</option>
                </select>
                <textarea
                  className="border px-2 py-1 rounded mt-2 w-full"
                  placeholder="Add note or correct answer (optional)"
                  value={notes[a.questionId] || a.note || ""}
                  onChange={(e) => handleNoteChange(a.questionId, e.target.value)}
                  disabled={isGraded}
                  rows={2}
                />
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-6 mb-2">
        <label className="font-semibold mr-2">Final Score (out of 100):</label>
        <input
          type="number"
          className="border px-2 py-1 rounded"
          value={finalScore}
          onChange={handleFinalScoreChange}
          min={0}
          max={100}
          disabled
        />
      </div>
      <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded mt-4" disabled={isGraded}>Save Grading</button>
    </div>
  );
} 