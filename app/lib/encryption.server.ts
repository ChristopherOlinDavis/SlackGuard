import crypto from "crypto";

/**
 * Encryption utility for sensitive data (e.g., Slack access tokens)
 *
 * Uses AES-256-GCM encryption with authenticated encryption
 * Requires ENCRYPTION_KEY environment variable (32-byte hex string)
 *
 * To generate a key, run:
 *   node -e "console.log(crypto.randomBytes(32).toString('hex'))"
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Get encryption key from environment variable
 * @throws Error if ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Generate one with: node -e \"console.log(crypto.randomBytes(32).toString('hex'))\""
    );
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 bytes (64 hex characters). Generate one with: node -e \"console.log(crypto.randomBytes(32).toString('hex'))\""
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format: iv:authTag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Return combined format: iv:authTag:ciphertext
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error(
      `Failed to encrypt data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 *
 * @param encrypted - Encrypted string in format: iv:authTag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey();

    // Parse encrypted string
    const parts = encrypted.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const ciphertext = parts[2];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let plaintext = decipher.update(ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");

    return plaintext;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(
      `Failed to decrypt data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Check if a string appears to be encrypted (has the correct format)
 *
 * @param value - String to check
 * @returns true if the string looks like encrypted data
 */
export function isEncrypted(value: string): boolean {
  // Check for iv:authTag:ciphertext format
  const parts = value.split(":");
  if (parts.length !== 3) {
    return false;
  }

  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}

/**
 * Migrate plaintext tokens to encrypted format
 * Used for one-time migration of existing tokens
 *
 * @param plaintext - Plaintext token
 * @returns Encrypted token if plaintext, or original if already encrypted
 */
export function migrateToken(token: string): string {
  if (isEncrypted(token)) {
    // Already encrypted, return as-is
    return token;
  }

  // Encrypt plaintext token
  return encrypt(token);
}
