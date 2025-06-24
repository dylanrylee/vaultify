# Vaultify

Vaultify is a secure, full-stack password manager that lets you store, view, and manage your credentials in an encrypted vault. Built with React and Firebase, Vaultify emphasizes simplicity, strong encryption, and a clean, responsive UI.

---

## Features

- **User Authentication**: Sign up and log in securely via Firebase Authentication.
- **Encrypted Storage**: Passwords are encrypted and salted before being stored in Firestore.
- **CRUD Operations**: Create, read, update, and delete vault entries with instant UI feedback.
- **Responsive UI**: Mobile-first design with React and Tailwind CSS.
- **Modal Dialogs**: Intuitive React modals for adding, editing, and viewing entries.
- **Search & Filter**: Quickly find entries by service name or username.

---

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router  
- **Backend & Data**: Firebase Firestore, Firebase Authentication  
- **Encryption**: CryptoJS (AES encryption with per-entry salt)  
- **Build Tools**: Vite, npm  

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/vaultify.git
   cd vaultify
