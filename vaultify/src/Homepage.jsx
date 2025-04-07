import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import styles from "./Homepage.module.css";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut
} from "firebase/auth";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";  


const Homepage = () => {
  const [savedPasswords, setSavedPasswords] = useState([]);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    service: "",
    identifier: "",
    password: "",
  });
  const [selectedPassword, setSelectedPassword] = useState(null);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [revealedPassword, setRevealedPassword] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [editAuthPrompt, setEditAuthPrompt] = useState(false); 
  const [showNewPassword, setShowNewPassword] = useState(false); 
  

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        fetchSavedPasswords(firebaseUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSavedPasswords = async (uid) => {
    try {
      const q = query(
        collection(db, "saved_passwords"),
        where("userID", "==", uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedPasswords(data);
    } catch (error) {
      console.error("Error fetching passwords:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPassword = async () => {
    if (!user) return;

    const newEntry = {
      service: formData.service,
      identifier: formData.identifier,
      password: formData.password,
      userID: user.uid,
    };

    try {
      await addDoc(collection(db, "saved_passwords"), newEntry);
      fetchSavedPasswords(user.uid);
      setShowModal(false);
      setFormData({ service: "", identifier: "", password: "" });
    } catch (error) {
      console.error("Error saving password:", error);
    }
  };

  const handlePasswordClick = (item) => {
    setSelectedPassword(item);
    setAuthPrompt(true);
  };

  const handleReauthenticate = async () => {
    if (!user || !loginPassword) return;

    const credential = EmailAuthProvider.credential(user.email, loginPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      setRevealedPassword(selectedPassword.password);
      setAuthPrompt(false);
      setLoginPassword("");
    } catch (error) {
      alert("Authentication failed. Please try again.");
    }
  };

  const handleSaveEditedPassword = async () => {
    if (!selectedPassword?.id || newPassword.trim() === "") return;

    try {
      const docRef = doc(db, "saved_passwords", selectedPassword.id);
      await updateDoc(docRef, {
        password: newPassword,
      });
      setRevealedPassword(newPassword);
      setEditMode(false);
      setNewPassword("");
      setCurrentPassword("");
      fetchSavedPasswords(user.uid);
    } catch (error) {
      console.error("Failed to update password:", error);
    }
  };


    // Modify the edit button click handler
    const handleEditClick = () => {
        setEditAuthPrompt(true); // Show password verification first
      };

  const handleEditAuth = () => {
    if (currentPassword === selectedPassword.password) {
      setEditAuthPrompt(false);
      setEditMode(true);
      setCurrentPassword("");
    } else {
      alert("Password doesn't match. Please try again.");
      setCurrentPassword("");
    }
  };
    

  const handleDeletePassword = async () => {
    if (!selectedPassword?.id) return;

    try {
      await deleteDoc(doc(db, "saved_passwords", selectedPassword.id));
      setRevealedPassword(null);
      fetchSavedPasswords(user.uid);
    } catch (error) {
      console.error("Failed to delete password:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);  // Sign the user out
      navigate("/");  // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome to Vaultify!</h2>
        {user && <p className={styles.userEmail}>{user.email}</p>}
        <button
          className={styles.circleAddButton}
          onClick={() => setShowModal(true)}
        >
          <FaPlus />
        </button>
      </div>

      <div className={styles.passwordList}>
        {savedPasswords.length > 0 ? (
          savedPasswords.map((item, index) => (
            <div
              key={index}
              className={styles.passwordItem}
              onClick={() => handlePasswordClick(item)}
            >
              <div className={styles.details}>
                <p className={styles.name}>{item.service}</p>
                <p className={styles.identifier}>{item.identifier}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No saved passwords yet.</p>
        )}
      </div>

      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Add New Password</h3>
            <input
              type="text"
              name="service"
              placeholder="Service"
              value={formData.service}
              onChange={handleInputChange}
              className={styles.input}
            />
            <input
              type="text"
              name="identifier"
              placeholder="Identifier (Email, Phone, or Username)"
              value={formData.identifier}
              onChange={handleInputChange}
              className={styles.input}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleAddPassword} className={styles.saveButton}>
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {authPrompt && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Re-enter your password to reveal</h3>
            <input
              type="password"
              placeholder="Your login password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button
                onClick={handleReauthenticate}
                className={styles.saveButton}
              >
                Submit
              </button>
              
              <button
                onClick={() => {
                  setAuthPrompt(false);
                  setLoginPassword("");
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{revealedPassword && !editAuthPrompt && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>🔐 Password</h3>
            {!editMode ? (
              <>
                <p style={{ fontWeight: "bold", fontSize: "18px" }}>
                  {revealedPassword}
                </p>
                <div className={styles.modalButtons}>
                  <button
                    onClick={handleEditClick}
                    className={styles.saveButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePassword}
                    className={styles.deleteButton}
                  >
                    <FaTrash />
                  </button>
                  <button
                    onClick={() => setRevealedPassword(null)}
                    className={styles.cancelButton}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                  />
                  <button
                    className={styles.toggleVisibility}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                <div className={styles.modalButtons}>
                  <button
                    onClick={handleSaveEditedPassword}
                    className={styles.saveButton}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNewPassword("");
                    }}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

{editAuthPrompt && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Verify Current Password</h3>
            <p>Please enter the current password for {selectedPassword?.service} to edit:</p>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button
                onClick={handleEditAuth}
                className={styles.saveButton}
              >
                Verify
              </button>
              <button
                onClick={() => {
                  setEditAuthPrompt(false);
                  setCurrentPassword("");
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      <div className={styles.logoutContainer}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Homepage;