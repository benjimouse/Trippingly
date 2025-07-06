// src/components/SpeechList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const SpeechList = ({ onSpeechUploaded }) => {
  const { currentUser } = useAuth();
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Base URL for your Cloud Functions
  const cloudFunctionBaseUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;

  const fetchSpeeches = useCallback(async () => {
    if (!currentUser || !cloudFunctionBaseUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${cloudFunctionBaseUrl}/getSpeeches`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSpeeches(data.speeches);
      } else {
        setError(data.message || 'Failed to fetch speeches.');
        console.error('Error fetching speeches:', data);
      }
    } catch (err) {
      setError('An error occurred while fetching speeches.');
      console.error('Fetch speeches error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, cloudFunctionBaseUrl]);

  useEffect(() => {
    fetchSpeeches();
  }, [fetchSpeeches, onSpeechUploaded]); // Re-fetch when onSpeechUploaded changes (triggered by SpeechUploadForm)

  if (loading) {
    return <p>Loading your speeches...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!currentUser) {
    return <p>Please log in to see your speeches.</p>;
  }

  if (speeches.length === 0) {
    return <p>You haven't uploaded any speeches yet. Upload one above!</p>;
  }

  return (
    <div>
      {speeches.map(speech => (
        <div key={speech.id} style={{ border: '1px solid #eee', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
          <h4>{speech.name}</h4>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            Uploaded: {speech.createdAt ? new Date(speech.createdAt).toLocaleString() : 'N/A'}
          </p>
          {/* For now, display truncated content; later, this could be a "View" button */}
          <p>{speech.content.substring(0, 150)}{speech.content.length > 150 ? '...' : ''}</p>
        </div>
      ))}
    </div>
  );
};

export default SpeechList;