// src/components/SpeechDetail.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import { VITE_CLOUD_FUNCTION_URL } from '../utils/env';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';

const SpeechDetail = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [speech, setSpeech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selection, setSelection] = useState(null); // {start, end, text}
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cleanSpeech, setCleanSpeech] = useState('');
  const [toast, setToast] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [toggles, setToggles] = useState({});
  const modalRef = useRef(null);
  const prevFocusRef = useRef(null);

  // Generate a stable-ish id for new associations. Prefer crypto.randomUUID when available.
  const genAssocId = () => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch { /* ignore crypto unavailability */ }
    return `assoc-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  };

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
        setCleanSpeech(data.content); // Save original speech text
        // Load any locally persisted associations/toggles for this speech
        try {
          const raw = localStorage.getItem(`speech_assoc:${speechId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            // Ensure each association has an id (migrate older saved data keyed by position)
            const nextAssociations = (parsed.associations || []).map(a => ({
              ...a,
              id: a.id || String(a.position || genAssocId()),
            })).sort((a, b) => a.position - b.position);
            // Normalize toggles: prefer id keys, but fall back to position-based keys from old data
            const rawToggles = parsed.toggles || {};
            const nextToggles = {};
            for (const a of nextAssociations) {
              if (Object.prototype.hasOwnProperty.call(rawToggles, a.id)) nextToggles[a.id] = rawToggles[a.id];
              else if (Object.prototype.hasOwnProperty.call(rawToggles, String(a.position))) nextToggles[a.id] = rawToggles[String(a.position)];
              else nextToggles[a.id] = false;
            }
            setAssociations(nextAssociations);
            setToggles(nextToggles);
          }
        } catch (err) {
          void err; // ignore localStorage parse errors
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        setError(errorData.message || `Failed to fetch speech: ${response.statusText}`);
      }
    } catch (err) {
      void err;
      setError('An unexpected error occurred while fetching speech.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId]);

  useEffect(() => {
    fetchSpeech();
  }, [fetchSpeech]);

  // Auto-dismiss toast (placed here so hooks run in the same order every render)
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Manage focus for emoji picker modal: save/restore focus when it opens/closes
  useEffect(() => {
    if (showEmojiPicker) {
      prevFocusRef.current = document.activeElement;
      setTimeout(() => {
        const modal = modalRef.current;
        if (modal) {
          const first = modal.querySelector('button');
          if (first) first.focus();
        }
      }, 0);
    } else {
      try {
        if (prevFocusRef.current && prevFocusRef.current.focus) prevFocusRef.current.focus();
  } catch (err) { void err; }
    }
  }, [showEmojiPicker]);

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
  } catch (err) { void err; setError('An unexpected error occurred while deleting the speech.'); }
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
  // Compute start relative to the original (clean) speech so positions remain stable
  const content = cleanSpeech;
  const start = content.indexOf(selectedText);
    if (start === -1) {
      setSelection(null);
      return;
    }
    const end = start + selectedText.length;
    setSelection({ start, end, text: selectedText });
  };

  const handleEmojiPick = (emoji) => {
    if (!selection || !speech) return;
  const { start, text } = selection;
    // Replace highlighted text with emoji
    // Create an association with a stable id and position relative to cleanSpeech
    const assoc = { id: genAssocId(), position: start, length: text.length, originalText: text, emoji };
    const nextAssociations = [...associations, assoc].sort((a, b) => a.position - b.position);
    setAssociations(nextAssociations);
    // persist associations + toggles (default show emoji => false for showOriginal)
    const nextToggles = { ...toggles, [assoc.id]: false };
    setToggles(nextToggles);
    try {
      localStorage.setItem(`speech_assoc:${speechId}`, JSON.stringify({ associations: nextAssociations, toggles: nextToggles }));
    } catch (err) { void err; }
    // Rebuild displayed content from cleanSpeech + associations (use id-keyed toggles)
    const build = (clean, assocList, toggleMap) => {
      let out = '';
      let idx = 0;
      for (const a of assocList) {
        if (a.position > idx) out += clean.substring(idx, a.position);
        out += (toggleMap[a.id] ? a.originalText : a.emoji);
        idx = a.position + a.length;
      }
      if (idx < clean.length) out += clean.substring(idx);
      return out;
    };
  const newContent = build(cleanSpeech, nextAssociations, nextToggles);
  setSpeech({ ...speech, content: newContent });
    setShowEmojiPicker(false);
    setSelection(null);
    // Save association to backend
    saveEmojiAssociation({
      speechId,
      assocId: assoc.id,
      originalText: text,
      emoji,
      position: start,
      cleanSpeech,
    });
  };

  

  // Toggle an association's display between emoji and original text (use assoc id)
  const toggleAssociation = (assocId) => {
    const next = { ...toggles, [assocId]: !toggles[assocId] };
    setToggles(next);
  try { localStorage.setItem(`speech_assoc:${speechId}`, JSON.stringify({ associations, toggles: next })); } catch (err) { void err; }
    // Persist toggle state server-side for cross-device sync
    (async () => {
      try {
        const idToken = await currentUser.getIdToken();
        await fetch(`${cloudFunctionBaseUrl}/updateAssociationToggle`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ speechId, assocId, showOriginal: !!next[assocId] }),
        });
  } catch (err) { void err; /* ignore network errors for now */ }
    })();
    // rebuild displayed content
    const build = (clean, assocList, toggleMap) => {
      let out = '';
      let idx = 0;
      for (const a of assocList) {
        if (a.position > idx) out += clean.substring(idx, a.position);
        out += (toggleMap[a.id] ? a.originalText : a.emoji);
        idx = a.position + a.length;
      }
      if (idx < clean.length) out += clean.substring(idx);
      return out;
    };
    const newContent = build(cleanSpeech, associations, next);
    setSpeech({ ...speech, content: newContent });
  };

  // Helper to render segments (used in JSX)
  const renderSegments = () => {
    if (!cleanSpeech) return [ { type: 'text', text: speech.content } ];
    const segs = [];
    let idx = 0;
    for (const a of associations) {
      if (a.position > idx) segs.push({ type: 'text', text: cleanSpeech.substring(idx, a.position) });
      segs.push({ type: 'assoc', key: a.id, assoc: a, text: (toggles[a.id] ? a.originalText : a.emoji) });
      idx = a.position + a.length;
    }
    if (idx < cleanSpeech.length) segs.push({ type: 'text', text: cleanSpeech.substring(idx) });
    return segs;
  };

  // Function to send association to backend
  const saveEmojiAssociation = async ({ speechId, assocId, originalText, emoji, position, cleanSpeech }) => {
    try {
      const idToken = await currentUser.getIdToken();
      const resp = await fetch(`${cloudFunctionBaseUrl}/saveEmojiAssociation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ speechId, assocId, originalText, emoji, position, cleanSpeech }),
      });
      if (!resp.ok) {
  const errData = await resp.json().catch(() => ({}));
  console.error('Failed to save emoji association:', errData);
        setToast(errData.message || 'Failed to save emoji association');
      }
    } catch (err) {
      console.error('Failed to save emoji association: (network/error)', err);
      setToast('Failed to save emoji association');
    }
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
        <span data-testid="speech-content">
          {renderSegments().map((s, i) => {
            if (s.type === 'text') return (<span key={`t-${i}`}>{s.text}</span>);
            return (
              <button
                key={`a-${s.key}`}
                onClick={() => toggleAssociation(s.key)}
                className="assoc-button"
                style={{ color: 'inherit', font: 'inherit' }}
                aria-pressed={!!toggles[s.key]}
                aria-label={toggles[s.key] ? `Show emoji for "${s.assoc.originalText}"` : `Show original text for "${s.assoc.originalText}"`}
              >
                {s.text}
              </button>
            );
          })}
        </span>
        {selection && (
          <button
            style={{ position: 'absolute', top: 5, right: 5, zIndex: 2, background: 'linear-gradient(90deg, #007bff 0%, #00c6ff 100%)', color: '#fff', borderRadius: '6px', padding: '6px 16px', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            onClick={() => setShowEmojiPicker(true)}
          >
            😊 Replace with Emoji
          </button>
        )}
      </div>
      {showEmojiPicker && (
        <div role="dialog" aria-modal="true" ref={modalRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <h4>Pick an Emoji</h4>
            <Picker
              data={emojiData}
              onEmojiSelect={(emoji) => handleEmojiPick(emoji.native)}
              theme="light"
              perLine={8}
              previewPosition="none"
              emojiSize={20}
              style={{ width: '100%' }}
            />
            <button style={{ marginTop: '18px' }} onClick={() => setShowEmojiPicker(false)}>Cancel</button>
          </div>
        </div>
      )}
      <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
        Uploaded on: {speech.createdAt ? new Date(speech.createdAt).toLocaleString() : 'N/A'}
      </p>
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#333', color: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1000 }} role="status">
          {toast}
        </div>
      )}
      <button onClick={handleDelete} style={{ backgroundColor: '#d9534f', marginTop: '10px' }}>Delete Speech</button>
    </div>
  );
}
export default SpeechDetail;