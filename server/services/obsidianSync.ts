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

  // TODO: Implementar lógica de sync real
  // Por enquanto, retorna resultado mockado
  const result: SyncResult = {
    vaultId,
    novos: 0,
    modificados: 0,
    deletados: 0,
    conflitos: 0,
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
