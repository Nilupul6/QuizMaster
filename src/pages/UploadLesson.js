// UploadLesson.jsx
import React, { useState, useEffect } from 'react';
import { BlobServiceClient } from '@azure/storage-blob';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../assets/styles/UploadLesson.css';

const UploadLesson = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [filePath, setFilePath] = useState('');
  const [pdfList, setPdfList] = useState([]);
  const navigate = useNavigate();

  const getContainerClient = () => {
    return new BlobServiceClient(
      `https://pdfcollection.blob.core.windows.net/?sv=2024-11-04&ss=bf&srt=sco&sp=rwdlacitfx&se=2025-09-09T17:02:06Z&st=2025-06-09T09:02:06Z&spr=https&sig=7jvJqs69uPjZ2T79iTOw0zCdloZgngLupObAVsEjUJs%3D`
    ).getContainerClient('lessons');
  };

  useEffect(() => {
    const fetchUploadedPDFs = async () => {
      const client = getContainerClient();
      const pdfs = [];
      for await (const blob of client.listBlobsFlat()) {
        pdfs.push({ name: blob.name, uploadedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) });
      }
      setPdfList(pdfs);
    };

    fetchUploadedPDFs();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFilePath(selectedFile ? selectedFile.name : '');
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }

    const client = getContainerClient();
    const blobClient = client.getBlockBlobClient(file.name);

    try {
      await blobClient.uploadData(file);
      setMessage('File uploaded successfully!');
      const newPdfList = [...pdfList, { name: file.name, uploadedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) }];
      setPdfList(newPdfList);
      setFile(null);
      setFilePath('');
    } catch (error) {
      setMessage('Error uploading file: ' + error.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setFilePath(droppedFile ? droppedFile.name : '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDelete = async (pdfName) => {
    try {
      const client = getContainerClient();
      const blobClient = client.getBlockBlobClient(pdfName);
      await blobClient.delete();
      setPdfList(pdfList.filter(pdf => pdf.name !== pdfName));
      setMessage(`Successfully deleted ${pdfName}`);
    } catch (error) {
      setMessage('Error deleting file: ' + error.message);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/admin-dashboard');
  };

  return (
    <div className="upload-lesson-container">
      <motion.div
        className="header-section"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="header-title">Lesson Upload Portal</h1>
        <p className="header-date">
          Today: {new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
          })}
        </p>
      </motion.div>

      <div className="content-wrapper">
        <motion.div
          className="upload-card"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="upload-title">Upload New Lesson</h2>
          <p className="upload-subtitle">Drag & drop or browse to add your PDF</p>

          <motion.div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('file-input').click()}
            whileHover={{ scale: 1.05, boxShadow: "0 12px 25px rgba(0, 0, 0, 0.2)" }}
            initial={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="drop-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <p className="drop-text">Drop your PDF here or click to browse</p>
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              accept=".pdf"
              className="file-input"
            />
            {filePath && (
              <motion.p
                className="file-name"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                Selected: <strong>{filePath}</strong>
              </motion.p>
            )}
          </motion.div>

          <motion.button
            className="upload-button"
            onClick={handleUpload}
            whileHover={{ scale: 1.1, backgroundColor: "#45a049" }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            Upload
          </motion.button>

          {message && (
            <motion.p
              className={`status-message ${message.includes('success') ? 'success' : 'error'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {message}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="pdf-card"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <h2 className="pdf-title">Uploaded Lessons</h2>
          <AnimatePresence>
            {pdfList.length > 0 ? (
              <motion.div
                className="pdf-table-wrapper"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
              >
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Lesson Name</th>
                      <th>Uploaded At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfList.map((pdf, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                      >
                        <td className="pdf-name">{pdf.name}</td>
                        <td className="pdf-date">{pdf.uploadedAt}</td>
                        <td>
                          <motion.button
                            className="delete-button"
                            onClick={() => handleDelete(pdf.name)}
                            whileHover={{ scale: 1.1, backgroundColor: "#e53935" }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                          >
                            Delete
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ) : (
              <motion.p
                className="no-pdfs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                No lessons uploaded yet.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

     
    </div>
  );
};

export default UploadLesson;
