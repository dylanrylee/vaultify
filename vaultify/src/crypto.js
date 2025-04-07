import CryptoJS from 'crypto-js';

// Encrypt password with master password
export const encryptPassword = (password, masterPassword) => {
  try {
    // Make sure we have string inputs
    const passwordStr = String(password);
    const masterPasswordStr = String(masterPassword);
    
    // Generate a random salt
    const salt = CryptoJS.lib.WordArray.random(128/8);
    
    // Convert salt to string for storage
    const saltStr = salt.toString(CryptoJS.enc.Base64);
    
    // Create key with PBKDF2
    const key = CryptoJS.PBKDF2(masterPasswordStr, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    // Create random IV
    const iv = CryptoJS.lib.WordArray.random(128/8);
    
    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(passwordStr, key, { 
      iv: iv, 
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    // Combine for storage (iv:salt:ciphertext)
    const result = iv.toString(CryptoJS.enc.Base64) + 
                 ':' + 
                 saltStr + 
                 ':' + 
                 encrypted.toString();
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

// Decrypt password with master password
export const decryptPassword = (encryptedData, masterPassword) => {
  try {
    // Make sure we have string input
    const masterPasswordStr = String(masterPassword);
    
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const salt = CryptoJS.enc.Base64.parse(parts[1]);
    const ciphertext = parts[2];
    
    // Create key with PBKDF2
    const key = CryptoJS.PBKDF2(masterPasswordStr, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { 
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    // Convert to UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
};

export default {
  encryptPassword,
  decryptPassword
};