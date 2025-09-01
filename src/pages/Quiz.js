import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, serverTimestamp } from "./../services/firebase";
import { ref, set, onValue, update } from "firebase/database";
import { useAuth } from "./../context/AuthContext";
import "./../assets/styles/Quiz.css";

const Quiz = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuizKey, setCurrentQuizKey] = useState(null);

  // Initialize quiz and load existing attempt
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      console.warn("No authenticated user found.");
      setError("Please log in to start the quiz.");
      navigate("/login");
      return;
    }

    const quizzesRef = ref(db, "quizzes");
    const unsubscribe = onValue(
      quizzesRef,
      (snapshot) => {
        const quizzesData = snapshot.val();
        if (quizzesData) {
          const latestQuizKey = Object.keys(quizzesData)[Object.keys(quizzesData).length - 1];
          setCurrentQuizKey(latestQuizKey);
          const quizData = quizzesData[latestQuizKey];
          if (quizData && quizData.active) {
            setQuizActive(true);
            setQuestions(
              quizData.questions
                ? Object.values(quizData.questions).map((q) => ({
                    question: q.question,
                    options: q.options,
                    answer: q.correct_answer,
                  }))
                : [{ question: "Sample: What is 1 + 1?", options: ["1", "2", "3", "4"], answer: "2" }]
            );
            setTimeLeft(
              quizData.startTime
                ? Math.max(
                    0,
                    quizData.duration - Math.floor((Date.now() - new Date(quizData.startTime).getTime()) / 1000)
                  )
                : 0
            );

            // Load or initialize quiz attempt
            const attemptRef = ref(db, `quizAttempts/${latestQuizKey}/${currentUser.uid}`);
            onValue(
              attemptRef,
              (attemptSnapshot) => {
                if (attemptSnapshot.exists()) {
                  const attemptData = attemptSnapshot.val();
                  setScore(attemptData.score || 0);
                  setAnswers(
                    attemptData.answers
                      ? Object.entries(attemptData.answers).map(([index, selected]) => ({
                          question: quizData.questions[parseInt(index)]?.question,
                          selected,
                          correct: quizData.questions[parseInt(index)]?.correct_answer,
                          isCorrect: selected === quizData.questions[parseInt(index)]?.correct_answer,
                        }))
                      : []
                  );
                  setCurrentQuestion(Object.keys(attemptData.answers || {}).length);
                } else {
                  set(attemptRef, {
                    studentName: currentUser.displayName || "Unknown Student",
                    score: 0,
                    questionsAnswered: 0,
                    totalQuestions: quizData.questions?.length || 1,
                    answers: {},
                    startTime: serverTimestamp(),
                    completed: false,
                    percentage: 0,
                  });
                }
                setLoading(false);
              },
              { onlyOnce: true }
            );
          } else {
            setError("No active quiz available.");
            navigate("/student-dashboard");
          }
        } else {
          setError("No quizzes available.");
          navigate("/student-dashboard");
        }
      },
      (error) => {
        console.error("Error fetching quiz data:", error);
        setError("Failed to load quiz.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  // Handle timer countdown
  useEffect(() => {
    let interval;
    if (quizActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            handleQuizCompletion();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizActive, timeLeft]);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const handleNext = async () => {
    if (!selectedOption || !currentQuizKey) {
      alert("Please select an option.");
      return;
    }

    try {
      const isCorrect = selectedOption === questions[currentQuestion].answer;
      const updatedAnswers = [
        ...answers,
        {
          question: questions[currentQuestion].question,
          selected: selectedOption,
          correct: questions[currentQuestion].answer,
          isCorrect,
        },
      ];
      setAnswers(updatedAnswers);

      const newScore = isCorrect ? score + 1 : score;
      const newQuestionsAnswered = currentQuestion + 1;

      // Save answer to Firebase
      const attemptRef = ref(db, `quizAttempts/${currentQuizKey}/${currentUser.uid}`);
      await update(attemptRef, {
        score: newScore,
        questionsAnswered: newQuestionsAnswered,
        totalQuestions: questions.length,
        [`answers/${currentQuestion}`]: selectedOption,
        percentage: ((newScore / questions.length) * 100).toFixed(2),
      });

      setScore(newScore);

      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedOption(null);
      } else {
        await handleQuizCompletion();
      }
    } catch (e) {
      console.error("Error saving answer:", e);
      setError("Failed to save answer.");
    }
  };

  const handleQuizCompletion = async () => {
    try {
      const attemptRef = ref(db, `quizAttempts/${currentQuizKey}/${currentUser.uid}`);
      await update(attemptRef, {
        completed: true,
        percentage: ((score / questions.length) * 100).toFixed(2),
      });

      // Save to quizResults for historical data
      const resultRef = ref(db, `quizResults/${currentUser.uid}/${currentQuizKey}`);
      await set(resultRef, {
        studentId: currentUser.uid,
        studentName: currentUser.displayName || "Unknown Student",
        quizTitle: "General Knowledge Quiz",
        score,
        totalQuestions: questions.length,
        percentage: ((score / questions.length) * 100).toFixed(2),
        timestamp: serverTimestamp(),
        answers,
        quizKey: currentQuizKey,
      });

      setShowResult(true);
      setQuizActive(false);
    } catch (e) {
      console.error("Error completing quiz:", e);
      setError("Failed to complete quiz.");
    }
  };

  const handleGoToDashboard = () => {
    navigate("/student-dashboard");
  };

  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="quiz-wrapper">
      <div className="quiz-container animate__animated animate__zoomIn">
        <h1 className="quiz-title">QuizSpark: Unleash Your Brilliance!</h1>
        {loading && <div className="loading-text">Fetching questions...</div>}
        {error && <p className="error-text">{error}</p>}
        {questions.length > 0 && !loading && (
          <>
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-text">
                Question {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <div className="timer-container">
              <span className="timer-text">
                Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>
            {!showResult ? (
              <div className="quiz-content">
                <h2 className="question-text animate__animated animate__fadeInDown">
                  {questions[currentQuestion].question}
                </h2>
                <div className="options-grid">
                  {questions[currentQuestion].options.map((option, index) => (
                    <div
                      key={index}
                      className={`option-card ${selectedOption === option ? "selected" : ""} animate__animated animate__fadeInUp`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleOptionClick(option)}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="option-text">{option}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`quiz-btn ${selectedOption ? "active" : ""} animate__animated animate__pulse`}
                  onClick={handleNext}
                  disabled={!selectedOption}
                >
                  {currentQuestion < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                </button>
              </div>
            ) : (
              <div className="result-card animate__animated animate__bounceIn">
                <h2 className="result-title">Your Quiz Results!</h2>
                <div className="score-circle">
                  <span className="score-text">
                    {score} / {questions.length || 1}
                  </span>
                  <span className="score-label">Your Score</span>
                </div>
                <p className="result-message">
                  {score === (questions.length || 1)
                    ? "Perfect! You're a Quiz Master! 🎉"
                    : score > (questions.length || 1) / 2
                    ? "Great Job! Keep Shining! 🌟"
                    : "Nice Try! Practice Makes Perfect! 💪"}
                </p>
                <div className="review-section">
                  <h3 className="review-title">Answer Review</h3>
                  {answers.map((ans, index) => (
                    <div key={index} className="review-item">
                      <p className="review-question">{ans.question}</p>
                      <p className={`review-answer ${ans.isCorrect ? "correct" : "incorrect"}`}>
                        Your Answer: {ans.selected}
                      </p>
                      <p className="review-correct">Correct Answer: {ans.correct}</p>
                    </div>
                  ))}
                </div>
                <button
                  className="quiz-btn dashboard-btn animate__animated animate__tada active"
                  onClick={handleGoToDashboard}
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;