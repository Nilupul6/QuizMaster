// import React, { useState, useEffect } from "react";
// import { BlobServiceClient } from "@azure/storage-blob";
// import axios from "axios";
// import { db, ref, set, push, remove, onValue, update } from "../services/firebase";
// import "../assets/styles/ExtractContent.css";

// const GenerateQuizPage = () => {
//   const [pdfList, setPdfList] = useState([]);
//   const [selectedPdf, setSelectedPdf] = useState("");
//   const [extractedContent, setExtractedContent] = useState("");
//   const [quizQuestions, setQuizQuestions] = useState([]);
//   const [quizCount, setQuizCount] = useState(10);
//   const [quizDuration, setQuizDuration] = useState(300);
//   const [countdownDuration, setCountdownDuration] = useState(60);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
//   const [quizActive, setQuizActive] = useState(false);
//   const [countdownActive, setCountdownActive] = useState(false);
//   const [leaderboard, setLeaderboard] = useState([]);
//   const [quizKey, setQuizKey] = useState(null);
//   const [showQuestions, setShowQuestions] = useState(true);

//   // Load existing quiz state from Firebase on mount
//   useEffect(() => {
//     const quizzesRef = ref(db, "quizzes");
//     const unsubscribe = onValue(
//       quizzesRef,
//       (snapshot) => {
//         const quizzesData = snapshot.val();
//         if (quizzesData) {
//           const latestQuizKey = Object.keys(quizzesData)[Object.keys(quizzesData).length - 1];
//           const quizData = quizzesData[latestQuizKey];
//           if (quizData) {
//             setQuizKey(latestQuizKey);
//             setQuizActive(quizData.active || false);
//             setCountdownActive(quizData.countdownActive || false);
//             setShowQuestions(!quizData.active && !quizData.countdownActive);
//             setQuizQuestions(
//               quizData.questions
//                 ? Object.values(quizData.questions).map((q) => ({
//                     question: q.question,
//                     options: q.options,
//                     correct_answer: q.correct_answer,
//                   }))
//                 : []
//             );
//             setSelectedPdf(quizData.pdfSource || "");
//             setQuizDuration(quizData.duration || 300);
//             setCountdownDuration(quizData.countdownDuration || 60);
//             setExtractedContent(quizData.extractedContent || "");

//             // Handle countdown timer
//             if (quizData.countdownActive && quizData.countdownStartTime) {
//               const startTime = new Date(quizData.countdownStartTime).getTime();
//               const currentTime = Date.now();
//               const elapsedTime = Math.floor((currentTime - startTime) / 1000);
//               const remainingCountdown = Math.max(0, quizData.countdownDuration - elapsedTime);
//               setCountdownTimeLeft(remainingCountdown);
//             } else {
//               setCountdownTimeLeft(0);
//             }

//             // Handle quiz timer
//             if (quizData.active && quizData.startTime) {
//               const startTime = new Date(quizData.startTime).getTime();
//               const currentTime = Date.now();
//               const elapsedTime = Math.floor((currentTime - startTime) / 1000);
//               const remainingTime = Math.max(0, quizData.duration - elapsedTime);
//               setTimeLeft(remainingTime);
//             } else {
//               setTimeLeft(0);
//             }
//           } else {
//             resetState();
//           }
//         } else {
//           resetState();
//         }
//       },
//       (error) => {
//         console.error("Error fetching quiz data:", error);
//         setError("Failed to load quiz state.");
//       }
//     );

//     const resetState = () => {
//       setQuizKey(null);
//       setQuizActive(false);
//       setCountdownActive(false);
//       setShowQuestions(true);
//       setQuizQuestions([]);
//       setSelectedPdf("");
//       setExtractedContent("");
//       setTimeLeft(0);
//       setCountdownTimeLeft(0);
//       setLeaderboard([]);
//     };

//     return () => unsubscribe();
//   }, []);

//   // Warn admin before leaving page during countdown
//   useEffect(() => {
//     const handleBeforeUnload = (event) => {
//       if (countdownActive && countdownTimeLeft > 0) {
//         event.preventDefault();
//         // Modern browsers may ignore custom messages, but we set it for compatibility
//         event.returnValue = "Leaving the page will cancel the quiz. Are you sure?";
//         // Use navigator.sendBeacon for reliable cleanup
//         if (quizKey) {
//           const quizRef = ref(db, `quizzes/${quizKey}`).toString();
//           const updateData = {
//             active: false,
//             countdownActive: false,
//             startTime: null,
//             countdownStartTime: null,
//           };
//           navigator.sendBeacon(
//             quizRef,
//             JSON.stringify(updateData)
//           );
//         }
//       }
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => window.removeEventListener("beforeunload", handleBeforeUnload);
//   }, [countdownActive, countdownTimeLeft, quizKey]);

