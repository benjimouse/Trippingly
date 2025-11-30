// src/components/SpeechDetail.jsx

import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import { VITE_CLOUD_FUNCTION_URL } from '../utils/env';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';

// --- Reducer setup ---
const initialState = {
  speech: null,
  loading: true,
  error: '',
  selection: null, // {start, end, text}
  showEmojiPicker: false,
  cleanSpeech: '',
  toast: null,
  associations: [],
  toggles: {},
};

function speechDetailReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SPEECH_DATA':
      return {
        ...state,
        speech: action.payload.speech,
        cleanSpeech: action.payload.cleanSpeech,
        associations: action.payload.associations,
        toggles: action.payload.toggles,
        loading: false,
      };
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    case 'SET_SHOW_EMOJI_PICKER':
      return { ...state, showEmojiPicker: action.payload };
    case 'SET_TOAST':
      return { ...state, toast: action.payload };
    case 'UPDATE_ASSOCIATIONS_AND_TOGGLES': {
      const { nextAssociations, nextToggles, newSpeechContent } = action.payload;
      return {
        ...state,
        associations: nextAssociations,
        toggles: nextToggles,
        speech: { ...state.speech, content: newSpeechContent },
        selection: null,
        showEmojiPicker: false,
      };
    }
    case 'UPDATE_DISPLAYED_SPEECH_CONTENT':
      return { ...state, speech: { ...state.speech, content: action.payload } };
    case 'SET_CLEAN_SPEECH':
      return { ...state, cleanSpeech: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- Component ---
const SpeechDetail = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [state, dispatch] = useReducer(speechDetailReducer, initialState);
  const {
    speech,
    loading,
    error,
    selection,
    showEmojiPicker,
    cleanSpeech,
    toast,
    associations,
    toggles,
  } = state;
  const modalRef = useRef(null);
  const prevFocusRef = useRef(null);

  // Generate a stable-ish id for new associations. Prefer crypto.randomUUID when available.
  const genAssocId = () => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch { /* ignore crypto unavailability */ }
    return `assoc-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  };

  // Helper to rebuild displayed content from cleanSpeech + associations + toggles
  const buildDisplayedContent = useCallback((clean, assocList, toggleMap) => {
    let out = '';
    let idx = 0;
    for (const a of assocList) {
      if (a.position > idx) out += clean.substring(idx, a.position);
      out += (toggleMap[a.id] ? a.originalText : a.emoji);
      idx = a.position + a.length;
    }
    if (idx < clean.length) out += clean.substring(idx);
    return out;
  }, []);

  // For test environments only: allow direct selection state setting
  useEffect(() => {
    if (process.env.NODE_ENV === 'test' && typeof window !== 'undefined') {
      window._setSpeechSelection = (sel) => dispatch({ type: 'SET_SELECTION', payload: sel });
      return () => { delete window._setSpeechSelection; };
    }
  }, []);

  const cloudFunctionBaseUrl = VITE_CLOUD_FUNCTION_URL;

  const fetchSpeech = useCallback(async () => {
    if (!currentUser || !cloudFunctionBaseUrl || !speechId) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_SPEECH_DATA', payload: { speech: null, cleanSpeech: '', associations: [], toggles: {} } }); // Reset data
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
        dispatch({ type: 'SET_ERROR', payload: errorData.message || `Failed to fetch speech: ${response.statusText}` });
      }
    } catch (err) {
      console.error("An unexpected error occurred while fetching speech:", err);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred while fetching speech.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId]);

  useEffect(() => {
    fetchSpeech();
  }, [fetchSpeech]);

  // Auto-dismiss toast (placed here so hooks run in the same order every render)
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 4000);
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
  } catch (err) { console.error("Error restoring focus:", err); }
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
          dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to delete speech.' });
        }
      } catch (err) {
        console.error("Error deleting speech:", err);
        dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred while deleting the speech.' });
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
      dispatch({ type: 'SET_SELECTION', payload: null });
      return;
    }
    if (!selectionObj.anchorNode || !contentEl.contains(selectionObj.anchorNode)) {
      dispatch({ type: 'SET_SELECTION', payload: null });
      return;
    }
    const selectedText = selectionObj.toString();
    if (!selectedText.trim()) {
      dispatch({ type: 'SET_SELECTION', payload: null });
      return;
    }
  // Compute start relative to the original (clean) speech so positions remain stable
  const content = cleanSpeech;
  const start = content.indexOf(selectedText);
    if (start === -1) {
      dispatch({ type: 'SET_SELECTION', payload: null });
      return;
    }
    const end = start + selectedText.length;
    dispatch({ type: 'SET_SELECTION', payload: { start, end, text: selectedText } });
  };

  const handleEmojiPick = (emoji) => {
    if (!selection || !speech) return;
  const { start, text } = selection;
    // Replace highlighted text with emoji
    // Create an association with a stable id and position relative to cleanSpeech
    const assoc = { id: genAssocId(), position: start, length: text.length, originalText: text, emoji };
    const nextAssociations = [...associations, assoc].sort((a, b) => a.position - b.position);
    // persist associations + toggles (default show emoji => false for showOriginal)
    const nextToggles = { ...toggles, [assoc.id]: false };
    try {
      localStorage.setItem(`speech_assoc:${speechId}`, JSON.stringify({ associations: nextAssociations, toggles: nextToggles }));
    } catch (err) {
      console.error("Error saving associations to localStorage:", err);
    }
    const newSpeechContent = buildDisplayedContent(cleanSpeech, nextAssociations, nextToggles);
    dispatch({
      type: 'UPDATE_ASSOCIATIONS_AND_TOGGLES',
      payload: { nextAssociations, nextToggles, newSpeechContent },
    });
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
    const nextToggles = { ...toggles, [assocId]: !toggles[assocId] };
    try {
      localStorage.setItem(`speech_assoc:${speechId}`, JSON.stringify({ associations, toggles: nextToggles }));
    } catch (err) {
      console.error("Error saving toggles to localStorage:", err);
    }

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
          body: JSON.stringify({ speechId, assocId, showOriginal: !!nextToggles[assocId] }),
        });
      } catch (err) {
        console.error("Error updating association toggle on backend:", err);
        // We could dispatch a toast here if desired
      }
    })();

    const newSpeechContent = buildDisplayedContent(cleanSpeech, associations, nextToggles);
    dispatch({ type: 'UPDATE_ASSOCIATIONS_AND_TOGGLES', payload: { nextAssociations: associations, nextToggles: nextToggles, newSpeechContent: newSpeechContent } });
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
            onClick={() => dispatch({ type: 'SET_SHOW_EMOJI_PICKER', payload: true })}
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
            <button style={{ marginTop: '18px' }} onClick={() => dispatch({ type: 'SET_SHOW_EMOJI_PICKER', payload: false })}>Cancel</button>
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