/**
 * TESTES DE CRIPTOGRAFIA
 * Valida módulo de criptografia AES-256-GCM
 */

import { describe, expect, it } from "vitest";
import { encrypt, decrypt, hash, compareHash, maskApiKey } from "./_core/encryption";

describe("Módulo de Criptografia", () => {
  describe("encrypt/decrypt", () => {
    it("deve criptografar e descriptografar texto corretamente", () => {
      const plaintext = "Texto secreto para teste";
      
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
    
    it("deve gerar ciphertext diferente para mesma entrada", () => {
      const plaintext = "Mesmo texto";
      
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      // Mesmo texto deve gerar ciphertexts diferentes (salt/IV aleatórios)
      expect(encrypted1).not.toBe(encrypted2);
      
      // Mas ambos devem descriptografar para o mesmo texto
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });
    
    it("deve criptografar chaves API longas", () => {
      const apiKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
      const encrypted = encrypt(apiKey);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(apiKey);
    });
    
    it("deve criptografar strings vazias", () => {
      const plaintext = "";
      
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
    
    it("deve falhar ao descriptografar dados corrompidos", () => {
      const plaintext = "Texto válido";
      const encrypted = encrypt(plaintext);
      
      // Corromper o ciphertext
      const corrupted = encrypted.replace(/A/g, 'B');
      
      expect(() => decrypt(corrupted)).toThrow();
    });
    
    it("deve falhar ao descriptografar formato inválido", () => {
      const invalidFormat = "invalid:format";
      
      expect(() => decrypt(invalidFormat)).toThrow();
    });
    
    it("deve ter formato correto (salt:iv:tag:ciphertext)", () => {
      const plaintext = "Teste de formato";
      const encrypted = encrypt(plaintext);
      
      const parts = encrypted.split(':');
      expect(parts).toHaveLength(4);
      
      // Verificar que todas as partes são base64 válidas
      parts.forEach(part => {
        expect(part).toMatch(/^[A-Za-z0-9+/]+=*$/);
      });
    });
  });
  
  describe("hash/compareHash", () => {
    it("deve gerar hash SHA-256 consistente", () => {
      const data = "Dados para hash";
      
      const hash1 = hash(data);
      const hash2 = hash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 = 64 caracteres hex
    });
    
    it("deve gerar hashes diferentes para dados diferentes", () => {
      const data1 = "Dados 1";
      const data2 = "Dados 2";
      
      const hash1 = hash(data1);
      const hash2 = hash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
    
    it("deve comparar hashes corretamente (timing-safe)", () => {
      const data = "Senha secreta";
      const hashedData = hash(data);
      
      expect(compareHash(data, hashedData)).toBe(true);
      expect(compareHash("Senha errada", hashedData)).toBe(false);
    });
    
    it("deve ser sensível a maiúsculas/minúsculas", () => {
      const data1 = "Senha";
      const data2 = "senha";
      
      const hash1 = hash(data1);
      const hash2 = hash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
  
  describe("maskApiKey", () => {
    it("deve mascarar chave API corretamente", () => {
      const apiKey = "sk-1234567890abcdef";
      const masked = maskApiKey(apiKey);
      
      expect(masked).toBe("sk-****...cdef");
      expect(masked).not.toContain("1234567890");
    });
    
    it("deve mascarar chaves longas", () => {
      const apiKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz";
      const masked = maskApiKey(apiKey);
      
      expect(masked).toBe("sk-****...wxyz");
    });
    
    it("deve retornar **** para chaves muito curtas", () => {
      const apiKey = "short";
      const masked = maskApiKey(apiKey);
      
      expect(masked).toBe("****");
    });
    
    it("deve retornar **** para strings vazias", () => {
      const masked = maskApiKey("");
      
      expect(masked).toBe("****");
    });
  });
  
  describe("Segurança e Performance", () => {
    it("deve criptografar/descriptografar rapidamente", () => {
      const plaintext = "Teste de performance";
      
      const startEncrypt = Date.now();
      const encrypted = encrypt(plaintext);
      const encryptTime = Date.now() - startEncrypt;
      
      const startDecrypt = Date.now();
      decrypt(encrypted);
      const decryptTime = Date.now() - startDecrypt;
      
      // Deve ser rápido (< 100ms cada operação)
      expect(encryptTime).toBeLessThan(100);
      expect(decryptTime).toBeLessThan(100);
    });
    
    it("deve suportar textos grandes (1MB)", () => {
      const largeText = "A".repeat(1024 * 1024); // 1MB
      
      const encrypted = encrypt(largeText);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(largeText);
    });
    
    it("deve usar salt e IV únicos", () => {
      const plaintext = "Teste de unicidade";
      
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      const [salt1, iv1] = encrypted1.split(':');
      const [salt2, iv2] = encrypted2.split(':');
      
      // Salt e IV devem ser diferentes
      expect(salt1).not.toBe(salt2);
      expect(iv1).not.toBe(iv2);
    });
  });
  
  describe("Casos extremos", () => {
    it("deve criptografar caracteres especiais", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
      
      const encrypted = encrypt(specialChars);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(specialChars);
    });
    
    it("deve criptografar Unicode/Emoji", () => {
      const unicode = "Olá 世界 🌍 🔒 🚀";
      
      const encrypted = encrypt(unicode);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(unicode);
    });
    
    it("deve criptografar JSON", () => {
      const json = JSON.stringify({
        apiKey: "sk-1234567890",
        secret: "super-secret",
        nested: {
          value: 123
        }
      });
      
      const encrypted = encrypt(json);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(json);
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(json));
    });
  });
});