//   // Trigger quiz start when countdown ends
//   useEffect(() => {
//     if (countdownActive && countdownTimeLeft <= 0 && !quizActive && quizKey) {
//       handleStartQuiz(quizKey);
//     }
//   }, [countdownActive, countdownTimeLeft, quizActive, quizKey]);

//   // Fetch PDF files from Azure Blob Storage
//   useEffect(() => {
//     const fetchUploadedPDFs = async () => {
//       try {
//         const containerClient = new BlobServiceClient(
//           `https://pdfcollection.blob.core.windows.net/?sv=2024-11-04&ss=bf&srt=sco&sp=rwdlacitfx&se=2025-09-09T17:02:06Z&st=2025-06-09T09:02:06Z&spr=https&sig=7jvJqs69uPjZ2T79iTOw0zCdloZgngLupObAVsEjUJs%3D`
//         ).getContainerClient("lessons");

//         const pdfs = [];
//         for await (const blob of containerClient.listBlobsFlat()) {
//           if (blob.name.endsWith(".pdf")) {
//             pdfs.push(blob.name);
//           }
//         }
//         setPdfList(pdfs);
//       } catch (error) {
//         setError("Error fetching PDFs from Azure Blob Storage.");
//         console.error("Error fetching PDFs:", error.message);
//       }
//     };

//     fetchUploadedPDFs();
//   }, []);

//   // Fetch live leaderboard data for the current quiz
//   useEffect(() => {
//     if (!quizKey) return;

//     const quizAttemptsRef = ref(db, `quizAttempts/${quizKey}`);
//     const unsubscribe = onValue(
//       quizAttemptsRef,
//       (snapshot) => {
//         const attemptsData = snapshot.val();
//         if (attemptsData) {
//           const leaderboardArray = Object.entries(attemptsData).map(([userId, data]) => ({
//             studentId: userId,
//             studentName: data.studentName || "Unknown Student",
//             score: data.score || 0,
//             totalQuestions: data.totalQuestions || quizQuestions.length || 0,
//             questionsAnswered: data.questionsAnswered || 0,
//             percentage: data.totalQuestions ? ((data.score / data.totalQuestions) * 100).toFixed(2) : 0,
//           }));
//           leaderboardArray.sort((a, b) => b.percentage - a.percentage || b.questionsAnswered - a.questionsAnswered);
//           setLeaderboard(leaderboardArray);
//         } else {
//           setLeaderboard([]);
//         }
//       },
//       (error) => {
//         console.error("Error fetching live leaderboard:", error.message);
//         setError("Failed to load live leaderboard.");
//       }
//     );

//     return () => unsubscribe();
//   }, [quizKey, quizQuestions.length]);

//   // Handle countdown timer
//   useEffect(() => {
//     let timer;
//     if (countdownActive && countdownTimeLeft > 0) {
//       timer = setInterval(() => {
//         setCountdownTimeLeft((prevTime) => {
//           const newTime = prevTime - 1;
//           if (newTime <= 0) {
//             clearInterval(timer);
//             return 0;
//           }
//           return newTime;
//         });
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [countdownActive, countdownTimeLeft]);

//   // Handle quiz timer
//   useEffect(() => {
//     let timer;
//     if (quizActive && timeLeft > 0) {
//       timer = setInterval(() => {
//         setTimeLeft((prevTime) => {
//           const newTime = prevTime - 1;
//           if (newTime <= 0) {
//             clearInterval(timer);
//             return 0;
//           }
//           return newTime;
//         });
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [quizActive, timeLeft]);

//   // Handle PDF selection
//   const handleSelectPdf = (event) => {
//     setSelectedPdf(event.target.value);
//   };

//   // Handle quiz count change
//   const handleQuizCountChange = (event) => {
//     setQuizCount(event.target.value);
//   };

//   // Handle quiz duration change
//   const handleQuizDurationChange = (event) => {
//     setQuizDuration(event.target.value);
//   };

//   // Handle countdown duration change
//   const handleCountdownDurationChange = (event) => {
//     setCountdownDuration(event.target.value);
//   };

//   // Poll for Document Intelligence API result
//   const pollForResult = async (operationUrl) => {
//     let result = null;
//     while (!result || result.status !== "succeeded") {
//       const response = await axios.get(operationUrl, {
//         headers: {
//           "Ocp-Apim-Subscription-Key": "DcglSYtpSK1w7YNXkGb4ND2ccmU2zbWbhSOt1qdgCchCsBablVxSJQQJ99BFACYeBjFXJ3w3AAALACOGr51d",
//         },
//       });
//       result = response.data;
//       if (result.status === "failed") {
//         throw new Error("Document Intelligence failed: " + (result.error?.message || "Unknown error"));
//       }
//       if (result.status === "running") {
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     }
//     return result;
//   };

//   // Extract content from PDF and generate quiz
//   const handleExtractContent = async () => {
//     if (!selectedPdf) {
//       alert("Please select a PDF to extract content.");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);
//     setQuizQuestions([]);
//     setShowQuestions(true);

