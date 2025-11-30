/**
 * Mock Services Index
 * Exporta todos os mocks para uso no ambiente de desenvolvimento
 */

export { whatsappMock, type WhatsAppMessage, type WhatsAppResponse } from './whatsapp-mock';
export { obsidianMock, type ObsidianNote, type ObsidianResponse } from './obsidian-mock';
export { telefonicaMock, type TelefonicaRequest, type TelefonicaResponse } from './telefonica-mock';
export { abacusMock, type AbacusKnowledgeItem, type AbacusResponse } from './abacus-mock';

/**
 * Verifica se está em modo mock baseado em variáveis de ambiente
 */
export function isMockEnabled(service: string): boolean {
  const envVar = `${service.toUpperCase()}_MOCK`;
  return process.env[envVar] === 'true';
}

/**
 * Configuração global de mocks
 */
export const mockConfig = {
  whatsapp: isMockEnabled('whatsapp'),
  obsidian: isMockEnabled('obsidian'),
  telefonica: isMockEnabled('telefonica'),
  abacus: isMockEnabled('abacus'),
};

console.log('[Mocks] Configuração:', mockConfig);
