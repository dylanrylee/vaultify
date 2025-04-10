// Vaultify's main dashboard: lets the user securely view, add, edit, and delete saved passwords

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
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { encryptPassword, decryptPassword } from "./crypto.js";

const Homepage = () => {
  // These are the states
  const [savedPasswords, setSavedPasswords] = useState([]); // Stores user's saved passwords
  const [user, setUser] = useState(null); // Stores the authenticated user info
  const [showModal, setShowModal] = useState(false); // Controls visibility of the modal for adding passwords
  const [formData, setFormData] = useState({ // Data for adding new passwords
    service: "",
    identifier: "",
    password: "",
  });
  const [selectedPassword, setSelectedPassword] = useState(null); // Selected password for viewing or editing
  const [authPrompt, setAuthPrompt] = useState(false); // Controls visibility of the reauthentication modal
  const [loginPassword, setLoginPassword] = useState(""); 
  const [revealedPassword, setRevealedPassword] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [editAuthPrompt, setEditAuthPrompt] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [masterPasswordModal, setMasterPasswordModal] = useState(false);
  const [tempMasterPassword, setTempMasterPassword] = useState(""); // Stores temporary master password entered during adding a password
  const [masterPasswordError, setMasterPasswordError] = useState("");
  const [verifiedMasterPassword, setVerifiedMasterPassword] = useState(null); // Stores the verified master password

  const navigate = useNavigate();

  // Set user state on auth change and fetch passwords
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser); // Set user when authenticated
        fetchSavedPasswords(firebaseUser.uid); // Fetch saved passwords for the authenticated user
      }
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  // Function to fetch saved passwords from Firestore for a specific user
  const fetchSavedPasswords = async (uid) => {
    try {
      const q = query(
        collection(db, "saved_passwords"),
        where("userID", "==", uid) // Filter saved passwords by user ID
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSavedPasswords(data); // Set the fetched passwords in state
    } catch (error) {
      console.error("Error fetching passwords:", error);
    }
  };

  // Function to update form data state when user types in input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value })); // Update the respective field in the form data
  };

  // Function to initialize adding a new password
  const handleAddPasswordInit = () => {
    if (
      !user ||
      !formData.password ||
      !formData.service ||
      !formData.identifier
    ) {
      alert("Please fill out all fields.");
      return;
    }
    setMasterPasswordModal(true); // Show master password modal for verification
  };

  // Function to confirm the master password and save the new password
  const handleAddPasswordConfirm = async () => {
    if (!tempMasterPassword) {
      setMasterPasswordError("Please enter your master password");
      return;
    }

    try {
      // Verify the master password matches user's actual password
      const credential = EmailAuthProvider.credential(
        user.email,
        tempMasterPassword
      );
      await reauthenticateWithCredential(user, credential);

      // If we get here, password was correct
      // If authentication succeeds, proceed to encrypt and save the password
      setMasterPasswordError("");

      console.log("Encrypting with master password");
      const encryptedPassword = encryptPassword(
        formData.password,
        tempMasterPassword
      );

      if (!encryptedPassword) {
        throw new Error("Encryption failed - no result returned");
      }

      // Save the new password entry to Firestore
      const newEntry = {
        service: formData.service,
        identifier: formData.identifier,
        password: encryptedPassword,
        userID: user.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "saved_passwords"), newEntry); // Add new password to Firestore
      await fetchSavedPasswords(user.uid); // Refresh saved passwords list

      setShowModal(false); 
      setMasterPasswordModal(false);
      setFormData({ service: "", identifier: "", password: "" });
      setTempMasterPassword("");

      alert("Password saved successfully!"); // Notify user
    } catch (error) {
      console.error("Error:", error);
      if (error.code === "auth/wrong-password") {
        setMasterPasswordError("Incorrect master password");
      } else {
        setMasterPasswordError("Failed to save password: " + error.message);
      }
    }
  };

  // Function to handle clicking a saved password to view or edit it
  const handlePasswordClick = (item) => {
    setSelectedPassword(item);
    setAuthPrompt(true); // Always show auth prompt
    setLoginPassword(""); // Clear any previous input
  };

  // Function to reauthenticate the user and reveal the password
  const handleReauthenticate = async () => {
    if (!user || !loginPassword || !selectedPassword) return;

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        loginPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Store the verified password temporarily
      setVerifiedMasterPassword(loginPassword);

      const decrypted = decryptPassword(
        selectedPassword.password,
        loginPassword
      );
      if (!decrypted) throw new Error("Decryption failed");

      setRevealedPassword(decrypted); // Display decrypted password
      setAuthPrompt(false); // Hide authentication prompt
      setLoginPassword(""); // Clear entered password
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Invalid password. Please try again.");
      setLoginPassword(""); // Clear entered password
    }
  };

  // Function to save the edited password
  const handleSaveEditedPassword = async () => {
    if (!selectedPassword?.id || newPassword.trim() === "") return;
    if (!verifiedMasterPassword) {
      alert("Session expired - please view the password again");
      return;
    }

    try {
      // Encrypt the new password using the verified master password
      const encryptedPassword = encryptPassword(
        newPassword,
        verifiedMasterPassword
      );
      const docRef = doc(db, "saved_passwords", selectedPassword.id);
      await updateDoc(docRef, {
        password: encryptedPassword,
      });

      // Reset states and refresh saved passwords list
      setRevealedPassword(null);
      setEditMode(false);
      setNewPassword("");
      fetchSavedPasswords(user.uid);
    } catch (error) {
      console.error("Failed to update password:", error);
      alert("Failed to update password. Please try again.");
    }
  };

  // Function to start editing a password
  const handleEditClick = () => {
    setEditMode(true);
  };

  // Function to verify current password before allowing editing
  const handleEditAuth = () => {
    if (currentPassword === selectedPassword.password) {
      setEditAuthPrompt(false); // Hide edit authentication prompt
      setEditMode(true); // Enable edit mode
      setCurrentPassword(""); // Clear entered current password
    } else {
      alert("Password doesn't match. Please try again.");
      setCurrentPassword(""); // Clear entered current password
    }
  };

  // Function to close and clear the revealed password view
  const handleClosePassword = () => {
    setRevealedPassword(null);
    setVerifiedMasterPassword(null); // Clear the stored password
  };

  // Function to delete a saved password
  const handleDeletePassword = async () => {
    if (!selectedPassword?.id) return;

    try {
      await deleteDoc(doc(db, "saved_passwords", selectedPassword.id)); // Delete password from Firestore
      setRevealedPassword(null); // Reset revealed password state
      fetchSavedPasswords(user.uid); // Refresh saved passwords list
    } catch (error) {
      console.error("Failed to delete password:", error);
    }
  };

  // Function to log out the user
  const handleLogout = async () => {
    try {
      await signOut(auth); // Log out from Firebase authentication
      setRevealedPassword(null); // Clear revealed password state
      navigate("/"); // Redirect to home page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome to Vaultify!</h2>
        {user && <p className={styles.userEmail}>{user.email}</p>}
        <div className={styles.logoutContainer}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Log Out
          </button>
        </div>
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
              <button
                onClick={handleAddPasswordInit}
                className={styles.saveButton}
              >
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
            <h3>Enter Master Password</h3>
            <input
              type="password"
              placeholder="Your account password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={styles.input}
              autoFocus
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

      {masterPasswordModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Verify Your Identity</h3>
            <p>Please enter your account password to continue:</p>
            <input
              type="password"
              placeholder="Your account password"
              value={tempMasterPassword}
              onChange={(e) => {
                setTempMasterPassword(e.target.value);
                setMasterPasswordError("");
              }}
              className={styles.input}
              autoFocus
            />
            {masterPasswordError && (
              <p className={styles.errorText}>{masterPasswordError}</p>
            )}
            <div className={styles.modalButtons}>
              <button
                onClick={handleAddPasswordConfirm}
                className={styles.saveButton}
              >
                Verify and Save
              </button>
              <button
                onClick={() => {
                  setMasterPasswordModal(false);
                  setTempMasterPassword("");
                  setMasterPasswordError("");
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
                    onClick={handleClosePassword}
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
            <p>
              Please enter the current password for {selectedPassword?.service}{" "}
              to edit:
            </p>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleEditAuth} className={styles.saveButton}>
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
    </div>
  );
};

export default Homepage;
