import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSubmissionById, getQuestions } from "../services/firestore";

export default function ResultsPage() {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionsMap, setQuestionsMap] = useState({});
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const snap = await getSubmissionById(submissionId);
      const submissionData = snap.data();
      setSubmission(submissionData);
      if (submissionData && submissionData.examId) {
        const qSnap = await getQuestions(submissionData.examId);
        const qMap = {};
        const qArr = [];
        qSnap.docs.forEach((doc) => {
          qMap[doc.id] = doc.data().questionText;
          qArr.push({ id: doc.id, ...doc.data() });
        });
        setQuestionsMap(qMap);
        setQuestions(qArr);
      }
      setLoading(false);
    };
    fetchData();
  }, [submissionId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!submission) return <div className="p-8">Submission not found.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate("/student")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded shadow"
        >
          ← Back to Dashboard
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4">Exam Results</h1>
      <div className="mb-2">Score: <span className="font-semibold">{submission.score}</span></div>
      <div className="mb-2">Status: <span className="font-semibold">{submission.status}</span></div>
      <div className="mb-2">Violations: <span className="font-semibold">{submission.violations}</span></div>
      <h2 className="text-lg font-semibold mt-6 mb-2">Your Answers</h2>
      <ul className="list-disc pl-6">
        {submission.answers.map((a, i) => {
          const q = questions.find((q) => q.id === a.questionId);
          let isCorrect = false;
          let correctAnswer = q?.correctAnswer;
          if (q) {
            if (q.type === "multipleChoice" || q.type === "trueFalse") {
              isCorrect = a.studentAnswer === q.correctAnswer;
            } else if (q.type === "matching") {
              if (Array.isArray(a.studentAnswer) && q.itemsToMatch && q.itemsToMatch.right) {
                isCorrect = a.score === 10;
              }
            } else if (q.type === "essay" || q.type === "shortAnswer") {
              isCorrect = a.score === 10;
            }
          }
          return (
            <li key={i} className={`mb-3 p-3 rounded ${isCorrect ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
              <div className="font-semibold">Q: {q ? q.questionText : a.questionId}</div>
              <div>
                <span className="font-semibold">Your Answer:</span> {JSON.stringify(a.studentAnswer)}
                {isCorrect ? (
                  <span className="ml-2 text-green-600 font-semibold">✔ Correct</span>
                ) : (
                  <span className="ml-2 text-red-600 font-semibold">✘ Incorrect</span>
                )}
              </div>
              {q && !isCorrect && (q.type === "multipleChoice" || q.type === "trueFalse" || q.type === "matching") && (
                <div className="text-sm text-gray-700">Correct Answer: {JSON.stringify(correctAnswer)}</div>
              )}
              {q && (q.type === "essay" || q.type === "shortAnswer") && a.note && (
                <div className="text-sm text-blue-700 mt-1">Teacher's Note: {a.note}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 