//     try {
//       // Delete existing quizzes and attempts
//       const quizzesRef = ref(db, "quizzes");
//       const quizAttemptsRef = ref(db, "quizAttempts");
//       await remove(quizzesRef);
//       await remove(quizAttemptsRef);

//       // Extract content from PDF
//       const pdfUrl = `https://pdfcollection.blob.core.windows.net/lessons/${selectedPdf}`;
//       const response = await axios.post(
//         "https://dpftextextract.cognitiveservices.azure.com/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30",
//         { urlSource: pdfUrl },
//         {
//           headers: {
//             "Ocp-Apim-Subscription-Key": "DcglSYtpSK1w7YNXkGb4ND2ccmU2zbWbhSOt1qdgCchCsBablVxSJQQJ99BFACYeBjFXJ3w3AAALACOGr51d",
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const operationUrl = response.headers["operation-location"];
//       if (!operationUrl) {
//         throw new Error("No operation location found.");
//       }

//       const result = await pollForResult(operationUrl);
//       const extractedText = result.analyzeResult?.content || "No content extracted.";
//       setExtractedContent(extractedText);

//       // Generate quiz questions
//       const quizResponse = await axios.post(
//         "https://19ict-mbyp7rea-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview",
//         {
//           messages: [
//             {
//               role: "system",
//               content: `You are a helpful assistant. Generate ${quizCount} quiz questions based on the provided content. Each question should have 4 options with one correct answer. Return the response as a raw JSON array of objects with 'question', 'options', and 'correct_answer' fields. Do not include Markdown formatting or backticks. Example: [{"question":"What is 1+1?","options":["1","2","3","4"],"correct_answer":"2"}]`,
//             },
//             {
//               role: "user",
//               content: extractedText,
//             },
//           ],
//         },
//         {
//           headers: {
//             "Authorization": "Bearer A5wPczJtl2GFyXGmNrHPsjPVedBfwTeXjRiimAMuiPv06TZhmz12JQQJ99BFACHYHv6XJ3w3AAAAACOGmcXu",
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const quizData = quizResponse.data.choices[0].message.content;
//       console.log("Raw quiz data from API:", quizData);

//       // Clean the response to remove Markdown
//       let cleanedQuizData = quizData
//         .replace(/^```json\s*/, '')
//         .replace(/\s*```$/, '')
//         .replace(/^```\s*/, '')
//         .trim();

//       let parsedQuizData;
//       try {
//         parsedQuizData = JSON.parse(cleanedQuizData);
//       } catch (e) {
//         console.error("Raw quiz data parsing failed:", cleanedQuizData);
//         throw new Error("Failed to parse quiz data: " + e.message);
//       }

//       if (!Array.isArray(parsedQuizData)) {
//         throw new Error("Quiz data is not an array of questions.");
//       }

//       setQuizQuestions(parsedQuizData);

//       // Save quiz to Firebase
//       const newQuizRef = push(quizzesRef);
//       const newQuizKey = newQuizRef.key;
//       setQuizKey(newQuizKey);
//       const quizDataRef = ref(db, `quizzes/${newQuizKey}`);

//       await set(quizDataRef, {
//         questions: parsedQuizData.map((item) => ({
//           question: item.question,
//           options: item.options,
//           correct_answer: item.correct_answer,
//         })),
//         createdAt: new Date().toISOString(),
//         pdfSource: selectedPdf,
//         duration: parseInt(quizDuration),
//         countdownDuration: parseInt(countdownDuration),
//         active: false,
//         countdownActive: false,
//         startTime: null,
//         countdownStartTime: null,
//         extractedContent: extractedText,
//       });

//       setIsLoading(false);
//     } catch (error) {
//       setError(`Failed to extract content: ${error.message}`);
//       setIsLoading(false);
//       console.error("Error extracting content:", error);
//     }
//   };

//   // Start the countdown
//   const handleStartCountdown = async () => {
//     try {
//       if (!quizQuestions.length) {
//         throw new Error("No quiz questions generated. Please extract content first.");
//       }
//       if (quizKey) {
//         const quizRef = ref(db, `quizzes/${quizKey}`);
//         await update(quizRef, {
//           countdownActive: true,
//           countdownStartTime: new Date().toISOString(),
//           countdownDuration: parseInt(countdownDuration),
//         });
//         setCountdownActive(true);
//         setCountdownTimeLeft(parseInt(countdownDuration));
//       }
//     } catch (error) {
//       setError(error.message || "Failed to start countdown.");
//       console.error("Error starting countdown:", error);
//     }
//   };

