import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

// Lazy load the new page
const LoginPage = lazy(() => import('./LoginPage'));

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/about" element={<LoginPage />} />
                        {/* other routes like LoginPage, Homepage, etc. */}
                    </Routes>
                </Suspense>
            </Router>
        </AuthProvider>
    );
};

export default App;
