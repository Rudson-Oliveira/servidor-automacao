import { describe, expect, it, beforeEach } from "vitest";
import { NotificationService } from "../client/src/services/NotificationService";

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe("showDownloadStart", () => {
    it("deve criar notificação de início de download para desktop", () => {
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      
      expect(id).toBeTruthy();
      expect(id).toMatch(/^download-\d+-\d+$/);
      
      const history = service.getNotificationHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        id,
        type: "desktop",
        status: "iniciado",
        fileName: "cometa.exe",
        fileSize: "15MB",
      });
    });

    it("deve criar notificação de início de download para extension", () => {
      const id = service.showDownloadStart("extension", "browser-extension.zip", "50KB");
      
      expect(id).toBeTruthy();
      
      const history = service.getNotificationHistory();
      expect(history[0]).toMatchObject({
        type: "extension",
        fileName: "browser-extension.zip",
        fileSize: "50KB",
      });
    });

    it("deve gerar IDs únicos para múltiplos downloads", () => {
      const id1 = service.showDownloadStart("desktop", "file1.exe", "10MB");
      const id2 = service.showDownloadStart("desktop", "file2.exe", "20MB");
      
      expect(id1).not.toBe(id2);
      expect(service.getNotificationHistory()).toHaveLength(2);
    });
  });

  describe("updateDownloadProgress", () => {
    it("deve atualizar progresso de download existente", () => {
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      
      service.updateDownloadProgress(id, 50);
      
      const history = service.getNotificationHistory();
      expect(history[0]).toMatchObject({
        status: "progresso",
        progress: 50,
      });
    });

    it("deve permitir múltiplas atualizações de progresso", () => {
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      
      service.updateDownloadProgress(id, 25);
      service.updateDownloadProgress(id, 50);
      service.updateDownloadProgress(id, 75);
      service.updateDownloadProgress(id, 100);
      
      const history = service.getNotificationHistory();
      expect(history[0]?.progress).toBe(100);
    });

    it("não deve falhar ao atualizar notificação inexistente", () => {
      expect(() => {
        service.updateDownloadProgress("invalid-id", 50);
      }).not.toThrow();
    });
  });

  describe("showDownloadComplete", () => {
    it("deve marcar download como concluído", () => {
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      
      service.showDownloadComplete(id);
      
      const history = service.getNotificationHistory();
      expect(history[0]?.status).toBe("concluido");
    });

    it("não deve falhar ao concluir notificação inexistente", () => {
      expect(() => {
        service.showDownloadComplete("invalid-id");
      }).not.toThrow();
    });
  });

  describe("showDownloadError", () => {
    it("deve marcar download como erro", () => {
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      
      service.showDownloadError(id, "Falha na conexão");
      
      const history = service.getNotificationHistory();
      expect(history[0]?.status).toBe("erro");
    });

    it("não deve falhar ao registrar erro de notificação inexistente", () => {
      expect(() => {
        service.showDownloadError("invalid-id", "Erro teste");
      }).not.toThrow();
    });
  });

  describe("getNotificationHistory", () => {
    it("deve retornar histórico vazio inicialmente", () => {
      expect(service.getNotificationHistory()).toHaveLength(0);
    });

    it("deve retornar todas as notificações criadas", () => {
      service.showDownloadStart("desktop", "file1.exe", "10MB");
      service.showDownloadStart("extension", "file2.zip", "5MB");
      service.showDownloadStart("desktop", "file3.exe", "20MB");
      
      expect(service.getNotificationHistory()).toHaveLength(3);
    });
  });

  describe("clearHistory", () => {
    it("deve limpar todo o histórico de notificações", () => {
      service.showDownloadStart("desktop", "file1.exe", "10MB");
      service.showDownloadStart("extension", "file2.zip", "5MB");
      
      expect(service.getNotificationHistory()).toHaveLength(2);
      
      service.clearHistory();
      
      expect(service.getNotificationHistory()).toHaveLength(0);
    });
  });

  describe("Fluxo completo de download", () => {
    it("deve simular fluxo completo de download bem-sucedido", () => {
      // Início
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      expect(service.getNotificationHistory()[0]?.status).toBe("iniciado");
      
      // Progresso
      service.updateDownloadProgress(id, 25);
      service.updateDownloadProgress(id, 50);
      service.updateDownloadProgress(id, 75);
      expect(service.getNotificationHistory()[0]?.status).toBe("progresso");
      
      // Conclusão
      service.showDownloadComplete(id);
      expect(service.getNotificationHistory()[0]?.status).toBe("concluido");
    });

    it("deve simular fluxo de download com erro", () => {
      // Início
      const id = service.showDownloadStart("extension", "browser-extension.zip", "50KB");
      expect(service.getNotificationHistory()[0]?.status).toBe("iniciado");
      
      // Progresso parcial
      service.updateDownloadProgress(id, 30);
      
      // Erro
      service.showDownloadError(id, "Conexão perdida");
      expect(service.getNotificationHistory()[0]?.status).toBe("erro");
    });
  });

  describe("Timestamp", () => {
    it("deve registrar timestamp ao criar notificação", () => {
      const beforeTime = new Date();
      const id = service.showDownloadStart("desktop", "cometa.exe", "15MB");
      const afterTime = new Date();
      
      const notification = service.getNotificationHistory()[0];
      expect(notification?.timestamp).toBeInstanceOf(Date);
      expect(notification?.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(notification?.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
