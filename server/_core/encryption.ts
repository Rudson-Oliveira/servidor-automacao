/**
 * Módulo de Criptografia Segura
 * AES-256-GCM para chaves API e dados sensíveis
 */

import crypto from 'crypto';
import { ENV } from './env';

// Algoritmo e configurações
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Deriva chave de criptografia do JWT_SECRET
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    ENV.cookieSecret,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Criptografa texto usando AES-256-GCM
 * Retorna: salt:iv:tag:ciphertext (base64)
 */
export function encrypt(plaintext: string): string {
  try {
    // Gerar salt e IV aleatórios
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derivar chave
    const key = deriveKey(salt);
    
    // Criar cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Criptografar
    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');
    
    // Obter tag de autenticação
    const tag = cipher.getAuthTag();
    
    // Formato: salt:iv:tag:ciphertext
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      tag.toString('base64'),
      ciphertext
    ].join(':');
    
  } catch (error) {
    console.error('[CRIPTOGRAFIA] Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa texto usando AES-256-GCM
 * Input: salt:iv:tag:ciphertext (base64)
 */
export function decrypt(encrypted: string): string {
  try {
    // Parse componentes
    const parts = encrypted.split(':');
    if (parts.length !== 4) {
      throw new Error('Formato de dados criptografados inválido');
    }
    
    const [saltB64, ivB64, tagB64, ciphertext] = parts;
    
    const salt = Buffer.from(saltB64!, 'base64');
    const iv = Buffer.from(ivB64!, 'base64');
    const tag = Buffer.from(tagB64!, 'base64');
    
    // Derivar chave
    const key = deriveKey(salt);
    
    // Criar decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Descriptografar
    let plaintext = decipher.update(ciphertext!, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
    
  } catch (error) {
    console.error('[CRIPTOGRAFIA] Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Gera hash seguro (SHA-256)
 * Útil para comparações sem revelar valor original
 */
export function hash(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Compara hash de forma segura (timing-safe)
 */
export function compareHash(data: string, hashedData: string): boolean {
  const dataHash = hash(data);
  return crypto.timingSafeEqual(
    Buffer.from(dataHash),
    Buffer.from(hashedData)
  );
}

/**
 * Mascara chave API para exibição
 * Exemplo: "sk-1234567890abcdef" → "sk-****...cdef"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****';
  }
  
  const prefix = apiKey.substring(0, 3);
  const suffix = apiKey.substring(apiKey.length - 4);
  
  return `${prefix}****...${suffix}`;
}