//   // Start the quiz
//   const handleStartQuiz = async (key = quizKey) => {
//     try {
//       if (!quizQuestions.length) {
//         throw new Error("No quiz questions generated.");
//       }
//       if (key && !quizActive) {
//         const quizRef = ref(db, `quizzes/${key}`);
//         await update(quizRef, {
//           active: true,
//           startTime: new Date().toISOString(),
//           countdownActive: false,
//           countdownStartTime: null,
//         });
//         setQuizActive(true);
//         setCountdownActive(false);
//         setTimeLeft(quizDuration);
//         setCountdownTimeLeft(0);
//         setShowQuestions(false);
//       }
//     } catch (error) {
//       setError(error.message || "Failed to start quiz.");
//       console.error("Error starting quiz:", error);
//     }
//   };

//   // Close the quiz
//   const handleCloseQuiz = async (key = quizKey) => {
//     try {
//       if (key) {
//         const quizRef = ref(db, `quizzes/${key}`);
//         await update(quizRef, {
//           active: false,
//           countdownActive: false,
//           startTime: null,
//           countdownStartTime: null,
//         });
//         setQuizActive(false);
//         setCountdownActive(false);
//         setTimeLeft(0);
//         setCountdownTimeLeft(0);
//         setQuizKey(null);
//         setQuizQuestions([]);
//         setLeaderboard([]);
//         setExtractedContent("");
//         setSelectedPdf("");
//         setShowQuestions(true);
//       }
//     } catch (error) {
//       setError(error.message || "Failed to close quiz.");
//       console.error("Error closing quiz:", error);
//     }
//   };

//   return (
//     <div className="generate-quiz-page">
//       <h1>Generate Quiz from PDF</h1>

//       {error && <div className="error">{error}</div>}

//       {/* PDF Selection */}
//       <div className="pdf-selection">
//         <h2>Select PDF Lesson:</h2>
//         <select value={selectedPdf} onChange={handleSelectPdf} disabled={quizActive || countdownActive}>
//           <option value="">Select a PDF</option>
//           {pdfList.length > 0 ? (
//             pdfList.map((pdf, index) => (
//               <option key={index} value={pdf}>
//                 {pdf}
//               </option>
//             ))
//           ) : (
//             <option value="">No PDFs available</option>
//           )}
//         </select>
//       </div>

//       {/* Quiz Count Input */}
//       <div className="quiz-count">
//         <h2>Number of Quiz Questions:</h2>
//         <input
//           type="number"
//           value={quizCount}
//           onChange={handleQuizCountChange}
//           min="1"
//           max="20"
//           className="quiz-count-input"
//           disabled={quizActive || countdownActive}
//         />
//       </div>

//       {/* Quiz Duration Input */}
//       <div className="quiz-duration">
//         <h2>Quiz Duration (seconds):</h2>
//         <input
//           type="number"
//           value={quizDuration}
//           onChange={handleQuizDurationChange}
//           min="60"
//           max="3600"
//           className="quiz-duration-input"
//           disabled={quizActive || countdownActive}
//         />
//       </div>

//       {/* Countdown Duration Input */}
//       <div className="quiz-duration">
//         <h2>Countdown Duration (seconds):</h2>
//         <input
//           type="number"
//           value={countdownDuration}
//           onChange={handleCountdownDurationChange}
//           min="10"
//           max="300"
//           className="quiz-duration-input"
//           disabled={quizActive || countdownActive}
//         />
//       </div>

//       {/* Extracted Content Display */}
//       {extractedContent && !quizActive && !countdownActive && (
//         <div className="extracted-content">
//           <h2>Extracted Content:</h2>
//           <p>
//             {extractedContent.substring(0, 500)}... {extractedContent.length > 500 ? "(Truncated)" : ""}
//           </p>
//         </div>
//       )}

//       {/* Extract Content Button */}
//       <button onClick={handleExtractContent} disabled={isLoading || quizActive || countdownActive}>
//         {isLoading ? "Extracting..." : "Extract Content"}
//       </button>

//       {/* Start Countdown Button */}
//       <button
//         onClick={handleStartCountdown}
//         disabled={isLoading || quizActive || countdownActive || !quizQuestions.length}
//       >
//         {countdownActive ? "Countdown Running" : "Start Countdown"}
//       </button>

//       {/* Start Quiz Button (for manual start if needed) */}
//       <button
//         onClick={() => handleStartQuiz(quizKey)}
//         disabled={isLoading || quizActive || countdownActive || !quizQuestions.length}
//       >
//         {quizActive ? "Quiz Running" : "Start Quiz Immediately"}
//       </button>

//       {/* Close Quiz Button */}
//       {quizActive && (
//         <button onClick={() => handleCloseQuiz(quizKey)} className="close-quiz-btn">
//           Close Quiz
//         </button>
//       )}

//       {/* Countdown Timer */}
//       {countdownActive && countdownTimeLeft > 0 && (
//         <div className="timer">
//           <h2>
//             Countdown: {Math.floor(countdownTimeLeft / 60)}:
//             {countdownTimeLeft % 60 < 10 ? `0${countdownTimeLeft % 60}` : countdownTimeLeft % 60}
//           </h2>
//         </div>
//       )}

