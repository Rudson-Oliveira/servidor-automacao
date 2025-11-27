import * as cron from "node-cron";
import * as dbObsidian from "../db-obsidian";

/**
 * 🔄 SERVIÇO DE SINCRONIZAÇÃO OBSIDIAN
 * 
 * Gerencia sincronização automática de vaults
 * Detecta conflitos e aplica estratégias de resolução
 */

interface SyncResult {
  vaultId: number;
  novos: number;
  modificados: number;
  deletados: number;
  conflitos: number;
  timestamp: Date;
}

// Armazenar jobs ativos
const activeJobs = new Map<number, ReturnType<typeof cron.schedule>>();

/**
 * Iniciar sincronização automática para um vault
 */
export function startAutoSync(vaultId: number, intervalMinutes: number = 5) {
  // Parar job existente se houver
  stopAutoSync(vaultId);

  // Criar expressão cron (a cada X minutos)
  const cronExpression = `*/${intervalMinutes} * * * *`;

  const job = cron.schedule(cronExpression, async () => {
    console.log(`[ObsidianSync] Iniciando sync automático para vault ${vaultId}`);
    try {
      await syncVault(vaultId);
    } catch (error) {
      console.error(`[ObsidianSync] Erro no sync do vault ${vaultId}:`, error);
    }
  });

  activeJobs.set(vaultId, job);
  console.log(`[ObsidianSync] Auto-sync iniciado para vault ${vaultId} (a cada ${intervalMinutes} min)`);
}

/**
 * Parar sincronização automática para um vault
 */
export function stopAutoSync(vaultId: number) {
  const job = activeJobs.get(vaultId);
  if (job) {
    job.stop();
    activeJobs.delete(vaultId);
    console.log(`[ObsidianSync] Auto-sync parado para vault ${vaultId}`);
  }
}

/**
 * Sincronizar vault manualmente
 */
export async function syncVault(vaultId: number): Promise<SyncResult> {
  const startTime = Date.now();

  // Obter configuração de sync
  const config = await dbObsidian.getSyncConfig(vaultId);
  if (!config) {
    throw new Error("Configuração de sync não encontrada");
  }

  // Obter vault do banco
  const vault = await dbObsidian.getVaultById(vaultId);
  if (!vault || !vault.caminho) {
    throw new Error("Vault não encontrado ou sem caminho configurado");
  }

  // Ler arquivos .md do filesystem
  const fs = await import('fs/promises');
  const path = await import('path');
  const crypto = await import('crypto');

  let novos = 0;
  let modificados = 0;
  let deletados = 0;
  let conflitos = 0;

  try {
    // Verificar se o diretório existe
    await fs.access(vault.caminho);

    // Ler todos os arquivos .md recursivamente
    const arquivosMd: Array<{ caminho: string; conteudo: string; hash: string }> = [];
    
    const lerDiretorioRecursivo = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Ignorar diretórios ocultos e .obsidian
          if (!entry.name.startsWith('.') && entry.name !== '.obsidian') {
            await lerDiretorioRecursivo(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const conteudo = await fs.readFile(fullPath, 'utf-8');
          const hash = crypto.createHash('sha256').update(conteudo).digest('hex');
          const caminhoRelativo = path.relative(vault.caminho!, fullPath);
          
          arquivosMd.push({
            caminho: '/' + caminhoRelativo.replace(/\\/g, '/'),
            conteudo,
            hash,
          });
        }
      }
    }

    await lerDiretorioRecursivo(vault.caminho!);

    // Obter notas atuais do banco
    const notasAtuais = await dbObsidian.getNotasByVault(vaultId);
    const notasMap = new Map(notasAtuais.map(n => [n.caminho, n]));
    const arquivosMap = new Map(arquivosMd.map(a => [a.caminho, a]));

    // Detectar novas notas (existem no filesystem mas não no banco)
    for (const arquivo of arquivosMd) {
      const notaExistente = notasMap.get(arquivo.caminho);
      
      if (!notaExistente) {
        // Nota nova - criar no banco
        const titulo = path.basename(arquivo.caminho, '.md');
        await dbObsidian.createNota({
          vaultId,
          titulo,
          caminho: arquivo.caminho,
          conteudo: arquivo.conteudo,
          ultimaModificacao: new Date(),
          ultimoSync: new Date(),
        });
        novos++;
      } else if (notaExistente.hash !== arquivo.hash) {
        // Nota modificada - verificar conflito
        if (notaExistente.ultimaModificacao && notaExistente.ultimaModificacao > notaExistente.ultimoSync!) {
          // Conflito: modificada tanto localmente quanto no filesystem
          conflitos++;
          
          // Aplicar estratégia de resolução
          if (config.resolucaoConflito === 'remoto_vence' || config.resolucaoConflito === 'mais_recente_vence') {
            await dbObsidian.updateNota(notaExistente.id, {
              conteudo: arquivo.conteudo,
              ultimoSync: new Date(),
            });
          }
          // Se 'local_vence', não faz nada
          // Se 'manual', apenas incrementa contador de conflitos
        } else {
          // Não há conflito - atualizar do filesystem
          await dbObsidian.updateNota(notaExistente.id, {
            conteudo: arquivo.conteudo,
            ultimoSync: new Date(),
          });
          modificados++;
        }
      }
    }

    // Detectar notas deletadas (existem no banco mas não no filesystem)
    for (const nota of notasAtuais) {
      if (!arquivosMap.has(nota.caminho)) {
        await dbObsidian.deleteNota(nota.id);
        deletados++;
      }
    }

    // Atualizar timestamp de sync do vault
    await dbObsidian.updateVaultSync(vaultId);

  } catch (error: any) {
    console.error(`[ObsidianSync] Erro ao acessar filesystem:`, error);
    throw new Error(`Erro ao sincronizar vault: ${error.message}`);
  }

  const result: SyncResult = {
    vaultId,
    novos,
    modificados,
    deletados,
    conflitos,
    timestamp: new Date(),
  };

  const duration = Date.now() - startTime;
  console.log(`[ObsidianSync] Sync concluído para vault ${vaultId} em ${duration}ms`);

  return result;
}

