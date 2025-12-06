// frontend/src/hooks/useSpeechAPI.js
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { VITE_CLOUD_FUNCTION_URL } from '../utils/env';

const useSpeechAPI = (speechId, dispatch) => {
  const { currentUser } = useAuth();
  const cloudFunctionBaseUrl = VITE_CLOUD_FUNCTION_URL;

  // Helper to get ID token
  const getIdToken = useCallback(async () => {
    if (!currentUser) {
      console.error("No current user found. Cannot perform API call.");
      // Optionally dispatch an error or navigate to login
      return null;
    }
    return await currentUser.getIdToken();
  }, [currentUser]);

  // Fetch speech details
  const fetchSpeech = useCallback(async () => {
    if (!currentUser || !cloudFunctionBaseUrl || !speechId) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: '' });
    dispatch({ type: 'SET_SPEECH_DATA', payload: { speech: null, cleanSpeech: '', associations: [], toggles: {} } }); // Reset data

    try {
      const idToken = await getIdToken();
      if (!idToken) return;

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
        return data; // Return raw data for SpeechDetail to process
      } else {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        console.error("Failed to fetch speech:", errorData);
        dispatch({ type: 'SET_ERROR', payload: errorData.message || `Failed to fetch speech: ${response.statusText}` });
      }
    } catch (err) {
      console.error("An unexpected error occurred while fetching speech:", err);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred while fetching speech.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    return null;
  }, [currentUser, cloudFunctionBaseUrl, speechId, dispatch, getIdToken]);

  // Save emoji association to backend
  const saveEmojiAssociation = useCallback(async ({ assocId, originalText, emoji, position, cleanSpeech }) => {
    try {
      const idToken = await getIdToken();
      if (!idToken) return false;

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
        dispatch({ type: 'SET_TOAST', payload: errData.message || 'Failed to save emoji association' });
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to save emoji association: (network/error)', err);
      dispatch({ type: 'SET_TOAST', payload: 'Failed to save emoji association' });
      return false;
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId, dispatch, getIdToken]);

  // Delete speech
  const deleteSpeech = useCallback(async () => {
    try {
      const idToken = await getIdToken();
      if (!idToken) return false;

      const response = await fetch(`${cloudFunctionBaseUrl}/deleteSpeech/${speechId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (response.ok) {
        return true;
      } else {
        const data = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        console.error("Failed to delete speech:", data);
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to delete speech.' });
        return false;
      }
    } catch (err) {
      console.error("Error deleting speech:", err);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred while deleting the speech.' });
      return false;
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId, dispatch, getIdToken]);

  // Update association toggle state on backend
  const updateAssociationToggle = useCallback(async (assocId, showOriginal) => {
    try {
      const idToken = await getIdToken();
      if (!idToken) return false;

      const resp = await fetch(`${cloudFunctionBaseUrl}/updateAssociationToggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ speechId, assocId, showOriginal }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        console.error('Failed to update association toggle:', errData);
        dispatch({ type: 'SET_TOAST', payload: errData.message || 'Failed to update association toggle' });
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error updating association toggle on backend:", err);
      dispatch({ type: 'SET_TOAST', payload: 'Failed to update association toggle' });
      return false;
    }
  }, [currentUser, cloudFunctionBaseUrl, speechId, dispatch, getIdToken]);

  return {
    fetchSpeech,
    saveEmojiAssociation,
    deleteSpeech,
    updateAssociationToggle,
  };
};

export default useSpeechAPI;
