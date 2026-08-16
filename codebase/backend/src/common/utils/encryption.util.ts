import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getSecretKey(): Buffer {
  const secret = process.env.API_KEY_SECRET || 'supersecretkeyforapikeys32bytes!';
  return Buffer.from(secret.substring(0, 32));
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const ivHex = parts[0];
  const encryptedHex = parts[1];
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateApiKey(): string {
  return `jaggu_live_${crypto.randomBytes(24).toString('hex')}`;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function maskApiKey(apiKey: string): string {
  return apiKey;
}

