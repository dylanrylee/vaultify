import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase'; // make sure this points to your firebase.js
import styles from './RegisterPage.module.css';

const RegisterAccount = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!email || !password) {
            setError('Fill all required fields.');
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setSuccess(true);
            setEmail('');
            setPassword('');
        } catch (err) {
            console.error("Firebase Registration Error:", err);
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('This email is already in use.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address.');
                    break;
                case 'auth/weak-password':
                    setError('Password should be at least 6 characters.');
                    break;
                default:
                    setError('Something went wrong. Please try again.');
                    break;
            }
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.registerContainer}>
                <h1>Vaultify</h1>
                <h2>Create New Account</h2>
                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>Account created successfully!</div>}
                <form onSubmit={handleRegister} className={styles.registerForm}>
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
                    <button type="submit" className={styles.registerBtn}>
                        Register
                    </button>
                </form>
                <div className={styles.additionalLinks}>
                    <p>
                        Already have an account?{' '}
                        <Link to="/" className={styles.loginLink}>
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterAccount;
