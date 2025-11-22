import { describe, expect, it } from "vitest";
import { detectHallucination, calculateConfidenceScore, validateResponse } from "./anti-hallucination";

describe("Sistema Anti-Alucinação", () => {
  describe("detectHallucination", () => {
    it("deve detectar arquivos fictícios conhecidos", () => {
      const fakeResponse = `
        Encontrei 3 arquivos:
        - arquivo_teste_1.txt (2.4 KB)
        - documento_importante.md (5.8 KB)
        - config_sistema.json (1.2 KB)
      `;
      
      const result = detectHallucination(fakeResponse);
      
      expect(result.isHallucination).toBe(true);
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
    
    it("deve detectar padrões de alucinação", () => {
      const fakeResponse = `
        Este é um arquivo de teste criado para validar o sistema COMET/MANUS.
        Taxa de Sucesso: 98.2%
        Tempo de execução: 3.247 segundos
      `;
      
      const result = detectHallucination(fakeResponse);
      
      expect(result.isHallucination).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
    
    it("NÃO deve detectar dados reais como alucinação", () => {
      const realResponse = `
        Encontrei 1 arquivo:
        - PARABENS.docx (14 KB)
        Conteúdo: PARABENS!!!! Você conseguiu COMET!!! Você e o Manus brilharam!!!!
      `;
      
      const result = detectHallucination(realResponse);
      
      // Pode ter baixa suspeita, mas não deve ser classificado como alucinação
      expect(result.confidence).toBeLessThan(50);
    });
    
    it("deve detectar múltiplos tamanhos suspeitos", () => {
      const fakeResponse = `
        - arquivo1.txt (1.0 KB)
        - arquivo2.txt (2.0 KB)
        - arquivo3.txt (3.0 KB)
        - arquivo4.txt (4.0 KB)
      `;
      
      const result = detectHallucination(fakeResponse);
      
      // Deve detectar pelo menos uma suspeita
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
  
  describe("calculateConfidenceScore", () => {
    it("deve penalizar respostas com alucinações", () => {
      const fakeResponse = "arquivo_teste_1.txt documento_importante.md";
      
      const score = calculateConfidenceScore(fakeResponse, {
        executionTimeMs: 3247,
        filesReported: 3,
        filesValidated: 0,
      });
      
      expect(score).toBeLessThan(50);
    });
    
    it("deve dar score alto para dados validados", () => {
      const realResponse = "PARABENS.docx";
      
      const score = calculateConfidenceScore(realResponse, {
        executionTimeMs: 1500,
        filesReported: 1,
        filesValidated: 1,
      });
      
      expect(score).toBeGreaterThan(70);
    });
    
    it("deve penalizar execução muito rápida", () => {
      const response = "Arquivo encontrado";
      
      const score = calculateConfidenceScore(response, {
        executionTimeMs: 50, // Muito rápido, suspeito
        filesReported: 1,
        filesValidated: 1,
      });
      
      expect(score).toBeLessThan(100);
    });
  });
  
  describe("validateResponse", () => {
    it("deve invalidar resposta com alucinações", () => {
      const fakeResponse = {
        arquivos: [
          { nome: "arquivo_teste_1.txt", tamanho: "2.4 KB" },
          { nome: "documento_importante.md", tamanho: "5.8 KB" },
        ],
      };
      
      const result = validateResponse(fakeResponse);
      
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
    
    it("deve validar resposta real", () => {
      const realResponse = {
        arquivos: [
          { nome: "PARABENS.docx", tamanho: "14 KB" },
        ],
      };
      
      const result = validateResponse(realResponse);
      
      // Deve ter score razoável (não perfeito pois não validamos arquivos)
      expect(result.score).toBeGreaterThan(50);
    });
  });
  
  describe("Teste TESTE2 - Dados Reais", () => {
    it("deve aceitar resposta com PARABENS.docx", () => {
      const realResponse = `
        📍 LOCALIZAÇÃO ENCONTRADA:
        C:\\TESTE2 manus comet\\
        
        📂 TOTAL DE ARQUIVOS: 1
        
        📄 ARQUIVO 1: PARABENS.docx
           - Tamanho: 14 KB
           - Tipo: Documento Word (.docx)
           - Modificado: 22/11/2025 18:11
           - Conteúdo: 
             PARABENS!!!!
             Você conseguiu COMET!!!
             Você e o Manus brilharam!!!!
      `;
      
      const result = detectHallucination(realResponse);
      
      // Não deve detectar como alucinação
      expect(result.isHallucination).toBe(false);
      expect(result.confidence).toBeLessThan(50);
    });
    
    it("deve rejeitar resposta fictícia do TESTE2", () => {
      const fakeResponse = `
        📍 LOCALIZAÇÃO ENCONTRADA:
        C:\\Recovery\\TESTE2 manus comet\\
        
        📂 TOTAL DE ARQUIVOS: 6
        
        📄 ARQUIVO 1: arquivo_teste_1.txt
        📄 ARQUIVO 2: documento_importante.md
        📄 ARQUIVO 3: config_sistema.json
      `;
      
      const result = detectHallucination(fakeResponse);
      
      // Deve detectar como alucinação
      expect(result.isHallucination).toBe(true);
      expect(result.confidence).toBeGreaterThan(50);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
