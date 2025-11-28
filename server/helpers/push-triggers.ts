import { sendPushToUser } from "../routers/push-notifications";

/**
 * Helpers para disparar notificações push em eventos do sistema
 */

/**
 * Notifica sobre nova mensagem WhatsApp
 */
export async function notifyWhatsAppMessage(
  userId: number,
  data: {
    sender: string;
    message: string;
    timestamp: Date;
  }
) {
  return sendPushToUser(userId, "whatsapp_message", {
    title: `💬 Nova mensagem de ${data.sender}`,
    body: data.message.substring(0, 100) + (data.message.length > 100 ? "..." : ""),
    icon: "/icon-whatsapp.png",
    data: {
      url: "/whatsapp",
      type: "whatsapp_message",
      sender: data.sender,
      timestamp: data.timestamp.toISOString(),
    },
  });
}

/**
 * Notifica sobre tarefa concluída
 */
export async function notifyTaskCompleted(
  userId: number,
  data: {
    taskName: string;
    result: string;
    duration?: number;
  }
) {
  return sendPushToUser(userId, "task_completed", {
    title: `✅ Tarefa concluída: ${data.taskName}`,
    body: data.result,
    icon: "/icon-task.png",
    data: {
      url: "/control",
      type: "task_completed",
      taskName: data.taskName,
      duration: data.duration,
    },
  });
}

/**
 * Notifica sobre alerta de sistema
 */
export async function notifySystemAlert(
  userId: number,
  data: {
    alertType: "error" | "warning" | "info";
    title: string;
    message: string;
    url?: string;
  }
) {
  const icons = {
    error: "🚨",
    warning: "⚠️",
    info: "ℹ️",
  };

  return sendPushToUser(userId, "system_alert", {
    title: `${icons[data.alertType]} ${data.title}`,
    body: data.message,
    icon: "/icon-alert.png",
    data: {
      url: data.url || "/control",
      type: "system_alert",
      alertType: data.alertType,
    },
  });
}

/**
 * Notifica sobre comando desktop finalizado
 */
export async function notifyDesktopCommand(
  userId: number,
  data: {
    command: string;
    status: "success" | "error";
    output?: string;
  }
) {
  const statusIcon = data.status === "success" ? "✅" : "❌";
  const statusText = data.status === "success" ? "concluído" : "falhou";

  return sendPushToUser(userId, "desktop_command", {
    title: `${statusIcon} Comando ${statusText}`,
    body: data.output || data.command,
    icon: "/icon-desktop.png",
    data: {
      url: "/desktop",
      type: "desktop_command",
      command: data.command,
      status: data.status,
    },
  });
}

/**
 * Notifica sobre sync Obsidian concluído
 */
export async function notifyObsidianSync(
  userId: number,
  data: {
    vaultName: string;
    notesCount: number;
    status: "success" | "error";
    message?: string;
  }
) {
  const statusIcon = data.status === "success" ? "✅" : "❌";

  return sendPushToUser(userId, "obsidian_sync", {
    title: `${statusIcon} Sync Obsidian: ${data.vaultName}`,
    body: data.message || `${data.notesCount} notas sincronizadas`,
    icon: "/icon-obsidian.png",
    data: {
      url: "/obsidian",
      type: "obsidian_sync",
      vaultName: data.vaultName,
      notesCount: data.notesCount,
      status: data.status,
    },
  });
}

/**
 * Notifica sobre erro crítico que requer atenção
 */
export async function notifyCriticalError(
  userId: number,
  data: {
    component: string;
    error: string;
    stackTrace?: string;
  }
) {
  return sendPushToUser(userId, "system_alert", {
    title: `🚨 Erro Crítico: ${data.component}`,
    body: data.error,
    icon: "/icon-error.png",
    badge: "/badge-error.png",
    data: {
      url: "/control",
      type: "critical_error",
      component: data.component,
      error: data.error,
      stackTrace: data.stackTrace,
    },
  });
}

/**
 * Notifica sobre backup concluído
 */
export async function notifyBackupCompleted(
  userId: number,
  data: {
    backupType: string;
    filesCount: number;
    size: string;
  }
) {
  return sendPushToUser(userId, "task_completed", {
    title: `💾 Backup concluído: ${data.backupType}`,
    body: `${data.filesCount} arquivos (${data.size})`,
    icon: "/icon-backup.png",
    data: {
      url: "/control",
      type: "backup_completed",
      backupType: data.backupType,
      filesCount: data.filesCount,
      size: data.size,
    },
  });
}

/**
 * Notifica sobre atualização disponível
 */
export async function notifyUpdateAvailable(
  userId: number,
  data: {
    component: string;
    currentVersion: string;
    newVersion: string;
    releaseNotes?: string;
  }
) {
  return sendPushToUser(userId, "system_alert", {
    title: `🔄 Atualização disponível: ${data.component}`,
    body: `Versão ${data.newVersion} disponível (atual: ${data.currentVersion})`,
    icon: "/icon-update.png",
    data: {
      url: "/control",
      type: "update_available",
      component: data.component,
      currentVersion: data.currentVersion,
      newVersion: data.newVersion,
      releaseNotes: data.releaseNotes,
    },
  });
}
