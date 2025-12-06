// src/components/SpeechList.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; 

const SpeechList = () => {
  const { currentUser } = useAuth();
  const [speeches, setSpeeches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const lastVisibleRef = useRef(null);

  // Base URL for your Cloud Functions
  const cloudFunctionBaseUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;

  const fetchSpeeches = useCallback(async (loadMore = false) => {
    if (!currentUser || !cloudFunctionBaseUrl) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const idToken = await currentUser.getIdToken();
      let url = `${cloudFunctionBaseUrl}/getSpeeches?limit=10`;
      if (loadMore && lastVisibleRef.current) {
        url += `&lastVisible=${lastVisibleRef.current}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('SpeechList: Fetched speeches successfully.', data.speeches);
        setSpeeches(prev => loadMore ? [...prev, ...data.speeches] : data.speeches);
        lastVisibleRef.current = data.lastVisible;
        setHasMore(data.lastVisible !== null);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        setError(errorData.message || 'Failed to fetch speeches.');
        console.error('Error fetching speeches:', errorData);
      }
    } catch (err) {
      setError('An error occurred while fetching speeches.');
      console.error('Fetch speeches error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, cloudFunctionBaseUrl]);

  useEffect(() => {
    if(currentUser) {
      fetchSpeeches();
    }
  }, [currentUser, fetchSpeeches]);

  if (loading && speeches.length === 0) {
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
    // Link to the detail page using the speech ID
    <Link key={speech.id} to={`/speeches/${speech.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ border: '1px solid #eee', padding: '10px', margin: '10px 0', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' }}>
          <h4>{speech.name}</h4>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            Uploaded: {speech.createdAt ? new Date(speech.createdAt).toLocaleString() : 'N/A'}
          </p>
          {/* Still showing truncated content in the list view */}
          <p>{speech.content.substring(0, 150)}{speech.content.length > 150 ? '...' : ''}</p>
        </div>
    </Link>
))}
      {hasMore && (
        <button onClick={() => fetchSpeeches(true)} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default SpeechList;