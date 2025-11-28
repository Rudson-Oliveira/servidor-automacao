/**
 * Serviço de Build Automático do Instalador Windows
 * 
 * Responsável por:
 * - Compilar automaticamente o instalador .exe
 * - Gerenciar cache de versões compiladas
 * - Detectar mudanças no código e recompilar
 * - Fornecer download direto do instalador
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

interface BuildInfo {
  version: string;
  hash: string;
  buildDate: Date;
  filePath: string;
  fileSize: number;
}

class InstallerBuilder {
  private buildDir: string;
  private cacheFile: string;
  private currentBuild: BuildInfo | null = null;
  private isBuilding = false;

  constructor() {
    this.buildDir = path.join(process.cwd(), 'dist', 'installer');
    this.cacheFile = path.join(this.buildDir, 'build-info.json');
  }

  /**
   * Inicializa o serviço de build
   */
  async initialize(): Promise<void> {
    // Criar diretório de build se não existir
    await fs.mkdir(this.buildDir, { recursive: true });

    // Carregar informações do último build
    await this.loadBuildInfo();

    // Verificar se precisa recompilar
    const needsRebuild = await this.checkIfNeedsRebuild();
    
    if (needsRebuild) {
      console.log('[InstallerBuilder] ⚠️  Instalador desatualizado ou inexistente.');
      console.log('[InstallerBuilder] 💡 Será compilado automaticamente no primeiro download.');
    } else {
      console.log('[InstallerBuilder] ✅ Instalador já está atualizado.');
    }
  }

  /**
   * Carrega informações do último build
   */
  private async loadBuildInfo(): Promise<void> {
    try {
      if (existsSync(this.cacheFile)) {
        const data = await fs.readFile(this.cacheFile, 'utf-8');
        this.currentBuild = JSON.parse(data);
        console.log(`[InstallerBuilder] Build existente encontrado: v${this.currentBuild?.version}`);
      }
    } catch (error) {
      console.warn('[InstallerBuilder] Não foi possível carregar informações do build:', error);
      this.currentBuild = null;
    }
  }

  /**
   * Salva informações do build atual
   */
  private async saveBuildInfo(info: BuildInfo): Promise<void> {
    await fs.writeFile(this.cacheFile, JSON.stringify(info, null, 2));
    this.currentBuild = info;
  }

  /**
   * Calcula hash do código-fonte para detectar mudanças
   */
  private async calculateSourceHash(): Promise<string> {
    const hash = crypto.createHash('sha256');
    
    // Arquivos importantes para detectar mudanças
    const filesToHash = [
      'package.json',
      'server/_core/index.ts',
      'server/routers.ts',
      'server/db.ts',
    ];

    for (const file of filesToHash) {
      const filePath = path.join(process.cwd(), file);
      if (existsSync(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        hash.update(content);
      }
    }

    return hash.digest('hex');
  }

  /**
   * Verifica se precisa recompilar
   */
  private async checkIfNeedsRebuild(): Promise<boolean> {
    // Se não há build anterior, precisa compilar
    if (!this.currentBuild) {
      return true;
    }

    // Se o arquivo do instalador não existe, precisa compilar
    if (!existsSync(this.currentBuild.filePath)) {
      return true;
    }

    // Calcular hash atual do código
    const currentHash = await this.calculateSourceHash();

    // Se o hash mudou, precisa recompilar
    if (currentHash !== this.currentBuild.hash) {
      console.log('[InstallerBuilder] Hash mudou:', {
        anterior: this.currentBuild.hash.substring(0, 8),
        atual: currentHash.substring(0, 8),
      });
      return true;
    }

    return false;
  }

  /**
   * Compila o instalador Windows
   */
  async buildInstaller(): Promise<BuildInfo> {
    if (this.isBuilding) {
      throw new Error('Build já está em andamento');
    }

    this.isBuilding = true;

    try {
      console.log('[InstallerBuilder] Iniciando compilação do instalador...');

      // Calcular versão baseada na data
      const version = new Date().toISOString().split('T')[0].replace(/-/g, '.');
      const outputPath = path.join(this.buildDir, `servidor-automacao-v${version}.exe`);

      // Executar build com pkg
      console.log('[InstallerBuilder] Executando pkg...');
      
      const pkgCommand = `npx pkg . --targets node18-win-x64 --output "${outputPath}" --compress GZip`;
      
      const { stdout, stderr } = await execAsync(pkgCommand, {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stdout) console.log('[InstallerBuilder] stdout:', stdout);
      if (stderr) console.warn('[InstallerBuilder] stderr:', stderr);

      // Verificar se o arquivo foi criado
      if (!existsSync(outputPath)) {
        throw new Error('Arquivo .exe não foi criado');
      }

      // Obter informações do arquivo
      const stats = await fs.stat(outputPath);
      const hash = await this.calculateSourceHash();

      const buildInfo: BuildInfo = {
        version,
        hash,
        buildDate: new Date(),
        filePath: outputPath,
        fileSize: stats.size,
      };

      // Salvar informações do build
      await this.saveBuildInfo(buildInfo);

      console.log('[InstallerBuilder] ✅ Build concluído com sucesso!');
      console.log(`[InstallerBuilder] Arquivo: ${outputPath}`);
      console.log(`[InstallerBuilder] Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      return buildInfo;

    } catch (error) {
      console.error('[InstallerBuilder] ❌ Erro ao compilar instalador:', error);
      throw error;
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Retorna informações do build atual
   */
  getCurrentBuild(): BuildInfo | null {
    return this.currentBuild;
  }

  /**
   * Retorna o caminho do instalador
   */
  getInstallerPath(): string | null {
    return this.currentBuild?.filePath || null;
  }

  /**
   * Força recompilação do instalador
   */
  async forceBuild(): Promise<BuildInfo> {
    console.log('[InstallerBuilder] Build forçado solicitado...');
    return await this.buildInstaller();
  }

  /**
   * Verifica status do build
   */
  getStatus() {
    return {
      isBuilding: this.isBuilding,
      currentBuild: this.currentBuild,
      hasInstaller: this.currentBuild !== null && existsSync(this.currentBuild.filePath),
    };
  }

  /**
   * Garante que o instalador está disponível
   * Compila automaticamente se necessário
   */
  async ensureInstaller(): Promise<BuildInfo> {
    // Se já existe e está atualizado, retorna
    const needsRebuild = await this.checkIfNeedsRebuild();
    
    if (!needsRebuild && this.currentBuild) {
      return this.currentBuild;
    }

    // Se já está compilando, aguarda
    if (this.isBuilding) {
      console.log('[InstallerBuilder] Build já em andamento, aguardando...');
      // Aguarda até 5 minutos
      const maxWait = 5 * 60 * 1000; // 5 minutos
      const checkInterval = 1000; // 1 segundo
      let waited = 0;

      while (this.isBuilding && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }

      if (this.currentBuild) {
        return this.currentBuild;
      }
    }

    // Compila o instalador
    return await this.buildInstaller();
  }
}

// Instância singleton
export const installerBuilder = new InstallerBuilder();

// Inicializar automaticamente quando o servidor iniciar
installerBuilder.initialize().catch(error => {
  console.error('[InstallerBuilder] Erro na inicialização:', error);
});
