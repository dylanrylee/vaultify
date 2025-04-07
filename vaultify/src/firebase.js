// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ✅ Added Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAW9zzNhYKSwjod_aMCOBV9tkmWHcJL-wk",
  authDomain: "vaultify-589cb.firebaseapp.com",
  projectId: "vaultify-589cb",
  storageBucket: "vaultify-589cb.firebasestorage.app",
  messagingSenderId: "1000452918103",
  appId: "1:1000452918103:web:2606a088ccae190e1a4c12"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app); 
export default app;
