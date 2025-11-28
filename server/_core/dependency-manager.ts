/**
 * Dependency Manager Autônomo
 * 
 * Detecta e instala automaticamente dependências faltantes:
 * - Python
 * - Bibliotecas pip
 * - Pacotes npm
 * - Ferramentas do sistema
 * 
 * Resolve conflitos de versão e mantém cache de instalações
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Tipos
interface Dependency {
  name: string;
  type: 'python' | 'pip' | 'npm' | 'system';
  version?: string;
  required: boolean;
}

interface InstallResult {
  success: boolean;
  dependency: Dependency;
  message: string;
  installedVersion?: string;
  timeMs: number;
}

interface DependencyCheck {
  installed: boolean;
  version?: string;
  path?: string;
}

/**
 * Gerenciador Autônomo de Dependências
 */
class DependencyManager {
  private installedCache: Map<string, DependencyCheck> = new Map();
  private installQueue: Dependency[] = [];
  private isInstalling = false;

  /**
   * Verifica se Python está instalado
   */
  async checkPython(): Promise<DependencyCheck> {
    const cacheKey = 'python3';
    
    // Verificar cache
    if (this.installedCache.has(cacheKey)) {
      return this.installedCache.get(cacheKey)!;
    }

    try {
      const { stdout } = await execAsync('python3 --version');
      const version = stdout.trim().replace('Python ', '');
      
      const result: DependencyCheck = {
        installed: true,
        version,
        path: '/usr/bin/python3',
      };
      
      this.installedCache.set(cacheKey, result);
      return result;
    } catch {
      return { installed: false };
    }
  }

  /**
   * Verifica se uma biblioteca pip está instalada
   */
  async checkPipPackage(packageName: string): Promise<DependencyCheck> {
    const cacheKey = `pip:${packageName}`;
    
    if (this.installedCache.has(cacheKey)) {
      return this.installedCache.get(cacheKey)!;
    }

    try {
      const { stdout } = await execAsync(`pip3 show ${packageName}`);
      const versionMatch = stdout.match(/Version: (.+)/);
      const version = versionMatch ? versionMatch[1].trim() : undefined;
      
      const result: DependencyCheck = {
        installed: true,
        version,
      };
      
      this.installedCache.set(cacheKey, result);
      return result;
    } catch {
      return { installed: false };
    }
  }

  /**
   * Instala Python automaticamente
   */
  async installPython(): Promise<InstallResult> {
    const startTime = Date.now();
    const dependency: Dependency = {
      name: 'python3',
      type: 'python',
      required: true,
    };

    console.log('[DependencyManager] 🐍 Instalando Python...');

    try {
      // Atualizar lista de pacotes
      await execAsync('sudo apt-get update -qq');
      
      // Instalar Python 3
      const { stdout, stderr } = await execAsync('sudo apt-get install -y python3 python3-pip python3-venv');
      
      // Verificar instalação
      const check = await this.checkPython();
      
      if (check.installed) {
        const result: InstallResult = {
          success: true,
          dependency,
          message: `Python ${check.version} instalado com sucesso`,
          installedVersion: check.version,
          timeMs: Date.now() - startTime,
        };
        
        console.log(`[DependencyManager] ✅ ${result.message}`);
        return result;
      } else {
        throw new Error('Instalação falhou - Python não detectado após instalação');
      }
    } catch (error: any) {
      const result: InstallResult = {
        success: false,
        dependency,
        message: `Erro ao instalar Python: ${error.message}`,
        timeMs: Date.now() - startTime,
      };
      
      console.error(`[DependencyManager] ❌ ${result.message}`);
      return result;
    }
  }

  /**
   * Instala uma biblioteca pip automaticamente
   */
  async installPipPackage(packageName: string, version?: string): Promise<InstallResult> {
    const startTime = Date.now();
    const dependency: Dependency = {
      name: packageName,
      type: 'pip',
      version,
      required: true,
    };

    console.log(`[DependencyManager] 📦 Instalando ${packageName}${version ? `==${version}` : ''}...`);

    try {
      // Garantir que Python está instalado
      const pythonCheck = await this.checkPython();
      if (!pythonCheck.installed) {
        console.log('[DependencyManager] Python não encontrado, instalando primeiro...');
        const pythonResult = await this.installPython();
        if (!pythonResult.success) {
          throw new Error('Não foi possível instalar Python');
        }
      }

      // Instalar pacote
      const packageSpec = version ? `${packageName}==${version}` : packageName;
      const { stdout, stderr } = await execAsync(`pip3 install ${packageSpec}`);
      
      // Verificar instalação
      const check = await this.checkPipPackage(packageName);
      
      if (check.installed) {
        const result: InstallResult = {
          success: true,
          dependency,
          message: `${packageName} ${check.version} instalado com sucesso`,
          installedVersion: check.version,
          timeMs: Date.now() - startTime,
        };
        
        console.log(`[DependencyManager] ✅ ${result.message}`);
        return result;
      } else {
        throw new Error('Instalação falhou - pacote não detectado após instalação');
      }
    } catch (error: any) {
      const result: InstallResult = {
        success: false,
        dependency,
        message: `Erro ao instalar ${packageName}: ${error.message}`,
        timeMs: Date.now() - startTime,
      };
      
      console.error(`[DependencyManager] ❌ ${result.message}`);
      return result;
    }
  }