//       {/* Quiz Timer */}
//       {quizActive && timeLeft > 0 && (
//         <div className="timer">
//           <h2>
//             Time Remaining: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
//           </h2>
//         </div>
//       )}

//       {/* Display Quiz Questions (only before countdown/quiz starts) */}
//       {quizQuestions.length > 0 && showQuestions && !quizActive && !countdownActive && (
//         <div className="quiz-questions">
//           <h2>Quiz Questions:</h2>
//           {quizQuestions.map((item, index) => (
//             <div key={index} className="quiz-card">
//               <p>
//                 <strong>Question:</strong> {item.question}
//               </p>
//               <p>
//                 <strong>Options:</strong> {item.options?.join(", ")}
//               </p>
//               <p>
//                 <strong>Correct Answer:</strong> {item.correct_answer}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Display Live Leaderboard */}
//       {quizKey && (
//         <div className="leaderboard">
//           <h2>Live Leaderboard (Current Quiz)</h2>
//           {leaderboard.length > 0 ? (
//             <table className="leaderboard-table">
//               <thead>
//                 <tr>
//                   <th>Rank</th>
//                   <th>Name</th>
//                   <th>Score</th>
//                   <th>Questions Answered</th>
//                   <th>Percentage</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {leaderboard.map((entry, index) => (
//                   <tr key={entry.studentId + index}>
//                     <td>{index + 1}</td>
//                     <td>{entry.studentName}</td>
//                     <td>
//                       {entry.score} / {entry.totalQuestions}
//                     </td>
//                     <td>
//                       {entry.questionsAnswered} / {entry.totalQuestions}
//                     </td>
//                     <td>{entry.percentage}%</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           ) : (
//             <p>No students have joined the quiz yet.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default GenerateQuizPage;

import React, { useState, useEffect } from "react";
import { BlobServiceClient } from "@azure/storage-blob";
import axios from "axios";
import { db, ref, set, push, remove, onValue, update } from "../services/firebase";
import "../assets/styles/ExtractContent.css";

