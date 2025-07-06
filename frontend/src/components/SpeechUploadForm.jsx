// src/components/SpeechUploadForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // To get currentUser

const SpeechUploadForm = () => {
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

      // --- Send to backend (placeholder for now) ---
      try {
        // Placeholder: In a real scenario, you'd send this to your Cloud Function
        console.log('Simulating upload...');
        console.log('Speech Name:', speechName);
        console.log('Speech Content (first 100 chars):', fileContent.substring(0, 100) + '...');

        // For now, let's pretend it was successful after a delay
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        setMessage(`"${speechName}" uploaded successfully! (Simulated)`);
        setSelectedFile(null); // Clear selected file after 'upload'
        setFileName('');
      } catch (error) {
        setMessage('Error during upload simulation. Check console.');
        console.error('Upload simulation error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setMessage('Error reading file.');
      setIsLoading(false);
    };

    reader.readAsText(selectedFile); // Read the file as plain text
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