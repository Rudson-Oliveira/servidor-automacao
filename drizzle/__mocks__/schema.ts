/**
 * Mock do schema Drizzle para testes
 * Simula tabelas sem dependências de banco de dados real
 */

// Mock simples das tabelas
export const desktopAgents = {
  id: "id",
  agentId: "agentId",
  userId: "userId",
  hostname: "hostname",
  machineId: "machineId",
  token: "token",
  status: "status",
  version: "version",
  os: "os",
  pythonVersion: "pythonVersion",
  lastSeen: "lastSeen",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};

export const users = {
  id: "id",
  openId: "openId",
  name: "name",
  email: "email",
  role: "role",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
};
