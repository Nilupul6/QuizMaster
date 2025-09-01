import React, { useState, useEffect } from "react";
import "./../assets/styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase"; // 🔁 make sure this is your Firebase auth export

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(""); // Added state for email
  const [password, setPassword] = useState(""); // Added state for password
  const navigate = useNavigate(); // 🔁 For navigation after login

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User logged in:", user.email);
      } else {
        console.log("User logged out");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const user = userCredential.user;
    const userEmail = user.email;

    console.log("Logged in:", userEmail);

    // ✳️ Basic role check by email
    if (userEmail === "admin@example.com") {
      navigate("/admin-dashboard"); // route for AdminDashboard.js
    } else {
      navigate("/student-dashboard"); // route for StudentDashboard.js
    }

  } catch (error) {
    console.error("Login failed:", error.message);
    alert("Login failed: " + error.message);
  }
};

  return (
     <div className="page1">
    <div className="login-container1">
      <h1 className="login-title">
        Welcome to <span className="highlight1">QuizMaster</span>
      </h1>
      <p className="subtitle">Sign in to your account to start taking quizzes</p>

      <div className="login-box">
        <h2 className="form-title">Sign In</h2>
        <p className="form-subtitle">
          Enter your email and password to access your account
        </p>

        <form onSubmit={handleLogin}>
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <p className="signup-text">
          Don’t have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>

      <a href="/" className="back-link">
        ← Back to Home
      </a>
    </div>
    </div>
  );
};

export default Login;
