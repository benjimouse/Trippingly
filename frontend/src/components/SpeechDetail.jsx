// src/components/SpeechDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const SpeechDetail = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [speech, setSpeech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cloudFunctionBaseUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;

  const fetchSpeech = useCallback(async () => {
    if (!currentUser || !cloudFunctionBaseUrl || !speechId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setSpeech(null);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${cloudFunctionBaseUrl}/getSpeech/${speechId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSpeech(data);
      } else {
        setError(data.message || `Failed to fetch speech: ${response.statusText}`);
        console.error('Error fetching speech:', data);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching speech.');
      console.error('Fetch speech error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId]);

  useEffect(() => {
    fetchSpeech();
  }, [fetchSpeech]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this speech?')) {
      try {
        const idToken = await currentUser.getIdToken();
        const response = await fetch(`${cloudFunctionBaseUrl}/deleteSpeech/${speechId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        if (response.ok) {
          navigate('/dashboard');
        } else {
          const data = await response.json();
          setError(data.message || 'Failed to delete speech.');
        }
      } catch (err) {
        setError('An unexpected error occurred while deleting the speech.');
        console.error('Delete speech error:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h2>Speech Detail</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <p>Loading speech details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h2>Speech Detail</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  if (!speech) {
    return (
      <div className="container">
        <h2>Speech Detail</h2>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        <p>Speech not found or no data available.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Speech: {speech.name}</h2>
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <p>{speech.content}</p>
      </div>
      <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
        Uploaded on: {speech.createdAt ? new Date(speech.createdAt).toLocaleString() : 'N/A'}
      </p>
      <button onClick={handleDelete} style={{ backgroundColor: '#d9534f', marginTop: '10px' }}>Delete Speech</button>
    </div>
  );
};

export default SpeechDetail;