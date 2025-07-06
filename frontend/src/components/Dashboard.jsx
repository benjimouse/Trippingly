// src/components/Dashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    </div>
  );
};

export default Dashboard;