/**
 * Detectar conflitos entre notas locais e remotas
 */
export async function detectConflicts(
  vaultId: number,
  externalNotes: Array<{ caminho: string; hash: string }>
) {
  const diff = await dbObsidian.detectChanges(vaultId, externalNotes);
  
  // Conflitos são notas que foram modificadas tanto localmente quanto remotamente
  const conflicts = diff.modificados.filter(async (caminho) => {
    const nota = await dbObsidian.getNotasByVault(vaultId);
    const notaLocal = nota.find(n => n.caminho === caminho);
    if (!notaLocal) return false;

    // Verificar se foi modificada localmente desde o último sync
    const vault = await dbObsidian.getVaultsByUser(0); // TODO: passar userId correto
    const vaultData = vault.find(v => v.id === vaultId);
    if (!vaultData?.ultimoSync) return false;

    return notaLocal.ultimaModificacao > vaultData.ultimoSync;
  });

  return conflicts;
}

/**
 * Resolver conflito usando estratégia configurada
 */
export async function resolveConflict(
  vaultId: number,
  notaId: number,
  strategy: "manual" | "local-wins" | "remote-wins",
  remoteContent?: string
) {
  const config = await dbObsidian.getSyncConfig(vaultId);
  if (!config) {
    throw new Error("Configuração de sync não encontrada");
  }

  switch (strategy) {
    case "local-wins":
      // Manter versão local, ignorar remota
      console.log(`[ObsidianSync] Conflito resolvido: local-wins para nota ${notaId}`);
      break;

    case "remote-wins":
      // Sobrescrever com versão remota
      if (remoteContent) {
        await dbObsidian.updateNota(notaId, { conteudo: remoteContent });
        console.log(`[ObsidianSync] Conflito resolvido: remote-wins para nota ${notaId}`);
      }
      break;

    case "manual":
      // Criar versão de conflito para resolução manual
      console.log(`[ObsidianSync] Conflito marcado para resolução manual: nota ${notaId}`);
      // TODO: Criar nota de conflito ou flag
      break;
  }
}

/**
 * Obter status de sincronização de um vault
 */
export function getSyncStatus(vaultId: number) {
  const isActive = activeJobs.has(vaultId);
  return {
    active: isActive,
    vaultId,
  };
}

/**
 * Inicializar serviço de sincronização
 * Carrega todos os vaults com sync automático ativado
 */
export async function initializeSyncService() {
  console.log("[ObsidianSync] Inicializando serviço de sincronização...");

  // TODO: Carregar todos os vaults com syncAutomatico=true e iniciar jobs
  // Por enquanto, apenas log
  console.log("[ObsidianSync] Serviço de sincronização inicializado");
}

// Exportar para uso no servidor
export default {
  startAutoSync,
  stopAutoSync,
  syncVault,
  detectConflicts,
  resolveConflict,
  getSyncStatus,
  initializeSyncService,
};
