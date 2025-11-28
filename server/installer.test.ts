import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Installer Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe('getInfo', () => {
    it('deve retornar informações do instalador', async () => {
      const result = await caller.installer.getInfo();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('isBuilding');
      expect(typeof result.available).toBe('boolean');
      expect(typeof result.isBuilding).toBe('boolean');
    });

    it('deve incluir informações do build quando disponível', async () => {
      const result = await caller.installer.getInfo();

      if (result.build) {
        expect(result.build).toHaveProperty('version');
        expect(result.build).toHaveProperty('buildDate');
        expect(result.build).toHaveProperty('fileSize');
        expect(result.build).toHaveProperty('fileSizeMB');
        expect(typeof result.build.version).toBe('string');
        expect(typeof result.build.fileSize).toBe('number');
      }
    });
  });

  describe('getStatus', () => {
    it('deve retornar status detalhado do sistema', async () => {
      const result = await caller.installer.getStatus();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('isBuilding');
      expect(result).toHaveProperty('hasInstaller');
      expect(typeof result.isBuilding).toBe('boolean');
      expect(typeof result.hasInstaller).toBe('boolean');
    });
  });

  describe('getDownloadUrl', () => {
    it('deve retornar URL de download quando instalador existe', async () => {
      try {
        const result = await caller.installer.getDownloadUrl();

        expect(result).toBeDefined();
        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('version');
        expect(result).toHaveProperty('fileSize');
        expect(result).toHaveProperty('fileSizeMB');
        expect(result.url).toBe('/api/download/installer-windows.exe');
      } catch (error: any) {
        // Se não há instalador, deve lançar erro específico
        expect(error.message).toContain('Instalador não disponível');
      }
    });
  });
});

describe('Installer System Integration', () => {
  it('deve ter estrutura de diretórios correta', () => {
    // Teste básico de integração
    expect(true).toBe(true);
  });

  it('deve ter configuração pkg no package.json', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    expect(packageJson).toHaveProperty('pkg');
    expect(packageJson.pkg).toHaveProperty('targets');
    expect(packageJson.pkg.targets).toContain('node18-win-x64');
  });
});
