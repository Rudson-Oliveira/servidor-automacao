import { vi } from "vitest";

/**
 * Mock do banco de dados para testes unitários
 * Simula operações CRUD sem dependências externas
 */

// Estado em memória para simular banco de dados
const mockDatabase = {
  users: new Map<number, any>(),
  desktopAgents: new Map<number, any>(),
  desktopCommands: new Map<number, any>(),
  desktopScreenshots: new Map<number, any>(),
  desktopLogs: new Map<number, any>(),
  skills: new Map<number, any>(),
  conversas: new Map<number, any>(),
  execucoes: new Map<number, any>(),
  apiKeys: new Map<number, any>(),
};

// Contadores de IDs
let nextId = {
  users: 1,
  desktopAgents: 1,
  desktopCommands: 1,
  desktopScreenshots: 1,
  desktopLogs: 1,
  skills: 1,
  conversas: 1,
  execucoes: 1,
  apiKeys: 1,
};

/**
 * Reseta o estado do mock (útil para beforeEach nos testes)
 */
export function resetMockDatabase() {
  mockDatabase.users.clear();
  mockDatabase.desktopAgents.clear();
  mockDatabase.desktopCommands.clear();
  mockDatabase.desktopScreenshots.clear();
  mockDatabase.desktopLogs.clear();
  mockDatabase.skills.clear();
  mockDatabase.conversas.clear();
  mockDatabase.execucoes.clear();
  mockDatabase.apiKeys.clear();

  nextId = {
    users: 1,
    desktopAgents: 1,
    desktopCommands: 1,
    desktopScreenshots: 1,
    desktopLogs: 1,
    skills: 1,
    conversas: 1,
    execucoes: 1,
    apiKeys: 1,
  };
}

/**
 * Mock do Drizzle ORM
 */
export const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  onDuplicateKeyUpdate: vi.fn().mockReturnThis(),
  execute: vi.fn(),
};

/**
 * Cria um usuário mock
 */
export function createMockUser(data: Partial<any> = {}) {
  const id = nextId.users++;
  const user = {
    id,
    openId: data.openId || `mock-openid-${id}`,
    name: data.name || `Mock User ${id}`,
    email: data.email || `user${id}@mock.com`,
    loginMethod: data.loginMethod || "manus",
    role: data.role || "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...data,
  };
  mockDatabase.users.set(id, user);
  return user;
}

/**
 * Cria um Desktop Agent mock
 */
export function createMockAgent(userId: number, data: Partial<any> = {}) {
  const id = nextId.desktopAgents++;
  const agent = {
    id,
    userId,
    token: data.token || `mock-token-${id}`,
    deviceName: data.deviceName || `Mock Device ${id}`,
    platform: data.platform || "Windows 11",
    version: data.version || "1.0.0",
    status: data.status || "offline",
    lastPing: data.lastPing || new Date(),
    ipAddress: data.ipAddress || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
  mockDatabase.desktopAgents.set(id, agent);
  return agent;
}

/**
 * Cria um Desktop Command mock
 */
export function createMockCommand(agentId: number, userId: number, data: Partial<any> = {}) {
  const id = nextId.desktopCommands++;
  const command = {
    id,
    agentId,
    userId,
    commandType: data.commandType || "screenshot",
    commandData: data.commandData || null,
    status: data.status || "pending",
    result: data.result || null,
    errorMessage: data.errorMessage || null,
    executionTimeMs: data.executionTimeMs || null,
    createdAt: new Date(),
    completedAt: data.completedAt || null,
    ...data,
  };
  mockDatabase.desktopCommands.set(id, command);
  return command;
}

/**
 * Cria um Desktop Screenshot mock
 */
export function createMockScreenshot(agentId: number, userId: number, data: Partial<any> = {}) {
  const id = nextId.desktopScreenshots++;
  const screenshot = {
    id,
    agentId,
    userId,
    url: data.url || `https://mock.s3.com/screenshot-${id}.png`,
    s3Key: data.s3Key || `screenshots/mock-${id}.png`,
    width: data.width || 1920,
    height: data.height || 1080,
    fileSize: data.fileSize || 245678,
    format: data.format || "png",
    createdAt: new Date(),
    ...data,
  };
  mockDatabase.desktopScreenshots.set(id, screenshot);
  return screenshot;
}

/**
 * Cria um Desktop Log mock
 */
export function createMockLog(agentId: number, userId: number, data: Partial<any> = {}) {
  const id = nextId.desktopLogs++;
  const log = {
    id,
    agentId,
    userId,
    commandId: data.commandId || null,
    level: data.level || "info",
    message: data.message || `Mock log message ${id}`,
    metadata: data.metadata || null,
    createdAt: new Date(),
    ...data,
  };
  mockDatabase.desktopLogs.set(id, log);
  return log;
}

/**
 * Cria uma Skill mock
 */
export function createMockSkill(data: Partial<any> = {}) {
  const id = nextId.skills++;
  const skill = {
    id,
    nome: data.nome || `mock-skill-${id}`,
    descricao: data.descricao || `Mock skill description ${id}`,
    categoria: data.categoria || "test",
    comandoPython: data.comandoPython || "print('mock')",
    parametros: data.parametros || "{}",
    exemplos: data.exemplos || "[]",
    tags: data.tags || "mock,test",
    versao: data.versao || "1.0.0",
    ativa: data.ativa !== undefined ? data.ativa : true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...data,
  };
  mockDatabase.skills.set(id, skill);
  return skill;
}

/**
 * Busca registros por critério
 */
export function findInMockDb<T>(
  table: keyof typeof mockDatabase,
  predicate: (item: T) => boolean
): T[] {
  const results: T[] = [];
  const map = mockDatabase[table] as Map<number, T>;
  for (const item of map.values()) {
    if (predicate(item)) {
      results.push(item);
    }
  }
  return results;
}

/**
 * Busca um único registro por ID
 */
export function findByIdInMockDb<T>(table: keyof typeof mockDatabase, id: number): T | null {
  const map = mockDatabase[table] as Map<number, T>;
  return map.get(id) || null;
}

/**
 * Atualiza um registro no mock
 */
export function updateInMockDb<T>(
  table: keyof typeof mockDatabase,
  id: number,
  updates: Partial<T>
): boolean {
  const map = mockDatabase[table] as Map<number, T>;
  const existing = map.get(id);
  if (!existing) return false;

  map.set(id, { ...existing, ...updates, updatedAt: new Date() });
  return true;
}

/**
 * Deleta um registro do mock
 */
export function deleteFromMockDb(table: keyof typeof mockDatabase, id: number): boolean {
  const map = mockDatabase[table];
  return map.delete(id);
}

/**
 * Retorna todos os registros de uma tabela
 */
export function getAllFromMockDb<T>(table: keyof typeof mockDatabase): T[] {
  const map = mockDatabase[table] as Map<number, T>;
  return Array.from(map.values());
}

/**
 * Mock da função getDb()
 */
export const getDb = vi.fn().mockResolvedValue(mockDb);
