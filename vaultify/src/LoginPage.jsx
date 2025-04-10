import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // Importing the firebase authentication
import styles from './LoginPage.module.css';

const LoginPage = () => {
    const [email, setEmail] = useState(''); // State to store email input
    const [password, setPassword] = useState(''); // State to store password input
    const [error, setError] = useState(''); // State to store any error messages
    const [loading, setLoading] = useState(false); 
    const navigate = useNavigate(); 

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevents the default form submission
        setError('');
        setLoading(true); // Set loading to true while submitting the form

        // Check if both email and password are provided
        if (!email || !password) {
            setError('Please enter both email and password.');
            setLoading(false);
            return;
        }

        try {
            // Attempt to sign in with Firebase using the email and password provided            
            await signInWithEmailAndPassword(auth, email, password);
            localStorage.setItem('userEmail', email);
            navigate('/homepage');
        } catch (err) {
            setError('Invalid email or password.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.loginContainer}>
                <h1>Vaultify</h1>
                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.loginBtn} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className={styles.additionalLinks}>
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className={styles.registerLink}>
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
