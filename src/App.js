import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import QuestionsPage from "./pages/QuestionsPage";
import ExamPage from "./pages/ExamPage";
import ResultsPage from "./pages/ResultsPage";
import AdminSubmissionsPage from "./pages/AdminSubmissionsPage";
import AdminGradePage from "./pages/AdminGradePage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
// import AuthProvider from "./context/AuthContext"; // To be created
// import ResultPage from "./pages/ResultPage"; // To be created

function QuestionsPageWithParams() {
  const { examId } = useParams();
  return <QuestionsPage examId={examId} />;
}

function ExamPageWithParams() {
  const { examId } = useParams();
  return <ExamPage examId={examId} />;
}

function ResultsPageWithParams() {
  const { submissionId } = useParams();
  return <ResultsPage submissionId={submissionId} />;
}

function AdminGradePageWithParams() {
  const { submissionId } = useParams();
  return <AdminGradePage submissionId={submissionId} />;
}

function App() {
  const { user } = useAuth();
  // Assume admin email is set in env for demo, or check Firestore for real role
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || "admin@exam.com";
  const isAdmin = user && user.email === adminEmail;

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        {/* <AuthProvider> */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                {isAdmin ? <AdminDashboard /> : <Navigate to="/student" />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam/:examId/questions"
            element={
              <ProtectedRoute role="admin">
                <QuestionsPageWithParams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute role="admin">
                <AdminSubmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submission/:submissionId"
            element={
              <ProtectedRoute role="admin">
                <AdminGradePageWithParams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                {!isAdmin ? <StudentDashboard /> : <Navigate to="/admin" />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId"
            element={
              <ProtectedRoute role="student">
                <ExamPageWithParams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:submissionId"
            element={
              <ProtectedRoute>
                <ResultsPageWithParams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />
          {/* Protected Routes (examples) */}
          {/* <Route path="/exam/:examId" element={<ProtectedRoute role="student"><ExamPage /></ProtectedRoute>} /> */}
          {/* <Route path="/results/:submissionId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} /> */}
          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        {/* </AuthProvider> */}
      </Router>
    </div>
  );
}

export default App;