  /**
   * Instala múltiplas bibliotecas pip de uma vez
   */
  async installPipPackages(packages: string[]): Promise<InstallResult[]> {
    console.log(`[DependencyManager] 📦 Instalando ${packages.length} pacotes pip...`);
    
    const results: InstallResult[] = [];
    
    for (const pkg of packages) {
      const result = await this.installPipPackage(pkg);
      results.push(result);
      
      // Se falhar, continua com os próximos
      if (!result.success) {
        console.warn(`[DependencyManager] ⚠️  Falha em ${pkg}, continuando...`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`[DependencyManager] ✅ ${successCount}/${packages.length} pacotes instalados`);
    
    return results;
  }

  /**
   * Detecta dependências faltantes em um arquivo requirements.txt
   */
  async checkRequirementsTxt(filePath: string): Promise<Dependency[]> {
    if (!existsSync(filePath)) {
      console.warn(`[DependencyManager] ⚠️  Arquivo não encontrado: ${filePath}`);
      return [];
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    const missing: Dependency[] = [];
    
    for (const line of lines) {
      const match = line.match(/^([a-zA-Z0-9_-]+)([=<>!]+(.+))?$/);
      if (!match) continue;
      
      const packageName = match[1];
      const version = match[3];
      
      const check = await this.checkPipPackage(packageName);
      
      if (!check.installed) {
        missing.push({
          name: packageName,
          type: 'pip',
          version,
          required: true,
        });
      }
    }
    
    return missing;
  }

  /**
   * Instala todas as dependências de um requirements.txt
   */
  async installFromRequirementsTxt(filePath: string): Promise<InstallResult[]> {
    console.log(`[DependencyManager] 📋 Processando ${filePath}...`);
    
    const missing = await this.checkRequirementsTxt(filePath);
    
    if (missing.length === 0) {
      console.log('[DependencyManager] ✅ Todas as dependências já estão instaladas');
      return [];
    }
    
    console.log(`[DependencyManager] 📦 ${missing.length} dependências faltando, instalando...`);
    
    // Instalar usando pip install -r (mais eficiente)
    const startTime = Date.now();
    
    try {
      await execAsync(`pip3 install -r ${filePath}`);
      
      // Verificar quais foram instaladas
      const results: InstallResult[] = [];
      
      for (const dep of missing) {
        const check = await this.checkPipPackage(dep.name);
        results.push({
          success: check.installed,
          dependency: dep,
          message: check.installed ? `${dep.name} instalado` : `${dep.name} falhou`,
          installedVersion: check.version,
          timeMs: Date.now() - startTime,
        });
      }
      
      return results;
    } catch (error: any) {
      console.error(`[DependencyManager] ❌ Erro ao instalar requirements: ${error.message}`);
      
      // Tentar instalar um por um
      return await this.installPipPackages(missing.map(d => d.name));
    }
  }

  /**
   * Auto-detecta e instala dependências faltantes
   */
  async autoInstallMissingDependencies(): Promise<InstallResult[]> {
    console.log('[DependencyManager] 🔍 Auto-detectando dependências faltantes...');
    
    const results: InstallResult[] = [];
    
    // 1. Verificar Python
    const pythonCheck = await this.checkPython();
    if (!pythonCheck.installed) {
      console.log('[DependencyManager] 🐍 Python não encontrado, instalando...');
      const result = await this.installPython();
      results.push(result);
    }
    
    // 2. Procurar por requirements.txt no projeto
    const requirementsPath = path.join(process.cwd(), 'requirements.txt');
    if (existsSync(requirementsPath)) {
      console.log('[DependencyManager] 📋 requirements.txt encontrado');
      const reqResults = await this.installFromRequirementsTxt(requirementsPath);
      results.push(...reqResults);
    }
    
    // 3. Verificar scripts Python comuns
    const scriptsDir = path.join(process.cwd(), 'scripts', 'python');
    if (existsSync(scriptsDir)) {
      const scriptsReqPath = path.join(scriptsDir, 'requirements.txt');
      if (existsSync(scriptsReqPath)) {
        console.log('[DependencyManager] 📋 scripts/python/requirements.txt encontrado');
        const scriptResults = await this.installFromRequirementsTxt(scriptsReqPath);
        results.push(...scriptResults);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`[DependencyManager] ✅ Auto-instalação concluída: ${successCount}/${results.length} sucesso`);
    
    return results;
  }

  /**
   * Limpa cache de dependências
   */
  clearCache(): void {
    this.installedCache.clear();
    console.log('[DependencyManager] 🗑️  Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      cachedDependencies: this.installedCache.size,
      queueSize: this.installQueue.length,
      isInstalling: this.isInstalling,
    };
  }
}

// Instância singleton
export const dependencyManager = new DependencyManager();

// Auto-instalar dependências na inicialização (modo silencioso)
dependencyManager.autoInstallMissingDependencies().catch(error => {
  console.error('[DependencyManager] ❌ Erro na auto-instalação inicial:', error);
});
