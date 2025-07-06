// src/components/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SpeechUploadForm from './SpeechUploadForm';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out!');
    }
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {currentUser && <p>Welcome, {currentUser.email}!</p>}
      <p>This is your Trippingly Dashboard. More features coming soon!</p>
      <button onClick={handleLogout}>Log Out</button>
      <SpeechUploadForm />

      {/* This is where your list of speeches will eventually appear */}
      <div style={{ marginTop: '30px' }}>
        <h3>Your Speeches</h3>
        <p>No speeches uploaded yet. Upload one above!</p>
      </div>
    </div>
  );
};

export default Dashboard;