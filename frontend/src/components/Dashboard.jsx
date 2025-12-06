// src/components/Dashboard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SpeechUploadForm from './SpeechUploadForm';
import SpeechList from './SpeechList';
import '../App.css'; // Import the new CSS

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      setToast('Failed to log out!');
    }
  };

  const handleSpeechUploaded = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard</h2>
        <div>
          {currentUser && <span>Welcome, {currentUser.email}</span>}
          <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Log Out</button>
        </div>
      </header>
      <p>This is your Trippingly Dashboard. More features coming soon!</p>
      <SpeechUploadForm onUploadSuccess={handleSpeechUploaded} />
      <div style={{ marginTop: '30px' }}>
        <h3>Your Speeches</h3>
        <SpeechList key={refreshKey} />
      </div>
    </div>
  );
};

export default Dashboard;