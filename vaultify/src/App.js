// Import React and routing utilities
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Import the AuthProvider to manage global authentication state
import { AuthProvider } from "./AuthContext";

// Import pages for routing
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Homepage from "./Homepage";

/**
 * App is the root component of the application.
 * It sets up routing and provides global authentication context.
 */
const App = () => {
    return (
        // Wrap the entire app in AuthProvider to share auth state (user, loading) globally
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public route: Login page is the default route */}
                    <Route path="/" element={<LoginPage />} />

                    {/* Public route: Registration page */}
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Private route: Homepage shown after successful login */}
                    <Route path="/homepage" element={<Homepage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
