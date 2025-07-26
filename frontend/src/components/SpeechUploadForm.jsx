// src/components/SpeechUploadForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const SpeechUploadForm = ({ onUploadSuccess }) => {
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'text/plain') {
        setMessage('Invalid file type. Please upload a .txt file.');
        setSelectedFile(null);
        setFileName('');
        return;
      }
      if (file.size === 0) {
        setMessage('Cannot upload an empty file. Please provide content.');
        setSelectedFile(null);
        setFileName('');
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
      setMessage('');
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
      const speechName = fileName.replace(/\.txt$/, '');

      try {
        const idToken = await currentUser.getIdToken();
        const cloudFunctionBaseUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
        const uploadUrl = `${cloudFunctionBaseUrl}/uploadSpeech`;

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            speechName: speechName,
            fileContent: fileContent,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message || `"${speechName}" uploaded successfully!`);
          setSelectedFile(null);
          setFileName('');
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } else {
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
    <div className="card">
      <h3>Upload a New Speech</h3>
      <input
        type="file"
        accept=".txt"
        onChange={handleFileChange}
      />
      {fileName && <p>Selected file: {fileName}</p>}
      <button onClick={handleUpload} disabled={isLoading || !selectedFile}>
        {isLoading ? 'Uploading...' : 'Upload Speech'}
      </button>
      {message && <p className={message.includes('successfully') ? 'success' : 'error'}>{message}</p>}
      {!currentUser && <p className="error">Please log in to upload speeches.</p>}
    </div>
  );
};

export default SpeechUploadForm;