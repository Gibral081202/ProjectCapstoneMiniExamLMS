import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExamById, getQuestions, createSubmission } from "../services/firestore";
import { useAuth } from "../context/AuthContext";

export default function ExamPage() {
  const { examId } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState("");
  const navigate = useNavigate();
  const timerRef = useRef();
  const maxViolations = 2;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const examSnap = await getExamById(examId);
      setExam(examSnap.data());
      const qSnap = await getQuestions(examId);
      setQuestions(qSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, [examId]);

  useEffect(() => {
    if (exam) {
      setTimer(exam.durationInMinutes * 60);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    // eslint-disable-next-line
  }, [exam]);

  // Anti-cheating: Page Visibility API
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setViolations((v) => {
          const newV = v + 1;
          setWarning(
            newV >= maxViolations
              ? "You have switched tabs too many times. Exam will be submitted."
              : "Warning: Do not switch tabs!"
          );
          if (newV >= maxViolations) {
            setTimeout(handleSubmit, 1000);
          }
          return newV;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line
  }, []);

  const handleChange = (qid, value) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    clearInterval(timerRef.current);
    await createSubmission({
      examId,
      studentId: user.uid,
      answers: Object.entries(answers).map(([questionId, studentAnswer]) => ({ questionId, studentAnswer })),
      score: 0,
      status: "submitted",
      violations,
    });
    navigate("/student");
  };

  const now = new Date();
  const openTime = exam && exam.openTime ? new Date(exam.openTime) : null;
  const closeTime = exam && exam.closeTime ? new Date(exam.closeTime) : null;
  if (exam && ((openTime && now < openTime) || (closeTime && now > closeTime))) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{exam.title}</h1>
        <div className="text-red-600 text-lg font-semibold">
          This exam is not currently accessible.<br/>
          {openTime && now < openTime && (
            <span>Exam will open at: {openTime.toLocaleString()}</span>
          )}
          {closeTime && now > closeTime && (
            <span>Exam closed at: {closeTime.toLocaleString()}</span>
          )}
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!exam) return <div className="p-8">Exam not found.</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
      <div className="mb-4 flex justify-between items-center">
        <span className="font-semibold">Time Left: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</span>
        <span className="text-red-500">Violations: {violations}</span>
      </div>
      {warning && <div className="mb-4 text-red-600 font-bold">{warning}</div>}
      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white p-4 rounded shadow">
            <div className="mb-2 font-semibold">{idx + 1}. {q.questionText}</div>
            {q.type === "multipleChoice" && (
              <div className="space-y-2">
                {q.options && q.options.map((opt, i) => (
                  <label key={i} className="block">
                    <input
                      type="radio"
                      name={q.id}
                      value={String.fromCharCode(65 + i)}
                      checked={answers[q.id] === String.fromCharCode(65 + i)}
                      onChange={() => handleChange(q.id, String.fromCharCode(65 + i))}
                      required
                    /> {String.fromCharCode(65 + i)}. {opt}
                  </label>
                ))}
              </div>
            )}
            {q.type === "essay" && (
              <textarea
                className="border px-3 py-2 rounded w-full"
                rows={4}
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                required
              />
            )}
            {q.type === "trueFalse" && (
              <div className="space-x-4">
                <label>
                  <input
                    type="radio"
                    name={q.id}
                    value="true"
                    checked={answers[q.id] === "true"}
                    onChange={() => handleChange(q.id, "true")}
                    required
                  /> True
                </label>
                <label>
                  <input
                    type="radio"
                    name={q.id}
                    value="false"
                    checked={answers[q.id] === "false"}
                    onChange={() => handleChange(q.id, "false")}
                    required
                  /> False
                </label>
              </div>
            )}
            {q.type === "matching" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold mb-1">Left</div>
                  {q.itemsToMatch.left.map((item, i) => (
                    <div key={i} className="mb-2">{String.fromCharCode(65 + i)}. {item}</div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold mb-1">Right (Enter matching letter for each item)</div>
                  {q.itemsToMatch.right.map((item, i) => (
                    <div key={i} className="mb-2 flex items-center gap-2">
                      <span>{item}</span>
                      <input
                        className="border px-2 py-1 rounded w-16"
                        value={answers[`${q.id}_match_${i}`] || ""}
                        onChange={(e) => handleChange(`${q.id}_match_${i}`, e.target.value.toUpperCase())}
                        maxLength={1}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {q.type === "shortAnswer" && (
              <input
                className="border px-3 py-2 rounded w-full"
                value={answers[q.id] || ""}
                onChange={(e) => handleChange(q.id, e.target.value)}
                required
              />
            )}
          </div>
        ))}
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Submit Exam</button>
      </form>
    </div>
  );
} 