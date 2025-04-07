import CryptoJS from 'crypto-js';

// This function generates a salt (for salting passwords before encryption)
export const generateSalt = () => {
    return CryptoJS.lib.WordArray.random(128/8).toString(); // Generates a random salt
};

// Encrypts the password using AES with the salt
export const encryptPassword = (password, salt) => {
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 }); // PBKDF2 used for key derivation
    const encryptedPassword = CryptoJS.AES.encrypt(password, key).toString();
    return encryptedPassword;
};

// Decrypts the encrypted password
export const decryptPassword = (encryptedPassword, password, salt) => {
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPassword, key);
    const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedPassword;
};
