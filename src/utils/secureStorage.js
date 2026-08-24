import CryptoJS from 'crypto-js';

// Get encryption key from environment or use a default (NOT recommended for production)
// In production, this should be a complex string stored in .env
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'ibn-al-zumar-secret-key-change-in-prod';

/**
 * Encrypts data using AES-256
 * @param {any} data - The data to encrypt (object, string, etc.)
 * @returns {string} - Encrypted ciphertext
 */
const encrypt = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('[SecureStorage] Encryption failed:', error);
    return null;
  }
};

/**
 * Decrypts data using AES-256
 * @param {string} ciphertext - The encrypted string
 * @returns {any|null} - Decrypted data or null if invalid
 */
const decrypt = (ciphertext) => {
  try {
    if (!ciphertext) return null;
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedStr) return null;
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error('[SecureStorage] Decryption failed:', error);
    // If decryption fails, clear corrupted data
    return null;
  }
};

/**
 * Secure Auth Storage Service
 * Replaces direct localStorage.setItem/getItem for tokens
 */
export const secureAuthStorage = {
  /**
   * Save authentication data securely
   * @param {Object} authData - { token, user, expiresAt, refreshToken? }
   */
  set: (authData) => {
    try {
      const encrypted = encrypt(authData);
      if (encrypted) {
        localStorage.setItem('ibn_zumar_auth_encrypted', encrypted);
        // Also store a non-sensitive flag to check existence quickly
        localStorage.setItem('ibn_zumar_auth_exists', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SecureStorage] Set failed:', error);
      return false;
    }
  },

  /**
   * Retrieve and decrypt authentication data
   * @returns {Object|null} - Decrypted auth data or null
   */
  get: () => {
    try {
      const encrypted = localStorage.getItem('ibn_zumar_auth_encrypted');
      if (!encrypted) return null;

      const data = decrypt(encrypted);
      
      // Validate token expiration if exists
      if (data && data.expiresAt) {
        const now = Date.now();
        if (now > data.expiresAt) {
          console.warn('[SecureStorage] Token expired');
          secureAuthStorage.clear(); // Auto-clear expired token
          return null;
        }
      }
      
      return data;
    } catch (error) {
      console.error('[SecureStorage] Get failed:', error);
      return null;
    }
  },

  /**
   * Clear all stored auth data
   */
  clear: () => {
    localStorage.removeItem('ibn_zumar_auth_encrypted');
    localStorage.removeItem('ibn_zumar_auth_exists');
  },

  /**
   * Check if auth data exists (without decrypting)
   * @returns {boolean}
   */
  exists: () => {
    return localStorage.getItem('ibn_zumar_auth_exists') === 'true';
  }
};

/**
 * Secure Generic Storage for sensitive app data
 * Usage: secureStorage.set('cart', cartData);
 */
export const secureStorage = {
  set: (key, value) => {
    try {
      const encrypted = encrypt(value);
      if (encrypted) {
        localStorage.setItem(`secure_${key}`, encrypted);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SecureStorage] Generic set failed:', error);
      return false;
    }
  },

  get: (key) => {
    try {
      const encrypted = localStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;
      return decrypt(encrypted);
    } catch (error) {
      console.error('[SecureStorage] Generic get failed:', error);
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(`secure_${key}`);
  }
};

export default secureAuthStorage;