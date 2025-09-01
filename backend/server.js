const express = require("express");
const axios = require("axios");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const app = express();
const port = 5000;

const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const formRecognizerApiKey = process.env.FORM_RECOGNIZER_API_KEY;
const formRecognizerEndpoint = process.env.FORM_RECOGNIZER_ENDPOINT;

const containerName = "lessons"; // The container name where PDFs are stored

const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);

app.get("/api/pdfs", async (req, res) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const pdfFiles = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.endsWith(".pdf")) {
        pdfFiles.push(blob.name); // Push only PDF files
      }
    }

    res.json(pdfFiles); // Return the list of PDF files
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    res.status(500).send("Error fetching PDF files");
  }
});

app.post("/api/extract-pdf", async (req, res) => {
  const { pdfUrl } = req.body; // URL of the PDF to extract content from

  try {
    // Call Azure Form Recognizer API to extract content
    const response = await axios.post(
      `${formRecognizerEndpoint}/formrecognizer/v2.1-preview.3/layout/analyze`,
      { urlSource: pdfUrl },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": formRecognizerApiKey,
        },
      }
    );

    const resultUrl = response.data.operationLocation;
    const operationId = resultUrl.split("/").pop();

    // Fetch the results of the analysis
    const resultResponse = await axios.get(
      `${formRecognizerEndpoint}/formrecognizer/v2.1-preview.3/layout/analyzeResults/${operationId}`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": formRecognizerApiKey,
        },
      }
    );

    res.json(resultResponse.data); // Return extracted content to the frontend
  } catch (error) {
    console.error("Error extracting PDF content:", error);
    res.status(500).send("Error extracting PDF content");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
