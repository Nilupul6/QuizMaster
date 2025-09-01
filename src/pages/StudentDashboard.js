import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { ref, onValue, off, set, serverTimestamp } from "firebase/database";
import ProfileSetupDialog from "./ProfileSetupDialog";
import "../assets/styles/StudentDashboard.css";

const StudentDashboard = () => {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "Loading...",
    avatar: "https://www.gravatar.com/avatar?d=mp&s=80",
    completedQuizzes: 0,
    averageScore: 0,
  });
  const [progressData, setProgressData] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
  const [quizExpired, setQuizExpired] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [currentQuizKey, setCurrentQuizKey] = useState(null);

  useEffect(() => {
    if (!authLoading && currentUser) {
      const userId = currentUser.uid;

      setShowEditProfileModal(currentUser.profileSetupNeeded);

      // Fetch user profile
      const userProfileRef = ref(db, `users/${userId}`);
      const unsubscribeProfile = onValue(
        userProfileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const userProfile = snapshot.val();
            setUserData((prev) => ({
              ...prev,
              name: userProfile.name || currentUser.displayName || "Student",
              email: userProfile.email || currentUser.email || "No Email",
              avatar: userProfile.photoURL || currentUser.photoURL || "https://www.gravatar.com/avatar?d=mp&s=80",
            }));
          } else {
            setUserData((prev) => ({
              ...prev,
              name: currentUser.displayName || "Student",
              email: currentUser.email || "No Email",
              avatar: currentUser.photoURL || "https://www.gravatar.com/avatar?d=mp&s=80",
            }));
          }
        },
        (error) => {
          console.error("Error fetching user profile from Realtime DB:", error);
          setUserData((prev) => ({
            ...prev,
            name: currentUser.displayName || "Student",
            email: currentUser.email || "No Email",
            avatar: currentUser.photoURL || "https://www.gravatar.com/avatar?d=mp&s=80",
          }));
        }
      );

      // Fetch quiz results
      const quizResultsRef = ref(db, `quizResults/${userId}`);
      const unsubscribeQuizResults = onValue(
        quizResultsRef,
        (snapshot) => {
          const results = [];
          let totalScorePercentage = 0;
          let completedQuizzesCount = 0;

          if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
              const data = childSnapshot.val();
              const percentage = Number(data.percentage) || 0; // Convert percentage to number
              results.push({
                quiz: data.quizTitle || "Untitled Quiz",
                score: percentage,
                date: data.timestamp ? new Date(data.timestamp).toLocaleDateString() : "N/A",
              });
              totalScorePercentage += percentage;
              completedQuizzesCount++;
            });
          }

          results.sort((a, b) => new Date(b.date) - new Date(a.date));

          setProgressData(results);
          setUserData((prev) => ({
            ...prev,
            completedQuizzes: completedQuizzesCount,
            averageScore: completedQuizzesCount > 0 ? (totalScorePercentage / completedQuizzesCount).toFixed(0) : 0,
          }));
          setLoadingDashboard(false);
        },
        (error) => {
          console.error("Error fetching quiz results from Realtime DB:", error);
          setLoadingDashboard(false);
        }
      );

      // Check quiz status, countdown, and attempt
      const quizzesRef = ref(db, "quizzes");
      const unsubscribeQuizzes = onValue(
        quizzesRef,
        (snapshot) => {
          const quizzesData = snapshot.val();
          if (quizzesData) {
            const latestQuizKey = Object.keys(quizzesData)[Object.keys(quizzesData).length - 1];
            setCurrentQuizKey(latestQuizKey);
            const quizData = quizzesData[latestQuizKey];
            if (quizData) {
              // Handle countdown
              if (quizData.countdownActive && quizData.countdownStartTime && quizData.countdownDuration) {
                const startTime = new Date(quizData.countdownStartTime).getTime();
                const currentTime = Date.now();
                const elapsedTime = Math.floor((currentTime - startTime) / 1000);
                const remainingCountdown = Math.max(0, quizData.countdownDuration - elapsedTime);
                setCountdownActive(remainingCountdown > 0);
                setCountdownTimeLeft(remainingCountdown);
                setQuizActive(false);
                setQuizExpired(false);
              } else {
                setCountdownActive(false);
                setCountdownTimeLeft(0);
              }

              // Handle quiz
              if (quizData.active && quizData.startTime && quizData.duration) {
                const startTime = new Date(quizData.startTime).getTime();
                const currentTime = Date.now();
                const elapsedTime = Math.floor((currentTime - startTime) / 1000);
                const isExpired = elapsedTime >= quizData.duration;
                setQuizActive(quizData.active && !isExpired);
                setQuizExpired(isExpired);
              } else {
                setQuizActive(false);
                setQuizExpired(true);
              }

              // Check if user has already attempted this quiz
              const attemptRef = ref(db, `quizAttempts/${latestQuizKey}/${userId}`);
              onValue(
                attemptRef,
                (attemptSnapshot) => {
                  setHasAttempted(attemptSnapshot.exists());
                },
                { onlyOnce: true }
              );
            } else {
              setQuizActive(false);
              setCountdownActive(false);
              setQuizExpired(true);
              setHasAttempted(false);
              setCountdownTimeLeft(0);
            }
          } else {
            setQuizActive(false);
            setCountdownActive(false);
            setQuizExpired(true);
            setHasAttempted(false);
            setCurrentQuizKey(null);
            setCountdownTimeLeft(0);
          }
        },
        (error) => {
          console.error("Error fetching quiz status:", error);
          setQuizActive(false);
          setCountdownActive(false);
          setQuizExpired(true);
          setHasAttempted(false);
          setCountdownTimeLeft(0);
        }
      );

      return () => {
        off(userProfileRef, "value", unsubscribeProfile);
        off(quizResultsRef, "value", unsubscribeQuizResults);
        off(quizzesRef, "value", unsubscribeQuizzes);
      };
    } else if (!authLoading && !currentUser) {
      setLoadingDashboard(false);
    }
  }, [currentUser, authLoading]);

  // Handle countdown timer for UI
  useEffect(() => {
    let timer;
    if (countdownActive && countdownTimeLeft > 0) {
      timer = setInterval(() => {
        setCountdownTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdownActive, countdownTimeLeft]);

  const handleJoinQuiz = async () => {
    if (!currentQuizKey || hasAttempted) {
      alert(hasAttempted ? "You have already attempted this quiz." : "No active quiz available.");
      return;
    }

    try {
      const attemptRef = ref(db, `quizAttempts/${currentQuizKey}/${currentUser.uid}`);
      await set(attemptRef, {
        studentName: userData.name || currentUser.displayName || "Student",
        score: 0,
        questionsAnswered: 0,
        totalQuestions: 0, // Will be updated in QuizPage.js
        startTime: serverTimestamp(),
      });
      navigate("/quiz");
    } catch (error) {
      console.error("Error recording quiz attempt:", error);
      alert("Failed to join quiz. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  if (authLoading || loadingDashboard) {
    return <div className="loader">Loading Dashboard...</div>;
  }

  const shouldShowProfileDialog = currentUser?.profileSetupNeeded || showEditProfileModal;

  return (
    <div className="dashboard-container">
      {shouldShowProfileDialog && (
        <ProfileSetupDialog onClose={() => setShowEditProfileModal(false)} />
      )}

      {/* Sidebar */}
      <aside className="sidebar animate__animated animate__fadeInLeft">
        <div className="sidebar-top-content">
          <div className="sidebar-logo">
            <h2>QuizSpark</h2>
          </div>
          <nav className="sidebar-nav">
            <Link to="/student-dashboard" className="nav-link active">
              <span className="material-icons">Dashboard</span>
            </Link>
            <Link to="#" className="nav-link">
              <span className="material-icons">Quiz</span>
            </Link>
            <Link to="#" className="nav-link">
              <span className="material-icons">Courses</span>
            </Link>
            <Link to="#" className="nav-link">
              <span className="material-icons">Settings</span>
            </Link>
          </nav>
        </div>
      </aside>

      <div className="main-content-wrapper">
        <main className="main-content">
          <header className="header animate__animated animate__fadeInDown">
            <h1>Welcome, {userData.name}!</h1>
            <div className="header-actions">
              <img src={userData.avatar} alt="Avatar" className="avatar" />
              <button onClick={handleLogout} className="logout-header-btn animate-pulse-red">
                <span className="material-icons">logout</span><span className="nav-icon">🔓</span>
              </button>
            </div>
          </header>

          <section className="join-quiz-section animate__animated animate__pulse animate__infinite">
            <Link
              to="/quiz"
              className={`join-quiz-btn ${
                !quizActive || quizExpired || hasAttempted || countdownActive ? "locked" : ""
              }`}
              onClick={(e) => {
                if (!quizActive || quizExpired || hasAttempted || countdownActive) {
                  e.preventDefault();
                } else {
                  handleJoinQuiz();
                }
              }}
            >
              <span className="material-icons">star</span>
              {countdownActive && countdownTimeLeft > 0
                ? `Quiz Starts in ${Math.floor(countdownTimeLeft / 60)}:${
                    countdownTimeLeft % 60 < 10 ? `0${countdownTimeLeft % 60}` : countdownTimeLeft % 60
                  }`
                : "Join a Quiz Now!"}
              {(!quizActive || quizExpired || hasAttempted || countdownActive) && (
                <span className="lock-overlay">
                  {hasAttempted
                    ? "Already Attempted"
                    : quizExpired
                    ? "Expired"
                    : countdownActive
                    ? "Preparing..."
                    : "Locked"}
                </span>
              )}
            </Link>
          </section>

          <section className="dashboard-grid animate__animated animate__fadeInUp">
            <div className="card quiz-card1">
              <h3 className="card-title">Available Quizzes</h3>
              <p className="card-description">Explore new quizzes to challenge your knowledge.</p>
              <Link
                to="/quiz"
                className={`btn btn-primary ${
                  !quizActive || quizExpired || hasAttempted || countdownActive ? "disabled" : ""
                }`}
                onClick={(e) => {
                  if (!quizActive || quizExpired || hasAttempted || countdownActive) {
                    e.preventDefault();
                  } else {
                    handleJoinQuiz();
                  }
                }}
              >
                View Quizzes
              </Link>
            </div>

            <div className="card progress-card">
              <h3 className="card-title">Your Progress</h3>
              <div className="progress-stats">
                <div className="stat">
                  <span className="stat-value">{userData.completedQuizzes}</span>
                  <span className="stat-label">Quizzes Completed</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{userData.averageScore}%</span>
                  <span className="stat-label">Average Score</span>
                </div>
              </div>
              <div className="progress-list">
                {progressData.length > 0 ? (
                  progressData.map((item, index) => (
                    <div key={index} className="progress-item">
                      <span className="quiz-name">{item.quiz}</span>
                      <span className="score">
                        {item.score !== undefined && item.score !== null
                          ? Number(item.score).toFixed(0)
                          : "0"}%
                      </span>
                      <span className="date">{item.date}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-progress-message">No quiz results yet. Take a quiz to see your progress!</p>
                )}
              </div>
            </div>

            <div className="card profile-card1">
              <h3 className="card-title">Your Profile</h3>
              <div className="profile-info">
                <img src={userData.avatar} alt="Avatar" className="profile-avatar" />
                <p>
                  <strong>Name:</strong> {userData.name}
                </p>
                <p>
                  <strong>Email:</strong> {userData.email}
                </p>
                <button className="btn btn-secondary" onClick={() => setShowEditProfileModal(true)}>
                  Edit Profile
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="footer">
          
          <div className="footer-links">
            {/* <Link className="copyright" to="#">© {new Date().getFullYear()} QuizSpark. All rights reserved.</Link><br /><br /> */}
            <Link className="copyright"to="#"style={{ fontWeight: 'bold', fontSize: '1.1rem' }}> © {new Date().getFullYear()} QuizSpark. All rights reserved.</Link>
            <br/>  <br/>
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Service</Link>
            <Link to="#">Contact Us</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default StudentDashboard;