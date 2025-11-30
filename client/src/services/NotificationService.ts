import toast from 'react-hot-toast';

/**
 * Interface para notificações de download
 */
interface DownloadNotification {
  id: string;
  type: 'desktop' | 'extension';
  status: 'iniciado' | 'progresso' | 'concluido' | 'erro';
  fileName: string;
  fileSize: string;
  progress?: number;
  timestamp: Date;
}

/**
 * Serviço de notificações para downloads
 * Gerencia feedback visual aos usuários durante downloads de Desktop Agent e Browser Extension
 */
export class NotificationService {
  private notifications: Map<string, DownloadNotification> = new Map();
  private counter: number = 0;
  
  /**
   * Exibe notificação de início de download
   * @param type Tipo de download (desktop ou extension)
   * @param fileName Nome do arquivo
   * @param fileSize Tamanho do arquivo
   * @returns ID da notificação para rastreamento
   */
  showDownloadStart(type: 'desktop' | 'extension', fileName: string, fileSize: string): string {
    const id = `download-${Date.now()}-${++this.counter}`;
    const notification: DownloadNotification = {
      id,
      type,
      status: 'iniciado',
      fileName,
      fileSize,
      timestamp: new Date()
    };
    
    this.notifications.set(id, notification);
    
    toast.loading(`📥 Iniciando download: ${fileName} (${fileSize})`, {
      id,
      duration: 2000,
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
    
    return id;
  }
  
  /**
   * Atualiza progresso do download
   * @param id ID da notificação
   * @param progress Progresso em porcentagem (0-100)
   */
  updateDownloadProgress(id: string, progress: number): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.status = 'progresso';
      notification.progress = progress;
      
      toast.loading(`⏳ Download em andamento: ${progress}%`, {
        id,
        duration: Infinity,
        style: {
          background: '#3b82f6',
          color: '#fff',
        },
      });
    }
  }
  
  /**
   * Exibe notificação de download concluído com instruções para usuário leigo
   * @param id ID da notificação
   */
  showDownloadComplete(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.status = 'concluido';
      
      // Notificação de conclusão
      toast.success(`✅ Download concluído: ${notification.fileName}`, {
        id,
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      
      // Instruções para usuário leigo
      setTimeout(() => {
        if (notification.type === 'desktop') {
          toast.success(
            '💡 Próximo passo: Localize o arquivo na pasta Downloads e execute-o (duplo clique)',
            {
              duration: 8000,
              icon: '📂',
              style: {
                background: '#8b5cf6',
                color: '#fff',
                maxWidth: '500px',
              },
            }
          );
        } else {
          toast.success(
            '💡 Próximo passo: Abra chrome://extensions/ no navegador, ative "Modo do desenvolvedor" e arraste o arquivo .zip',
            {
              duration: 10000,
              icon: '🔧',
              style: {
                background: '#8b5cf6',
                color: '#fff',
                maxWidth: '500px',
              },
            }
          );
        }
      }, 1000);
    }
  }
  
  /**
   * Exibe notificação de erro no download
   * @param id ID da notificação
   * @param error Mensagem de erro
   */
  showDownloadError(id: string, error: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.status = 'erro';
      
      toast.error(`❌ Erro no download: ${error}`, {
        id,
        duration: 6000,
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
      
      // Sugestão de solução
      setTimeout(() => {
        toast.error(
          '💡 Tente novamente ou entre em contato com o suporte',
          {
            duration: 5000,
            icon: '🆘',
            style: {
              background: '#f59e0b',
              color: '#fff',
            },
          }
        );
      }, 1000);
    }
  }
  
  /**
   * Obtém histórico de notificações
   * @returns Array de notificações
   */
  getNotificationHistory(): DownloadNotification[] {
    return Array.from(this.notifications.values());
  }
  
  /**
   * Limpa histórico de notificações
   */
  clearHistory(): void {
    this.notifications.clear();
  }
}

// Exportar instância singleton
export const notificationService = new NotificationService();