const GenerateQuizPage = () => {
  const [pdfList, setPdfList] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [extractedContent, setExtractedContent] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizCount, setQuizCount] = useState(10);
  const [quizDuration, setQuizDuration] = useState(300);
  const [countdownDuration, setCountdownDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quizKey, setQuizKey] = useState(null);
  const [showQuestions, setShowQuestions] = useState(true);

  // Load existing quiz state from Firebase on mount
  useEffect(() => {
    const quizzesRef = ref(db, "quizzes");
    const unsubscribe = onValue(
      quizzesRef,
      (snapshot) => {
        const quizzesData = snapshot.val();
        if (quizzesData) {
          const latestQuizKey = Object.keys(quizzesData)[Object.keys(quizzesData).length - 1];
          const quizData = quizzesData[latestQuizKey];
          if (quizData) {
            setQuizKey(latestQuizKey);
            setQuizActive(quizData.active || false);
            setCountdownActive(quizData.countdownActive || false);
            setShowQuestions(!quizData.active && !quizData.countdownActive);
            setQuizQuestions(
              quizData.questions
                ? Object.values(quizData.questions).map((q) => ({
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                  }))
                : []
            );
            setSelectedPdf(quizData.pdfSource || "");
            setQuizDuration(quizData.duration || 300);
            setCountdownDuration(quizData.countdownDuration || 60);
            setExtractedContent(quizData.extractedContent || "");

            // Handle countdown timer
            if (quizData.countdownActive && quizData.countdownStartTime) {
              const startTime = new Date(quizData.countdownStartTime).getTime();
              const currentTime = Date.now();
              const elapsedTime = Math.floor((currentTime - startTime) / 1000);
              const remainingCountdown = Math.max(0, quizData.countdownDuration - elapsedTime);
              setCountdownTimeLeft(remainingCountdown);
            } else {
              setCountdownTimeLeft(0);
            }

            // Handle quiz timer
            if (quizData.active && quizData.startTime) {
              const startTime = new Date(quizData.startTime).getTime();
              const currentTime = Date.now();
              const elapsedTime = Math.floor((currentTime - startTime) / 1000);
              const remainingTime = Math.max(0, quizData.duration - elapsedTime);
              setTimeLeft(remainingTime);
            } else {
              setTimeLeft(0);
            }
          } else {
            resetState();
          }
        } else {
          resetState();
        }
      },
      (error) => {
        console.error("Error fetching quiz data:", error);
        setError("Failed to load quiz state.");
      }
    );

    const resetState = () => {
      setQuizKey(null);
      setQuizActive(false);
      setCountdownActive(false);
      setShowQuestions(true);
      setQuizQuestions([]);
      setSelectedPdf("");
      setExtractedContent("");
      setTimeLeft(0);
      setCountdownTimeLeft(0);
      setLeaderboard([]);
    };

    return () => unsubscribe();
  }, []);

  // Warn admin before leaving page and reset quiz if generated but not started
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (quizKey && (!countdownActive && !quizActive)) {
        // Quiz generated but not started; clean up
        handleCloseQuiz(quizKey);
      } else if (countdownActive && countdownTimeLeft > 0) {
        // Countdown is active; prevent leaving and clean up
        event.preventDefault();
        event.returnValue = "Leaving the page will cancel the quiz. Are you sure?";
        if (quizKey) {
          const quizRef = ref(db, `quizzes/${quizKey}`).toString();
          const updateData = {
            active: false,
            countdownActive: false,
            startTime: null,
            countdownStartTime: null,
          };
          navigator.sendBeacon(
            quizRef,
            JSON.stringify(updateData)
          );
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [countdownActive, countdownTimeLeft, quizKey, quizActive]);

  // Trigger quiz start when countdown ends
  useEffect(() => {
    if (countdownActive && countdownTimeLeft <= 0 && !quizActive && quizKey) {
      handleStartQuiz(quizKey);
    }
  }, [countdownActive, countdownTimeLeft, quizActive, quizKey]);

  // Fetch PDF files from Azure Blob Storage
  useEffect(() => {
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
      } catch (error) {
        setError("Error fetching PDFs from Azure Blob Storage.");
        console.error("Error fetching PDFs:", error.message);
      }
    };

    fetchUploadedPDFs();
  }, []);

  // Fetch live leaderboard data for the current quiz
  useEffect(() => {
    if (!quizKey) return;

    const quizAttemptsRef = ref(db, `quizAttempts/${quizKey}`);
    const unsubscribe = onValue(
      quizAttemptsRef,
      (snapshot) => {
        const attemptsData = snapshot.val();
        if (attemptsData) {
          const leaderboardArray = Object.entries(attemptsData).map(([userId, data]) => ({
            studentId: userId,
            studentName: data.studentName || "Unknown Student",
            score: data.score || 0,
            totalQuestions: data.totalQuestions || quizQuestions.length || 0,
            questionsAnswered: data.questionsAnswered || 0,
            percentage: data.totalQuestions ? ((data.score / data.totalQuestions) * 100).toFixed(2) : 0,
          }));
          leaderboardArray.sort((a, b) => b.percentage - a.percentage || b.questionsAnswered - a.questionsAnswered);
          setLeaderboard(leaderboardArray);
        } else {
          setLeaderboard([]);
        }
      },
      (error) => {
        console.error("Error fetching live leaderboard:", error.message);
        setError("Failed to load live leaderboard.");
      }
    );

    return () => unsubscribe();
  }, [quizKey, quizQuestions.length]);

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (countdownActive && countdownTimeLeft > 0) {
      timer = setInterval(() => {
        setCountdownTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdownActive, countdownTimeLeft]);

  // Handle quiz timer
  useEffect(() => {
    let timer;
    if (quizActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizActive, timeLeft]);

  // Handle PDF selection
  const handleSelectPdf = (event) => {
    setSelectedPdf(event.target.value);
  };

  // Handle quiz count change
  const handleQuizCountChange = (event) => {
    setQuizCount(event.target.value);
  };

  // Handle quiz duration change
  const handleQuizDurationChange = (event) => {
    setQuizDuration(event.target.value);
  };

  // Handle countdown duration change
  const handleCountdownDurationChange = (event) => {
    setCountdownDuration(event.target.value);
  };

  // Poll for Document Intelligence API result
  const pollForResult = async (operationUrl) => {
    let result = null;
    while (!result || result.status !== "succeeded") {
      const response = await axios.get(operationUrl, {
        headers: {
          "Ocp-Apim-Subscription-Key": "DcglSYtpSK1w7YNXkGb4ND2ccmU2zbWbhSOt1qdgCchCsBablVxSJQQJ99BFACYeBjFXJ3w3AAALACOGr51d",
        },
      });
      result = response.data;
      if (result.status === "failed") {
        throw new Error("Document Intelligence failed: " + (result.error?.message || "Unknown error"));
      }
      if (result.status === "running") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return result;
  };

  // Extract content from PDF and generate quiz
  const handleExtractContent = async () => {
    if (!selectedPdf) {
      alert("Please select a PDF to extract content.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuizQuestions([]);
    setShowQuestions(true);

    try {
      // Delete existing quizzes and attempts
      const quizzesRef = ref(db, "quizzes");
      const quizAttemptsRef = ref(db, "quizAttempts");
      await remove(quizzesRef);
      await remove(quizAttemptsRef);

      // Extract content from PDF
      const pdfUrl = `https://pdfcollection.blob.core.windows.net/lessons/${selectedPdf}`;
      const response = await axios.post(
        "https://dpftextextract.cognitiveservices.azure.com/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=2024-11-30",
        { urlSource: pdfUrl },
        {
          headers: {
            "Ocp-Apim-Subscription-Key": "DcglSYtpSK1w7YNXkGb4ND2ccmU2zbWbhSOt1qdgCchCsBablVxSJQQJ99BFACYeBjFXJ3w3AAALACOGr51d",
            "Content-Type": "application/json",
          },
        }
      );

      const operationUrl = response.headers["operation-location"];
      if (!operationUrl) {
        throw new Error("No operation location found.");
      }

      const result = await pollForResult(operationUrl);
      const extractedText = result.analyzeResult?.content || "No content extracted.";
      setExtractedContent(extractedText);

      // Generate quiz questions
      const quizResponse = await axios.post(
        "https://19ict-mbyp7rea-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview",
        {
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant. Generate ${quizCount} quiz questions based on the provided content. Each question should have 4 options with one correct answer. Return the response as a raw JSON array of objects with 'question', 'options', and 'correct_answer' fields. Do not include Markdown formatting or backticks. Example: [{"question":"What is 1+1?","options":["1","2","3","4"],"correct_answer":"2"}]`,
            },
            {
              role: "user",
              content: extractedText,
            },
          ],
        },
        {
          headers: {
            "Authorization": "Bearer A5wPczJtl2GFyXGmNrHPsjPVedBfwTeXjRiimAMuiPv06TZhmz12JQQJ99BFACHYHv6XJ3w3AAAAACOGmcXu",
            "Content-Type": "application/json",
          },
        }
      );

      const quizData = quizResponse.data.choices[0].message.content;
      console.log("Raw quiz data from API:", quizData);

      // Clean the response to remove Markdown
      let cleanedQuizData = quizData
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .trim();

      let parsedQuizData;
      try {
        parsedQuizData = JSON.parse(cleanedQuizData);
      } catch (e) {
        console.error("Raw quiz data parsing failed:", cleanedQuizData);
        throw new Error("Failed to parse quiz data: " + e.message);
      }

      if (!Array.isArray(parsedQuizData)) {
        throw new Error("Quiz data is not an array of questions.");
      }

      setQuizQuestions(parsedQuizData);

      // Save quiz to Firebase
      const newQuizRef = push(quizzesRef);
      const newQuizKey = newQuizRef.key;
      setQuizKey(newQuizKey);
      const quizDataRef = ref(db, `quizzes/${newQuizKey}`);

      await set(quizDataRef, {
        questions: parsedQuizData.map((item) => ({
          question: item.question,
          options: item.options,
          correct_answer: item.correct_answer,
        })),
        createdAt: new Date().toISOString(),
        pdfSource: selectedPdf,
        duration: parseInt(quizDuration),
        countdownDuration: parseInt(countdownDuration),
        active: false,
        countdownActive: false,
        startTime: null,
        countdownStartTime: null,
        extractedContent: extractedText,
      });

      setIsLoading(false);
    } catch (error) {
      setError(`Failed to extract content: ${error.message}`);
      setIsLoading(false);
      console.error("Error extracting content:", error);
    }
  };

  // Start the countdown
  const handleStartCountdown = async () => {
    try {
      if (!quizQuestions.length) {
        throw new Error("No quiz questions generated. Please extract content first.");
      }
      if (quizKey) {
        const quizRef = ref(db, `quizzes/${quizKey}`);
        await update(quizRef, {
          countdownActive: true,
          countdownStartTime: new Date().toISOString(),
          countdownDuration: parseInt(countdownDuration),
        });
        setCountdownActive(true);
        setCountdownTimeLeft(parseInt(countdownDuration));
      }
    } catch (error) {
      setError(error.message || "Failed to start countdown.");
      console.error("Error starting countdown:", error);
    }
  };

  // Start the quiz
  const handleStartQuiz = async (key = quizKey) => {
    try {
      if (!quizQuestions.length) {
        throw new Error("No quiz questions generated.");
      }
      if (key && !quizActive) {
        const quizRef = ref(db, `quizzes/${key}`);
        await update(quizRef, {
          active: true,
          startTime: new Date().toISOString(),
          countdownActive: false,
          countdownStartTime: null,
        });
        setQuizActive(true);
        setCountdownActive(false);
        setTimeLeft(quizDuration);
        setCountdownTimeLeft(0);
        setShowQuestions(false);
      }
    } catch (error) {
      setError(error.message || "Failed to start quiz.");
      console.error("Error starting quiz:", error);
    }
  };

  // Close the quiz
  const handleCloseQuiz = async (key = quizKey) => {
    try {
      if (key) {
        const quizRef = ref(db, `quizzes/${key}`);
        await update(quizRef, {
          active: false,
          countdownActive: false,
          startTime: null,
          countdownStartTime: null,
        });
        setQuizActive(false);
        setCountdownActive(false);
        setTimeLeft(0);
        setCountdownTimeLeft(0);
        setQuizKey(null);
        setQuizQuestions([]);
        setLeaderboard([]);
        setExtractedContent("");
        setSelectedPdf("");
        setShowQuestions(true);
      }
    } catch (error) {
      setError(error.message || "Failed to close quiz.");
      console.error("Error closing quiz:", error);
    }
  };

  return (
    <div className="generate-quiz-page">
      <h1>Generate Quiz from PDF</h1>

      {error && <div className="error">{error}</div>}

      {/* PDF Selection */}
      <div className="pdf-selection">
        <h2>Select PDF Lesson:</h2>
        <select value={selectedPdf} onChange={handleSelectPdf} disabled={quizActive || countdownActive}>
          <option value="">Select a PDF</option>
          {pdfList.length > 0 ? (
            pdfList.map((pdf, index) => (
              <option key={index} value={pdf}>
                {pdf}
              </option>
            ))
          ) : (
            <option value="">No PDFs available</option>
          )}
        </select>
      </div>

      {/* Quiz Count Input */}
      <div className="quiz-count">
        <h2>Number of Quiz Questions:</h2>
        <input
          type="number"
          value={quizCount}
          onChange={handleQuizCountChange}
          min="1"
          max="20"
          className="quiz-count-input"
          disabled={quizActive || countdownActive}
        />
      </div>

      {/* Quiz Duration Input */}
      <div className="quiz-duration">
        <h2>Quiz Duration (seconds):</h2>
        <input
          type="number"
          value={quizDuration}
          onChange={handleQuizDurationChange}
          min="60"
          max="3600"
          className="quiz-duration-input"
          disabled={quizActive || countdownActive}
        />
      </div>

      {/* Countdown Duration Input */}
      <div className="quiz-duration">
        <h2>Countdown Duration (seconds):</h2>
        <input
          type="number"
          value={countdownDuration}
          onChange={handleCountdownDurationChange}
          min="10"
          max="300"
          className="quiz-duration-input"
          disabled={quizActive || countdownActive}
        />
      </div>

      {/* Extracted Content Display */}
      {/* {extractedContent && !quizActive && !countdownActive && (
        <div className="extracted-content">
          <h2>Extracted Content:</h2>
          <p>
            {extractedContent.substring(0, 500)}... {extractedContent.length > 500 ? "(Truncated)" : ""}
          </p>
        </div>
      )} */}

      {/* Extract Content Button */}
      <button onClick={handleExtractContent} disabled={isLoading || quizActive || countdownActive}>
        {isLoading ? "Extracting..." : "Extract Content"}
      </button>

      {/* Start Countdown Button */}
      <button
        onClick={handleStartCountdown}
        disabled={isLoading || quizActive || countdownActive || !quizQuestions.length}
      >
        {countdownActive ? "Countdown Running" : "Start Countdown"}
      </button>

      {/* Start Quiz Button (for manual start if needed) */}
      <button
        onClick={() => handleStartQuiz(quizKey)}
        disabled={isLoading || quizActive || countdownActive || !quizQuestions.length}
      >
        {quizActive ? "Quiz Running" : "Start Quiz Immediately"}
      </button>

      {/* Close Quiz Button */}
      {quizActive && (
        <button onClick={() => handleCloseQuiz(quizKey)} className="close-quiz-btn">
          Close Quiz
        </button>
      )}

      {/* Countdown Timer */}
      {countdownActive && countdownTimeLeft > 0 && (
        <div className="timer">
          <h2>
            <strong>
            Countdown: {Math.floor(countdownTimeLeft / 60)}:
            {countdownTimeLeft % 60 < 10 ? `0${countdownTimeLeft % 60}` : countdownTimeLeft % 60}</strong><br />
            <small>Dont Leave this Page until Countdown Ends</small>
          </h2>
        </div>
      )}

      {/* Quiz Timer */}
      {quizActive && timeLeft > 0 && (
        <div className="timer">
          <h2>
            Time Remaining: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
          </h2>
        </div>
      )}

      {/* Display Quiz Questions (only before countdown/quiz starts) */}
      {quizQuestions.length > 0 && showQuestions && !quizActive && !countdownActive && (
        <div className="quiz-questions">
          <h2>Quiz Questions:</h2>
          {quizQuestions.map((item, index) => (
            <div key={index} className="quiz-card">
              <p>
                <strong>Question:</strong> {item.question}
              </p>
              <p>
                <strong>Options:</strong> {item.options?.join(", ")}
              </p>
              <p>
                <strong>Correct Answer:</strong> {item.correct_answer}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Display Live Leaderboard */}
      {quizKey && (
        <div className="leaderboard">
          <h2>Live Leaderboard (Current Quiz)</h2>
          {leaderboard.length > 0 ? (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Questions Answered</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry.studentId + index}>
                    <td>{index + 1}</td>
                    <td>{entry.studentName}</td>
                    <td>
                      {entry.score} / {entry.totalQuestions}
                    </td>
                    <td>
                      {entry.questionsAnswered} / {entry.totalQuestions}
                    </td>
                    <td>{entry.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No students have joined the quiz yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerateQuizPage;


