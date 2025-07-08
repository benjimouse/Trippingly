// src/components/SpeechDetail.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Add useEffect, useCallback
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user and token

const SpeechDetail = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get the current authenticated user

  const [speech, setSpeech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Base URL for your Cloud Functions (from .env)
  const cloudFunctionBaseUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;

  const fetchSpeech = useCallback(async () => {
    if (!currentUser || !cloudFunctionBaseUrl || !speechId) {
      // Don't fetch if no user, no URL, or no speechId
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setSpeech(null); // Clear previous speech data

    try {
      const idToken = await currentUser.getIdToken(); // Get the user's ID token for authentication
      const response = await fetch(`${cloudFunctionBaseUrl}/getSpeech/${speechId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json' // Although GET, good practice
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSpeech(data); // Assuming the backend returns the speech object directly
      } else {
        // Handle specific error messages from the backend (e.g., 404 Not Found, 403 Forbidden)
        setError(data.message || `Failed to fetch speech: ${response.statusText}`);
        console.error('Error fetching speech:', data);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching speech.');
      console.error('Fetch speech error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId]); // Dependencies for useCallback

  // Trigger fetchSpeech whenever currentUser, cloudFunctionBaseUrl, or speechId changes
  useEffect(() => {
    fetchSpeech();
  }, [fetchSpeech]);

  // --- Render Logic ---
  if (loading) {
    return (
      <div>
        <h2>Speech Detail</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <p>Loading speech details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2>Speech Detail</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  if (!speech) {
    return (
      <div>
        <h2>Speech Detail</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <p>Speech not found or no data available.</p>
      </div>
    );
  }

  // If speech data is available, display it
  return (
    <div>
      <h2>Speech: {speech.name}</h2>
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <p>{speech.content}</p>
      </div>
      <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
        Uploaded on: {speech.createdAt ? new Date(speech.createdAt).toLocaleString() : 'N/A'}
      </p>
      {/* Future: Add playback, analysis, editing buttons here */}
    </div>
  );
};

export default SpeechDetail;