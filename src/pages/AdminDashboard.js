import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db, ref, onValue } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { BlobServiceClient } from "@azure/storage-blob";
import { motion, AnimatePresence } from "framer-motion";
import ExtractPdfContent from "./ExtractPdfContent";
import UploadLesson from "./UploadLesson";
import UserManagement from "./UserManagement";
import "../assets/styles/AdminDashboard.css";

const statCards = [
  { title: "Total Users", value: 0, icon: "👤", color: "#007bff", progress: 3 },
  { title: "PDF Lessons", value: 0, icon: "📄", color: "#28a745", progress: 3},
  { title: "Quizzes Generated", value: 11, icon: "✨", color: "#dc3545", progress: 11 },
  { title: "Active Quizzes", value: 1, icon: "🎯", color: "#17a2b8", progress: 1 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [pdfCount, setPdfCount] = useState(0);
  const [pdfList, setPdfList] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [adminDetails] = useState({ email: currentUser?.email || "admin@example.com", name: "Floyd Miles" });

  useEffect(() => {
    // Fetch PDFs
    const fetchUploadedPDFs = async () => {
      try {
        const containerClient = new BlobServiceClient(
          `https://pdfcollection.blob.core.windows.net/?sv=2024-11-04&ss=bf&srt=sco&sp=rwdlacitfx&se=2025-09-09T17:02:06Z&st=2025-06-09T09:02:06Z&spr=https&sig=7jvJqs69uPjZ2T79iTOw0zCdloZgngLupObAVsEjUJs%3D`
        ).getContainerClient("lessons");

        const pdfs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
          if (blob.name.endsWith(".pdf")) {
            pdfs.push(blob.name);
          }
        }
        setPdfList(pdfs);
        setPdfCount(pdfs.length);
        statCards.find((card) => card.title === "PDF Lessons").value = pdfs.length;
      } catch (error) {
        console.error("Error fetching PDFs:", error.message);
      }
    };

    // Fetch Users
    const fetchUsers = () => {
      const usersRef = ref(db, 'users');
      const unsubscribe = onValue(
        usersRef,
        (snapshot) => {
          const data = snapshot.val();
          const count = data ? Object.keys(data).length : 0;
          setUserCount(count);
          statCards.find((card) => card.title === "Total Users").value = count;
        },
        (err) => {
          console.error("Error fetching users:", err.message);
        }
      );
      return unsubscribe;
    };

    setIsLoading(true);
    fetchUploadedPDFs().finally(() => setIsLoading(false));
    const unsubscribeUsers = fetchUsers();

    return () => unsubscribeUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case "generate-quiz":
        return (
          <motion.div
            className="extract-pdf-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ExtractPdfContent setActiveSection={setActiveSection} />
          </motion.div>
        );
      case "upload-lesson":
        return (
          <motion.div
            className="upload-lesson-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <UploadLesson setActiveSection={setActiveSection} />
          </motion.div>
        );
      case "manage-users":
        return (
          <motion.div
            className="user-management-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <UserManagement />
          </motion.div>
        );
      default:
        return (
          <AnimatePresence>
            <motion.div
              className="dashboard-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <motion.div
                className="dashboard-header"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h1 className="dashboard-title">Admin Dashboard</h1>
              </motion.div>

              <motion.div
                className="stats-grid"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, staggerChildren: 0.1 }}
              >
                {statCards.map((card, index) => (
                  <motion.div
                    key={index}
                    className="stat-card"
                    style={{ "--card-color": card.color }}
                    initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                  >
                    <div className="stat-icon">{card.icon}</div>
                    <div className="stat-info">
                      <p className="stat-title">{card.title}</p>
                      <p className="stat-value">
                        {card.title === "PDF Lessons" ? pdfCount : card.title === "Total Users" ? userCount : card.value}
                      </p>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${card.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ backgroundColor: card.color }}
                        ></motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="bottom-section"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <div className="card recent-uploads">
                  <h2 className="card-title">Recent Uploads</h2>
                  {isLoading ? (
                    <p className="loading-text">Loading PDFs...</p>
                  ) : (
                    <ul className="upload-list">
                      {pdfList.length > 0 ? (
                        pdfList.map((pdf, index) => (
                          <motion.li
                            key={index}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                          >
                            <span>{pdf}</span>
                            <span className="upload-date">Uploaded</span>
                          </motion.li>
                        ))
                      ) : (
                        <motion.li
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                        >
                          No PDFs uploaded yet.
                        </motion.li>
                      )}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        );
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <motion.div
            className="profile-card"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="profile-avatar">
              <motion.div
                className="initial-avatar"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, yoyo: Infinity, ease: "easeInOut" }}
              >
                {adminDetails.email.charAt(0).toUpperCase()}
              </motion.div>
              <div className="status-badge"></div>
            </div>
            <div className="profile-details">
              <motion.h3
                className="profile-name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {adminDetails.email}
              </motion.h3>
              <motion.p
                className="profile-role"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Admin
              </motion.p>
            </div>
          </motion.div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li
              onClick={() => setActiveSection("dashboard")}
              className={activeSection === "dashboard" ? "active" : ""}
            >
              <span className="nav-icon">🏠</span>
              <span>Dashboard</span>
            </li>
            <li
              onClick={() => setActiveSection("upload-lesson")}
              className={activeSection === "upload-lesson" ? "active" : ""}
            >
              <span className="nav-icon">📤</span>
              <span>Upload Lesson</span>
            </li>
            <li
              onClick={() => setActiveSection("generate-quiz")}
              className={activeSection === "generate-quiz" ? "active" : ""}
            >
              <span className="nav-icon">✨</span>
              <span>Generate Quiz</span>
            </li>
            <li
              onClick={() => setActiveSection("manage-users")}
              className={activeSection === "manage-users" ? "active" : ""}
            >
              <span className="nav-icon">👥</span>
              <span>Manage Users</span>
            </li>
            <li onClick={handleLogout}>
              <span className="nav-icon">🔓</span>
              <span>Logout</span>
            </li>
          </ul>
        </nav>
      </div>
      <div className="main-content">{renderMainContent()}</div>
    </div>
  );
};

export default AdminDashboard;
