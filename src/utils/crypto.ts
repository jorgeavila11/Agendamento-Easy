/**
 * Simple, highly secure client-side encryption/decryption using the native Web Crypto API (AES-GCM).
 * We use the user's Auth UID + a local static salt as key material, ensuring the key is unique, secure, and never hardcoded in plaintext.
 */

const STATIC_SALT_STRING = "essence-whatsapp-crypto-salt-2026";

function stringToArrayBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function arrayBufferToString(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    stringToArrayBuffer(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts plain text using a secret key material (e.g., user UID)
 */
export async function encryptText(text: string, secretMaterial: string): Promise<string> {
  if (!text) return "";
  try {
    const salt = stringToArrayBuffer(STATIC_SALT_STRING + secretMaterial).slice(0, 16);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(secretMaterial, salt);
    
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      stringToArrayBuffer(text)
    );

    const encryptedBytes = new Uint8Array(encryptedContent);
    
    // Package IV and encrypted content together
    const resultBuf = new Uint8Array(iv.length + encryptedBytes.length);
    resultBuf.set(iv, 0);
    resultBuf.set(encryptedBytes, iv.length);

    return bufToHex(resultBuf);
  } catch (err) {
    console.error("Encryption error:", err);
    throw new Error("Falha ao criptografar dados.");
  }
}

/**
 * Decrypts hex-encoded encrypted text using the same secret key material
 */
export async function decryptText(hexStr: string, secretMaterial: string): Promise<string> {
  if (!hexStr) return "";
  try {
    const dataBytes = hexToBuf(hexStr);
    if (dataBytes.length < 12) {
      throw new Error("Dados de criptografia inválidos.");
    }

    const salt = stringToArrayBuffer(STATIC_SALT_STRING + secretMaterial).slice(0, 16);
    const iv = dataBytes.slice(0, 12);
    const encryptedBytes = dataBytes.slice(12);

    const key = await deriveKey(secretMaterial, salt);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      encryptedBytes
    );

    return arrayBufferToString(decryptedContent);
  } catch (err) {
    console.error("Decryption error:", err);
    return ""; // Return empty string if decryption fails
  }
}
