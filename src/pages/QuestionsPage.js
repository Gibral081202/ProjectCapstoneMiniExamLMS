import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "../services/firestore";

const QUESTION_TYPES = [
  { value: "multipleChoice", label: "Multiple Choice" },
  { value: "essay", label: "Essay" },
  { value: "trueFalse", label: "True/False" },
  { value: "matching", label: "Matching" },
  { value: "shortAnswer", label: "Short Answer" },
];

export default function QuestionsPage({ examId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    type: "multipleChoice",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    itemsToMatch: { left: [""], right: [""] },
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    setLoading(true);
    const snap = await getQuestions(examId);
    setQuestions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line
  }, [examId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleOptionChange = (idx, value) => {
    setForm((f) => {
      const options = [...f.options];
      options[idx] = value;
      return { ...f, options };
    });
  };

  const handleItemsToMatchChange = (side, idx, value) => {
    setForm((f) => {
      const items = { ...f.itemsToMatch };
      items[side][idx] = value;
      return { ...f, itemsToMatch: items };
    });
  };

  const addMatchItem = (side) => {
    setForm((f) => {
      const items = { ...f.itemsToMatch };
      items[side].push("");
      return { ...f, itemsToMatch: items };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only include relevant fields for the question type
    let data = { type: form.type, questionText: form.questionText };
    if (form.type === "multipleChoice") {
      data.options = form.options;
      data.correctAnswer = form.correctAnswer;
    } else if (form.type === "trueFalse") {
      data.correctAnswer = form.correctAnswer;
    } else if (form.type === "matching") {
      data.itemsToMatch = form.itemsToMatch;
    } else if (form.type === "shortAnswer") {
      data.correctAnswer = form.correctAnswer;
    }
    // Do not include undefined fields
    if (editingId) {
      await updateQuestion(examId, editingId, data);
    } else {
      await addQuestion(examId, data);
    }
    setForm({
      type: "multipleChoice",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      itemsToMatch: { left: [""], right: [""] },
    });
    setEditingId(null);
    fetchQuestions();
  };

  const handleEdit = (q) => {
    setForm({
      type: q.type,
      questionText: q.questionText,
      options: q.options || ["", "", "", ""],
      correctAnswer: q.correctAnswer || "",
      itemsToMatch: q.itemsToMatch || { left: [""], right: [""] },
    });
    setEditingId(q.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this question?")) {
      await deleteQuestion(examId, id);
      fetchQuestions();
    }
  };

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
      <h2 className="text-xl font-bold mb-4">Questions</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8 space-y-4">
        <div>
          <label className="block font-semibold mb-1">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleFormChange}
            className="border px-3 py-2 rounded w-full"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Question Text</label>
          <input
            name="questionText"
            value={form.questionText}
            onChange={handleFormChange}
            className="border px-3 py-2 rounded w-full"
            required
          />
        </div>
        {form.type === "multipleChoice" && (
          <div>
            <label className="block font-semibold mb-1">Options</label>
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="border px-3 py-2 rounded w-full"
                  required
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={form.correctAnswer === String.fromCharCode(65 + idx)}
                  onChange={() => setForm((f) => ({ ...f, correctAnswer: String.fromCharCode(65 + idx) }))}
                />
                <span className="ml-1">{String.fromCharCode(65 + idx)}</span>
              </div>
            ))}
          </div>
        )}
        {form.type === "trueFalse" && (
          <div>
            <label className="block font-semibold mb-1">Correct Answer</label>
            <select
              name="correctAnswer"
              value={form.correctAnswer}
              onChange={handleFormChange}
              className="border px-3 py-2 rounded w-full"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        )}
        {form.type === "matching" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Left Items</label>
              {form.itemsToMatch.left.map((item, idx) => (
                <input
                  key={idx}
                  value={item}
                  onChange={(e) => handleItemsToMatchChange("left", idx, e.target.value)}
                  className="border px-3 py-2 rounded w-full mb-2"
                  required
                />
              ))}
              <button type="button" onClick={() => addMatchItem("left")} className="text-blue-600 underline">Add Left</button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Right Items</label>
              {form.itemsToMatch.right.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input
                    value={item}
                    onChange={(e) => handleItemsToMatchChange("right", idx, e.target.value)}
                    className="border px-3 py-2 rounded w-full"
                    required
                  />
                  <span className="text-xs">Correct match: </span>
                  <select
                    value={form.itemsToMatch.left[idx] || ""}
                    onChange={(e) => handleItemsToMatchChange("left", idx, e.target.value)}
                    className="border px-2 py-1 rounded"
                  >
                    <option value="">Select</option>
                    {form.itemsToMatch.left.map((l, lidx) => (
                      <option key={lidx} value={l}>{String.fromCharCode(65 + lidx)}</option>
                    ))}
                  </select>
                </div>
              ))}
              <button type="button" onClick={() => addMatchItem("right")} className="text-blue-600 underline">Add Right</button>
            </div>
          </div>
        )}
        {form.type === "essay" && (
          <div className="text-xs text-gray-500">Essay questions are graded manually after submission.</div>
        )}
        {form.type === "shortAnswer" && (
          <div className="text-xs text-gray-500">Short answer questions are graded manually after submission.</div>
        )}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingId ? "Update" : "Add"} Question
        </button>
        {editingId && (
          <button type="button" onClick={() => { setForm({ type: "multipleChoice", questionText: "", options: ["", "", "", ""], correctAnswer: "", itemsToMatch: { left: [""], right: [""] } }); setEditingId(null); }} className="ml-2 text-gray-600 underline">
            Cancel
          </button>
        )}
      </form>
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Questions List</h2>
        {loading ? (
          <div>Loading...</div>
        ) : questions.length === 0 ? (
          <div>No questions found.</div>
        ) : (
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Text</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td className="p-2 border">{q.type}</td>
                  <td className="p-2 border">{q.questionText}</td>
                  <td className="p-2 border flex gap-2">
                    <button onClick={() => handleEdit(q)} className="bg-yellow-400 px-3 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(q.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
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