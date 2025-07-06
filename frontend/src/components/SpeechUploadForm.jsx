// src/components/SpeechUploadForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // To get currentUser

const SpeechUploadForm = ({ onUploadSuccess }) => {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState(''); // For success/error messages
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // --- Client-side validation ---
      // 1. Check file type
      if (file.type !== 'text/plain') {
        setMessage('Invalid file type. Please upload a .txt file.');
        setSelectedFile(null);
        setFileName('');
        return;
      }
      // 2. Check for empty file
      if (file.size === 0) {
        setMessage('Cannot upload an empty file. Please provide content.');
        setSelectedFile(null);
        setFileName('');
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
      setMessage(''); // Clear previous messages
    } else {
      setSelectedFile(null);
      setFileName('');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      return;
    }
    if (!currentUser) {
      setMessage('You must be logged in to upload a speech.');
      return;
    }

    setIsLoading(true);
  setMessage('');

  const reader = new FileReader();

  reader.onload = async (e) => {
    const fileContent = e.target.result;
    const speechName = fileName.replace(/\.txt$/, ''); // Derive name from filename

    // --- Send to backend (REAL IMPLEMENTATION) ---
    try {
      // Get the user's ID token for authentication
      const idToken = await currentUser.getIdToken();

      // Replace with your actual Cloud Function URL base.
      // When deployed: It will be something like https://REGION-YOUR_PROJECT_ID.cloudfunctions.net/api
      // When using local emulators: http://localhost:5001/YOUR_PROJECT_ID/REGION/api
      // You need to set this based on whether you are running emulators or deployed.
      // For local testing, use the emulator URL.
      // For deployed, use the actual Cloud Function URL.

      // Using Vite's env vars to switch between local emulator and deployed URL
      // You might need to add VITE_CLOUD_FUNCTION_URL to your frontend/.env
      // and set it to your emulator URL for local testing.
      // Example: VITE_CLOUD_FUNCTION_URL="http://localhost:5001/trippingly-on-the-tongue/us-central1/api"
      // Replace YOUR_PROJECT_ID and REGION as appropriate.
      const cloudFunctionBaseUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL || 'http://localhost:5001/YOUR_PROJECT_ID/us-central1/api'; // Fallback for local
      const uploadUrl = `${cloudFunctionBaseUrl}/uploadSpeech`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` // Send the ID token for backend authentication
        },
        body: JSON.stringify({
          speechName: speechName,
          fileContent: fileContent,
        }),
      });

      const data = await response.json(); // Assuming your backend sends JSON response

      if (response.ok) { // Check if the response status is 2xx
        setMessage(data.message || `"${speechName}" uploaded successfully!`);
        setSelectedFile(null);
        setFileName('');
        if (onUploadSuccess) { // Call the success callback
          onUploadSuccess();
        }
      } else {
        // Handle errors from the backend (e.g., 400, 401, 500)
        setMessage(data.message || `Failed to upload speech: ${response.statusText}`);
        console.error('Backend error:', data);
      }
    } catch (error) {
      setMessage('An unexpected error occurred during upload. Check console.');
      console.error('Frontend upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  reader.onerror = () => {
    setMessage('Error reading file.');
    setIsLoading(false);
  };

  reader.readAsText(selectedFile);
};

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h3>Upload a New Speech</h3>
      <input
        type="file"
        accept=".txt" // Suggests only .txt files in file picker
        onChange={handleFileChange}
      />
      {fileName && <p>Selected file: {fileName}</p>}
      <button onClick={handleUpload} disabled={isLoading || !selectedFile}>
        {isLoading ? 'Uploading...' : 'Upload Speech'}
      </button>
      {message && <p style={{ color: message.includes('successfully') ? 'green' : 'red' }}>{message}</p>}
      {!currentUser && <p style={{ color: 'orange' }}>Please log in to upload speeches.</p>}
    </div>
  );
};

export default SpeechUploadForm;