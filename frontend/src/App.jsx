// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider, PrivateRoute } from './context/AuthContext';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SpeechDetail from './components/SpeechDetail';

// --- START ENHANCED ERROR BOUNDARY & GLOBAL ERROR HANDLER ---

// Global error handler to catch any unhandled errors
const handleGlobalError = (message, source, lineno, colno, error) => {
  console.error("Global unhandled error:", message, source, lineno, colno, error);
  // You could also send this error to a logging service
};

window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
          <h1>Something went wrong.</h1>
          <p>An unexpected error has occurred. Please try refreshing the page.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
            <summary>Error Details</summary>
            {this.state.error && (
              <div>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}
            {this.state.errorInfo && (
              <div style={{ marginTop: '10px' }}>
                <strong>Stack Trace:</strong>
                <pre style={{ background: '#fff', padding: '10px', borderRadius: '3px', border: '1px solid #ddd' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- END ENHANCED ERROR BOUNDARY & GLOBAL ERROR HANDLER ---


function App() {
  useEffect(() => {
    // Clean up the global error handlers when the component unmounts
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection:', event.reason);
      });
    };
  }, []);

  return (
    <Router>
      <AuthContextProvider>
        <ErrorBoundary>
          <div style={{ padding: '20px' }}>
            <h1>Trippingly App</h1>
            <Routes>
              {/* Public Routes */}
              {/* <Route path="/register" element={<Register />} /> */}
              <Route path="/login" element={<Login />} />

              {/* Protected Route */}
              {/* <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              /> */}

              {/* <Route
                path="/speeches/:speechId" // This defines a URL parameter named 'speechId'
                element={
                  <PrivateRoute>
                    <SpeechDetail />
                  </PrivateRoute>
                }
              /> */}
              
              {/* Default redirect for root path */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              {/* Or for a landing page if you prefer:
              <Route path="/" element={<div>Welcome to Trippingly! <Link to="/login">Log In</Link> or <Link to="/register">Register</Link></div>} />
              */}
            </Routes>
          </div>
        </ErrorBoundary>
      </AuthContextProvider>
    </Router>
  );
}

export default App;
