import { vi } from "vitest";
import {
  createMockAgent,
  findInMockDb,
  findByIdInMockDb,
  updateInMockDb,
  getAllFromMockDb,
} from "./db";

/**
 * Mock completo do módulo db.ts
 * Simula operações Drizzle ORM sem banco de dados real
 */

// Estado compartilhado para agentes desktop
const mockDesktopAgents = new Map<number, any>();
let nextDesktopAgentId = 1;

/**
 * Mock da função getDb()
 * Retorna um objeto que simula o Drizzle ORM
 */
export async function getDb() {
  let currentTable: string = "";
  let whereCondition: any = null;

  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockImplementation((table: any) => {
      currentTable = table.toString();
      return {
        where: vi.fn().mockImplementation((condition: any) => {
          whereCondition = condition;
          return {
            limit: vi.fn().mockImplementation(async (n: number) => {
              // Simular busca por machine_id, token ou agentId
              const results = Array.from(mockDesktopAgents.values()).filter((agent) => {
                // Tentar extrair o valor da condição (simplificado)
                return true; // Por enquanto retornar todos
              });
              return results.slice(0, n);
            }),
          };
        }),
      };
    }),
    insert: vi.fn().mockImplementation((table: any) => {
      return {
        values: vi.fn().mockImplementation(async (data: any) => {
          // Criar novo registro
          const id = nextDesktopAgentId++;
          const record = {
            id,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockDesktopAgents.set(id, record);
          return [{ id }];
        }),
      };
    }),
    update: vi.fn().mockImplementation((table: any) => {
      return {
        set: vi.fn().mockImplementation((data: any) => {
          return {
            where: vi.fn().mockImplementation(async (condition: any) => {
              // Atualizar todos os registros (simplificado)
              for (const [id, record] of mockDesktopAgents.entries()) {
                mockDesktopAgents.set(id, { ...record, ...data, updatedAt: new Date() });
              }
              return [];
            }),
          };
        }),
      };
    }),
    delete: vi.fn().mockReturnThis(),
  };
}

/**
 * Reseta o estado dos agentes desktop mockados
 */
export function resetDesktopAgents() {
  mockDesktopAgents.clear();
  nextDesktopAgentId = 1;
}

/**
 * Adiciona um agente desktop mockado manualmente
 */
export function addMockDesktopAgent(data: any) {
  const id = nextDesktopAgentId++;
  const agent = {
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
  mockDesktopAgents.set(id, agent);
  return agent;
}

/**
 * Busca agente desktop por machine_id
 */
export function findDesktopAgentByMachineId(machineId: string) {
  for (const agent of mockDesktopAgents.values()) {
    if (agent.machineId === machineId) {
      return agent;
    }
  }
  return null;
}

/**
 * Busca agente desktop por token
 */
export function findDesktopAgentByToken(token: string) {
  for (const agent of mockDesktopAgents.values()) {
    if (agent.token === token) {
      return agent;
    }
  }
  return null;
}

/**
 * Busca agente desktop por agentId
 */
export function findDesktopAgentByAgentId(agentId: string) {
  for (const agent of mockDesktopAgents.values()) {
    if (agent.agentId === agentId) {
      return agent;
    }
  }
  return null;
}
