import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

// Exams
export const examsCol = collection(db, "exams");
export function getExams() {
  return getDocs(examsCol);
}
export function getExamById(id) {
  return getDoc(doc(examsCol, id));
}
export function createExam(data) {
  return addDoc(examsCol, data);
}
export function updateExam(id, data) {
  return updateDoc(doc(examsCol, id), data);
}
export function deleteExam(id) {
  return deleteDoc(doc(examsCol, id));
}

// Questions (sub-collection)
export function getQuestions(examId) {
  return getDocs(collection(db, `exams/${examId}/questions`));
}
export function addQuestion(examId, data) {
  return addDoc(collection(db, `exams/${examId}/questions`), data);
}
export function updateQuestion(examId, questionId, data) {
  return updateDoc(doc(db, `exams/${examId}/questions/${questionId}`), data);
}
export function deleteQuestion(examId, questionId) {
  return deleteDoc(doc(db, `exams/${examId}/questions/${questionId}`));
}

// Submissions
export const submissionsCol = collection(db, "submissions");
export function getSubmissionsByExam(examId) {
  return getDocs(query(submissionsCol, where("examId", "==", examId)));
}
export function getSubmissionsByStudent(studentId) {
  return getDocs(query(submissionsCol, where("studentId", "==", studentId)));
}
export function createSubmission(data) {
  return addDoc(submissionsCol, data);
}
export function updateSubmission(id, data) {
  return updateDoc(doc(submissionsCol, id), data);
}
export function getSubmissionById(id) {
  return getDoc(doc(submissionsCol, id));
} 