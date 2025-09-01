import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UploadLesson from "./pages/UploadLesson"; // Ensure this page is imported
import GenerateQuizPage from "./pages/GenerateQuizPage"; // New page for quiz generation
import ExtractPdfContent from "./pages/ExtractPdfContent"; // New page for PDF extraction
import UserManagement from "./pages/UserManagement"; 
import { AuthProvider, useAuth } from "./context/AuthContext";
import Quiz from "./pages/Quiz";

/* 🔐 Block dashboards until auth finished, secure admin access */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { currentUser, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login", { replace: true });
    } else if (!loading && requireAdmin && !isAdmin) {
      navigate("/student-dashboard", { replace: true });
    }
  }, [currentUser, loading, isAdmin, requireAdmin, navigate]);

  if (loading) return <div className="loader">Loading…</div>; // or spinner
  if (!currentUser || (requireAdmin && !isAdmin)) return <></>; // Redirect handled by useEffect
  return children;
}

/* 🔁 Block login/register once logged in, redirect based on admin status */
const GuestOnlyRoute = ({ children }) => {
  const { currentUser, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate(isAdmin ? "/admin-dashboard" : "/student-dashboard", { replace: true });
    }
  }, [currentUser, loading, isAdmin, navigate]);

  if (loading) return <div className="loader">Loading…</div>;
  if (currentUser) return <></>; // Redirect handled by useEffect
  return children;
};

function AppWrapper() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
          {/* --- FIX: Changed /quiz to ProtectedRoute --- */}
          <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
          <Route
            path="/student-dashboard"
            element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin-dashboard"
            element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>}
          />
          <Route 
            path="/upload-lesson" 
            element={<ProtectedRoute requireAdmin={true}><UploadLesson /></ProtectedRoute>} 
          />
          {/* Add the Generate Quiz route */}
          <Route 
            path="/generate-quiz" 
            element={<ProtectedRoute requireAdmin={true}><GenerateQuizPage /></ProtectedRoute>} 
          />
          {/* Add the Extract PDF route */}
          <Route 
            path="/extract-pdf" 
            element={<ProtectedRoute requireAdmin={true}><ExtractPdfContent /></ProtectedRoute>} 
          />
          <Route 
            path="/manage-user" 
            element={<ProtectedRoute requireAdmin={true}><UserManagement /></ProtectedRoute>} 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppWrapper;
