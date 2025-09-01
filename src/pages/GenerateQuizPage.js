import React, { useState, useEffect } from "react";
import { BlobServiceClient } from "@azure/storage-blob";
import axios from "axios";
import { db, ref, set } from "../services/firebase"; // Use 'db' instead of 'database'
import "../assets/styles/GenerateQuizPage.css"; // Import the CSS for styling

const GenerateQuizPage = () => {
  const [pdfList, setPdfList] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [numOfQuizzes, setNumOfQuizzes] = useState(1);
  const [generatedQuizzes, setGeneratedQuizzes] = useState([]); // State for storing quizzes

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
        console.error("Error fetching PDFs:", error.message);
      }
    };

    fetchUploadedPDFs();
  }, []);

  const handleGenerate = async () => {
    if (!selectedPdf || numOfQuizzes <= 0) {
      alert("Please select a PDF and specify the number of quizzes.");
      return;
    }

    try {
      // Send request to API for generating quizzes
      const response = await axios.post("/api/generate-quiz", {
        pdfName: selectedPdf,
        numOfQuizzes,
      });

      const quizzes = response.data.quizzes; // Assuming quizzes are returned in this format

      // Save quizzes to Firebase Realtime Database
      quizzes.forEach((quiz, index) => {
        const quizRef = ref(db, `quizzes/quiz_${Date.now()}_${index + 1}`);
        set(quizRef, {
          title: quiz.title,
          questions: quiz.questions,
          pdfName: selectedPdf,
          timestamp: Date.now(),
        });
      });

      // Update the state to display the generated quizzes
      setGeneratedQuizzes(quizzes);

      alert(`Successfully generated ${numOfQuizzes} quizzes and saved them.`);
    } catch (error) {
      console.error("Error generating quizzes:", error.message);
      alert("Error generating quizzes.");
    }
  };

  return (
    <div className="generate-quiz-container">
      <h2 className="page-title">Generate Quizzes</h2>
      <div className="form-container">
        <div className="input-group">
          <label>Select PDF Lesson:</label>
          <select
            onChange={(e) => setSelectedPdf(e.target.value)}
            value={selectedPdf}
          >
            <option value="">Select a PDF</option>
            {pdfList.map((pdf, index) => (
              <option key={index} value={pdf}>
                {pdf}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Number of Quizzes to Generate:</label>
          <input
            type="number"
            min="1"
            value={numOfQuizzes}
            onChange={(e) => setNumOfQuizzes(Number(e.target.value))}
          />
        </div>

        <button className="generate-btn" onClick={handleGenerate}>
          Generate Quizzes
        </button>
      </div>

      {/* Display Generated Quizzes */}
      {generatedQuizzes.length > 0 && (
        <div className="generated-quizzes">
          <h3>Generated Quizzes</h3>
          {generatedQuizzes.map((quiz, index) => (
            <div key={index} className="quiz-card">
              <h4>{quiz.title}</h4>
              <ul className="questions-list">
                {quiz.questions.map((question, qIndex) => (
                  <li key={qIndex} className="question-item">
                    <strong>{question.question}</strong>
                    <ul>
                      {question.options.map((option, oIndex) => (
                        <li key={oIndex}>{option}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerateQuizPage;
