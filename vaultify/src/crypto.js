import CryptoJS from 'crypto-js';

export const generateSalt = () => {
    return CryptoJS.lib.WordArray.random(128/8).toString();
};

export const encryptPassword = (password, salt) => {
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
    const encryptedPassword = CryptoJS.AES.encrypt(password, key).toString();
    return encryptedPassword;
};

export const decryptPassword = (encryptedPassword, password, salt) => {
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPassword, key);
    const decryptedPassword = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedPassword;
};

// Helper function to generate a master key from user's login password
export const generateMasterKey = (password, salt) => {
    return CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
};