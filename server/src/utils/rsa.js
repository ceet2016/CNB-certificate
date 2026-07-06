import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const keysDir = join(__dirname, '..', '..', 'data');
const pubKeyPath = join(keysDir, 'rsa_public.pem');
const privKeyPath = join(keysDir, 'rsa_private.pem');

/**
 * Generate or load RSA-2048 key pair.
 * Keys are persisted to data/ directory so they survive restarts.
 */
function ensureKeyPair() {
  if (fs.existsSync(pubKeyPath) && fs.existsSync(privKeyPath)) {
    return {
      publicKey: fs.readFileSync(pubKeyPath, 'utf8'),
      privateKey: fs.readFileSync(privKeyPath, 'utf8'),
    };
  }

  if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(pubKeyPath, publicKey);
  fs.writeFileSync(privKeyPath, privateKey);
  console.log('[RSA] Generated new RSA-2048 key pair');
  return { publicKey, privateKey };
}

const { publicKey, privateKey } = ensureKeyPair();

/**
 * Get the RSA public key in PEM format (safe to share with frontend).
 */
export function getPublicKey() {
  return publicKey;
}

/**
 * Get the RSA public key as base64 (without PEM headers) for JSEncrypt.
 */
export function getPublicKeyBase64() {
  return publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\n/g, '');
}

/**
 * Decrypt data that was encrypted with the public key (RSA-OAEP).
 * @param {string} encryptedBase64 - Base64-encoded ciphertext
 * @returns {string} Decrypted plaintext
 */
export function rsaDecrypt(encryptedBase64) {
  const buffer = Buffer.from(encryptedBase64, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return decrypted.toString('utf8');
}

/**
 * Encrypt plaintext with the public key (for testing / seeding).
 * @param {string} plaintext
 * @returns {string} Base64-encoded ciphertext
 */
export function rsaEncrypt(plaintext) {
  const buffer = Buffer.from(plaintext, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString('base64');
}

export { privateKey };
