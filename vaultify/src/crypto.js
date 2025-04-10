import CryptoJS from 'crypto-js';

// Helper to validate encrypted data format
const validateEncryptedData = (encryptedData) => {
  if (typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a string');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid format. Got ${parts.length} parts, expected 3 (iv:salt:ciphertext)`);
  }

  // Validate each part is valid Base64
  parts.forEach(part => {
    try {
      CryptoJS.enc.Base64.parse(part);
    } catch (e) {
      throw new Error(`Invalid Base64 in part: ${part}`);
    }
  });

  return true;
};

export const encryptPassword = (password, masterPassword) => {
  try {
    // Validate inputs
    if (!password || !masterPassword) {
      throw new Error('Both password and master password are required');
    }

    // Convert to strings
    const passwordStr = String(password);
    const masterPasswordStr = String(masterPassword);

    // Generate random salt (128 bits)
    const salt = CryptoJS.lib.WordArray.random(128/8);
    
    // Generate key using PBKDF2
    const key = CryptoJS.PBKDF2(masterPasswordStr, salt, {
      keySize: 256/32,
      iterations: 10000
    });

    // Generate random IV (128 bits)
    const iv = CryptoJS.lib.WordArray.random(128/8);

    // Perform encryption
    const encrypted = CryptoJS.AES.encrypt(passwordStr, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    // Format: iv(base64):salt(base64):ciphertext(base64)
    const encryptedString = [
      iv.toString(CryptoJS.enc.Base64),
      salt.toString(CryptoJS.enc.Base64),
      encrypted.toString() // Already returns Base64
    ].join(':');

    // Verify our own output
    validateEncryptedData(encryptedString);
    
    return encryptedString;

  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Encryption error: ${error.message}`);
  }
};

export const decryptPassword = (encryptedData, masterPassword) => {
  try {
    // Validate inputs
    if (!encryptedData || !masterPassword) {
      throw new Error('Both encrypted data and master password are required');
    }

    // Validate format before processing
    validateEncryptedData(encryptedData);

    const masterPasswordStr = String(masterPassword);
    const parts = encryptedData.split(':');

    // Parse components (we already validated them)
    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const salt = CryptoJS.enc.Base64.parse(parts[1]);
    const ciphertext = parts[2]; // Already in Base64 format

    // Regenerate key
    const key = CryptoJS.PBKDF2(masterPasswordStr, salt, {
      keySize: 256/32,
      iterations: 10000
    });

    // Perform decryption
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedStr) {
      throw new Error('Decryption returned empty - likely wrong master password');
    }

    return decryptedStr;

  } catch (error) {
    console.error('Decryption failed:', {
      error: error.message,
      encryptedData: encryptedData,
      dataLength: encryptedData?.length,
      parts: encryptedData?.split(':')?.length
    });
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

export default {
  encryptPassword,
  decryptPassword,
};
