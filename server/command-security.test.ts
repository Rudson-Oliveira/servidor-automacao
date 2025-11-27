import { describe, expect, it } from "vitest";
import { validateCommand } from "./command-security";

describe("command-security", () => {
  describe("validateCommand - comandos perigosos", () => {
    it("deve bloquear rm -rf /", async () => {
      const result = await validateCommand("rm -rf /", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
      expect(result.reason).toContain("perigoso");
    });

    it("deve bloquear format", async () => {
      const result = await validateCommand("format C:", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });

    it("deve bloquear dd if=", async () => {
      const result = await validateCommand("dd if=/dev/zero of=/dev/sda", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });

    it("deve bloquear del /s /q", async () => {
      const result = await validateCommand("del /s /q C:\\", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });

    it("deve bloquear fork bomb", async () => {
      const result = await validateCommand(":(){ :|:& };:", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });

    it("deve bloquear shutdown", async () => {
      const result = await validateCommand("shutdown -h now", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });

    it("deve bloquear reboot", async () => {
      const result = await validateCommand("reboot", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });
  });

  describe("validateCommand - comandos que requerem confirmação", () => {
    it("deve requerer confirmação para rm -r", async () => {
      const result = await validateCommand("rm -r /home/user/folder", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.severity).toBe("medium");
    });

    it("deve requerer confirmação para del /s", async () => {
      const result = await validateCommand("del /s C:\\temp", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("deve requerer confirmação para git reset --hard", async () => {
      const result = await validateCommand("git reset --hard HEAD~5", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });

    it("deve requerer confirmação para git clean -fd", async () => {
      const result = await validateCommand("git clean -fd", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
    });
  });

  describe("validateCommand - comandos seguros", () => {
    it("deve permitir ls", async () => {
      const result = await validateCommand("ls -la", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir echo", async () => {
      const result = await validateCommand('echo "Hello World"', 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir pwd", async () => {
      const result = await validateCommand("pwd", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir cat", async () => {
      const result = await validateCommand("cat file.txt", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir mkdir", async () => {
      const result = await validateCommand("mkdir /tmp/test", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir cd", async () => {
      const result = await validateCommand("cd /home/user", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir npm install", async () => {
      const result = await validateCommand("npm install express", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });

    it("deve permitir git status", async () => {
      const result = await validateCommand("git status", 1, 1);

      expect(result.isAllowed).toBe(true);
      expect(result.requiresConfirmation).toBe(false);
    });
  });

  describe("validateCommand - edge cases", () => {
    it("deve lidar com comando vazio", async () => {
      const result = await validateCommand("", 1, 1);

      expect(result.isAllowed).toBe(true);
    });

    it("deve lidar com comando com múltiplos espaços", async () => {
      const result = await validateCommand("ls    -la", 1, 1);

      expect(result.isAllowed).toBe(true);
    });

    it("deve ser case-insensitive para comandos perigosos", async () => {
      const result = await validateCommand("SHUTDOWN -h now", 1, 1);

      expect(result.isAllowed).toBe(false);
      expect(result.severity).toBe("critical");
    });
  });
});
