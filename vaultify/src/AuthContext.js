// React and Firebase imports
import React, { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types"; 
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase"; // Firebase config

// Create a context to hold authentication data
const AuthContext = createContext();

/**
 * AuthProvider wraps the application and provides authentication
 * state (user info and loading status) to all child components.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Stores the current authenticated user
  const [loading, setLoading] = useState(true);  // True while Firebase is checking the auth state

  useEffect(() => {
    // Listen for changes in authentication state (login/logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);     // Update the user object
      setLoading(false);        // Done checking auth status
    });

    // unsubscribe the listener when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    // Provide user and loading state to children via context
    <AuthContext.Provider value={{ user, loading }}>
      {/* Only render children once loading is complete */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Type-checking for children prop
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to easily access authentication context
 * Usage: const { user, loading } = useAuth();
 */
export const useAuth = () => useContext(AuthContext);
