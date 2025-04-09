import React, { lazy } from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
// this is just a test
// Use a static import for now to isolate issues
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
const Homepage = lazy(() => import("./Homepage"));
// const RegisterAccount = lazy(() => import("./RegisterAccount"));
// const Homepage = lazy(() => import("./Homepage"));

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/homepage" element={<Homepage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
