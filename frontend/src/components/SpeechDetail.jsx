// src/components/SpeechDetail.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import { VITE_CLOUD_FUNCTION_URL } from '../utils/env';


const SpeechDetail = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [speech, setSpeech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState(null); // {start, end, text}
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiToReplace, setEmojiToReplace] = useState(null);

  // For test environments only: allow direct selection state setting
  useEffect(() => {
    if (process.env.NODE_ENV === 'test' && typeof window !== 'undefined') {
      window._setSpeechSelection = (sel) => setSelection(sel);
      return () => { delete window._setSpeechSelection; };
    }
  }, []);

  const cloudFunctionBaseUrl = VITE_CLOUD_FUNCTION_URL;

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
      const url = `${cloudFunctionBaseUrl}/getSpeech/${speechId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSpeech(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        setError(errorData.message || `Failed to fetch speech: ${response.statusText}`);
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching speech.');
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

  const handleMouseUp = () => {
    const contentEl = document.getElementById('speech-content');
    const selectionObj = window.getSelection();
    if (!contentEl || !selectionObj || selectionObj.isCollapsed) {
      setSelection(null);
      return;
    }
    if (!selectionObj.anchorNode || !contentEl.contains(selectionObj.anchorNode)) {
      setSelection(null);
      return;
    }
    const selectedText = selectionObj.toString();
    if (!selectedText.trim()) {
      setSelection(null);
      return;
    }
    const content = speech.content;
    const start = content.indexOf(selectedText);
    if (start === -1) {
      setSelection(null);
      return;
    }
    const end = start + selectedText.length;
    setSelection({ start, end, text: selectedText });
  };

  const emojiList = ['😀', '😂', '😍', '👍', '🎉', '😢', '😮', '😡', '🙏', '🔥'];

  const handleEmojiPick = (emoji) => {
    setEmojiToReplace(emoji);
    setShowEmojiPicker(false);
    setSelection(null);
  };

  return (
    <div className="container">
      <h2>Speech: {speech.name}</h2>
      <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      <div
        id="speech-content"
        style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px', whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', borderRadius: '8px', position: 'relative' }}
        onMouseUp={handleMouseUp}
      >
        <p data-testid="speech-content">{speech.content}</p>
        {selection && (
          <button
            style={{ position: 'absolute', top: 5, right: 5, zIndex: 2, background: '#ffd700', borderRadius: '6px', padding: '6px 12px', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowEmojiPicker(true)}
          >
            Replace with Emoji
          </button>
        )}
      </div>
      {showEmojiPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <h4>Pick an Emoji</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
              {emojiList.map((emoji) => (
                <button key={emoji} style={{ fontSize: '2rem', padding: '8px', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleEmojiPick(emoji)}>{emoji}</button>
              ))}
            </div>
            <button style={{ marginTop: '18px' }} onClick={() => setShowEmojiPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
      <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
        Uploaded on: {speech.createdAt ? new Date(speech.createdAt).toLocaleString() : 'N/A'}
      </p>
      <button onClick={handleDelete} style={{ backgroundColor: '#d9534f', marginTop: '10px' }}>Delete Speech</button>
    </div>
  );
};

export default SpeechDetail;