// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To check if auth state is resolved

  // Functions for authentication
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  // Listen for auth state changes (Firebase's built-in listener)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Auth state determined
    });

    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  // Only render children when auth state has been determined
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth(); // Get currentUser and loading state

  if (loading) {
    return <p>Loading authentication...</p>; // Or a spinner/loading screen
  }

  // If there's no current user, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If there's a current user, render the children (the protected component)
  return children;
};