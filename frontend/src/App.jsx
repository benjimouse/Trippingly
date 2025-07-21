// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider, PrivateRoute } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SpeechDetail from './components/SpeechDetail'; 

function App() {
  return (
    <Router>
      <AuthContextProvider>
        <div style={{ padding: '20px' }}>
          <h1>Trippingly App</h1>
          <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Route */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/speeches/:speechId" // This defines a URL parameter named 'speechId'
              element={
                <PrivateRoute>
                  <SpeechDetail />
                </PrivateRoute>
              }
            />
            
            {/* Default redirect for root path */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Or for a landing page if you prefer:
            <Route path="/" element={<div>Welcome to Trippingly! <Link to="/login">Log In</Link> or <Link to="/register">Register</Link></div>} />
            */}
          </Routes>
        </div>
      </AuthContextProvider>
    </Router>
  );
}

export default App;