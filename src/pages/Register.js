import React, { useState } from "react";
import "./../assets/styles/Login.css";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
// Optional for role storage:
// import { db } from "../services/firebase";
// import { doc, setDoc } from "firebase/firestore";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleRegister = async (e) => {
  e.preventDefault();

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const userEmail = userCredential.user.email;

    // 🔁 Navigate based on email
    if (userEmail === "admin@example.com") {
      navigate("/admin-dashboard");
    } else {
      navigate("/student-dashboard");
    }

  } catch (error) {
    alert("Registration failed: " + error.message);
  }
};

  return (
     <div className="page1">
    <div className="login-container1">
      <h1 className="login-title">
        Join <span className="highlight1">QuizMaster</span>
      </h1>
      <p className="subtitle">Sign up to create your quiz account</p>

      <div className="login-box">
        <h2 className="form-title">Sign Up</h2>
        <p className="form-subtitle">
          Enter your email and password to create an account
        </p>

        <form onSubmit={handleRegister}>
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
                placeholder="Create a password"
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
            Sign Up
          </button>
        </form>

        <p className="signup-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>

      <a href="/" className="back-link">
        ← Back to Home
      </a>
    </div>
    </div>
  );
};

export default Register;
