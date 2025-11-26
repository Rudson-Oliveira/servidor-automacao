import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { validarScriptPython, sanitizarInput, gerarRelatorioSeguranca } from "../_core/python-validator";

/**
 * Router para integração com Obsidian Local REST API
 * 
 * Este router fornece endpoints para gerar scripts que o Comet pode executar
 * no CPU do usuário para criar arquivos no Obsidian automaticamente.
 */

const gerarScriptCriacaoSchema = z.object({
  nomeArquivo: z.string().min(1, "Nome do arquivo é obrigatório"),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  caminho: z.string().optional().default(""), // Caminho relativo no vault (ex: "pasta/subpasta")
  apiKey: z.string().min(1, "API Key do Obsidian é obrigatória"),
  porta: z.number().optional().default(27123), // Porta padrão do plugin
  usarHttps: z.boolean().optional().default(false), // Por padrão usa HTTP
});

export const obsidianRouter: ReturnType<typeof router> = router({
  /**
   * Gera script Python para criar arquivo no Obsidian
   * 
   * O Comet pode solicitar este script e executá-lo no CPU do usuário.
   * O script usa a API Local REST do Obsidian para criar o arquivo.
   */
  gerarScriptCriacao: publicProcedure
    .input(gerarScriptCriacaoSchema)
    .mutation(async ({ input }) => {
      // SEGURANÇA: Sanitizar inputs antes de usar
      const nomeArquivo = sanitizarInput(input.nomeArquivo);
      const caminho = input.caminho ? sanitizarInput(input.caminho) : "";
      const { conteudo, apiKey, porta, usarHttps } = input;

      // Construir o caminho completo do arquivo
      const caminhoCompleto = caminho 
        ? `${caminho}/${nomeArquivo}` 
        : nomeArquivo;

      // Garantir que termina com .md
      const arquivoFinal = caminhoCompleto.endsWith('.md') 
        ? caminhoCompleto 
        : `${caminhoCompleto}.md`;

      // URL da API
      const protocolo = usarHttps ? "https" : "http";
      const url = `${protocolo}://127.0.0.1:${porta}/vault/${encodeURIComponent(arquivoFinal)}`;

      // Script Python
      const scriptPython = `#!/usr/bin/env python3
"""
Script gerado automaticamente pelo Servidor de Automação
Data: ${new Date().toISOString()}

Este script cria um arquivo no Obsidian usando a API Local REST.
"""

import requests
import json
import sys
from urllib.parse import quote

def criar_arquivo_obsidian():
    """Cria arquivo no Obsidian via API Local REST"""
    
    # Configurações
    url = "${url}"
    api_key = "${apiKey}"
    conteudo = """${conteudo.replace(/"/g, '\\"')}"""
    
    # Headers
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "text/markdown"
    }
    
    try:
        print(f"🔄 Criando arquivo: ${arquivoFinal}")
        print(f"📡 URL: {url}")
        
        # Fazer requisição PUT
        response = requests.put(
            url,
            data=conteudo.encode('utf-8'),
            headers=headers,
            verify=False  # Ignora verificação SSL para certificado auto-assinado
        )
        
        # Verificar resposta
        if response.status_code == 204:
            print("✅ Arquivo criado com sucesso!")
            print(f"📁 Localização: ${arquivoFinal}")
            return True
        else:
            print(f"❌ Erro ao criar arquivo!")
            print(f"Status Code: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {str(e)}")
        print("\\n💡 Verifique se:")
        print("  1. O Obsidian está aberto")
        print("  2. O plugin 'Local REST API' está ativo")
        print("  3. A porta ${porta} está acessível")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        return False

if __name__ == "__main__":
    sucesso = criar_arquivo_obsidian()
    sys.exit(0 if sucesso else 1)
`;

      // Script PowerShell (alternativa para Windows)
      const scriptPowerShell = `# Script gerado automaticamente pelo Servidor de Automação
# Data: ${new Date().toISOString()}

# Configurações
$url = "${url}"
$apiKey = "${apiKey}"
$conteudo = @"
${conteudo}
"@

# Headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "text/markdown"
}

try {
    Write-Host "🔄 Criando arquivo: ${arquivoFinal}" -ForegroundColor Yellow
    Write-Host "📡 URL: $url" -ForegroundColor Cyan
    
    # Fazer requisição PUT
    $response = Invoke-WebRequest -Uri $url -Method Put -Body ([System.Text.Encoding]::UTF8.GetBytes($conteudo)) -Headers $headers -SkipCertificateCheck
    
    if ($response.StatusCode -eq 204) {
        Write-Host "✅ Arquivo criado com sucesso!" -ForegroundColor Green
        Write-Host "📁 Localização: ${arquivoFinal}" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Erro ao criar arquivo!" -ForegroundColor Red
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifique se:" -ForegroundColor Yellow
    Write-Host "  1. O Obsidian está aberto"
    Write-Host "  2. O plugin 'Local REST API' está ativo"
    Write-Host "  3. A porta ${porta} está acessível"
    exit 1
}
`;

      return {
        sucesso: true,
        arquivoFinal,
        url,
        scripts: {
          python: scriptPython,
          powershell: scriptPowerShell,
        },
        instrucoes: {
          windows: [
            "1. Salve o script Python como 'criar_arquivo_obsidian.py'",
            "2. Abra o terminal (CMD ou PowerShell)",
            "3. Execute: python criar_arquivo_obsidian.py",
            "OU use o script PowerShell:",
            "1. Salve como 'criar_arquivo_obsidian.ps1'",
            "2. Execute: powershell -ExecutionPolicy Bypass -File criar_arquivo_obsidian.ps1",
          ],
          linux_mac: [
            "1. Salve o script Python como 'criar_arquivo_obsidian.py'",
            "2. Torne executável: chmod +x criar_arquivo_obsidian.py",
            "3. Execute: ./criar_arquivo_obsidian.py",
            "OU: python3 criar_arquivo_obsidian.py",
          ],
        },
        observacoes: [
          "⚠️ O Obsidian deve estar aberto",
          "⚠️ O plugin 'Local REST API' deve estar ativo",
          "⚠️ Certifique-se de que a API Key está correta",
          "⚠️ O script ignora verificação SSL (certificado auto-assinado)",
          "✅ O arquivo será criado automaticamente no vault",
        ],
      };
    }),

  /**
   * Endpoint específico para criar arquivo de teste do Comet
   * Facilita o teste da integração
   */
  criarArquivoTesteComet: publicProcedure
    .input(
      z.object({
        apiKey: z.string().min(1, "API Key do Obsidian é obrigatória"),
        porta: z.number().optional().default(27123),
        usarHttps: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const { apiKey, porta, usarHttps } = input;

      const nomeArquivo = "08_TESTE_Comet_Manus.md";
      const conteudo = `# 🎉 Teste de Integração Comet + Manus + Obsidian

**Data:** ${new Date().toLocaleString('pt-BR')}
**Status:** ✅ Integração Funcionando!

## 📋 Checklist de Teste

- [x] Comet solicitou criação de arquivo
- [x] Manus gerou script automaticamente
- [x] Script foi executado no CPU local
- [x] Arquivo criado no Obsidian com sucesso
- [ ] Usuário verificou arquivo no vault
- [ ] Integração 100% automática confirmada

## 🤖 Informações Técnicas

- **Sistema:** Servidor de Automação v1.0
- **Plugin:** Local REST API
- **Porta:** ${porta}
- **Protocolo:** ${usarHttps ? 'HTTPS' : 'HTTP'}

## 🎯 Próximos Passos

1. Testar criação de arquivos com conteúdo dinâmico
2. Integrar com sistema de OKRs
3. Automatizar criação de checklists diários
4. Sincronizar tarefas entre Comet e Obsidian

---

*Arquivo gerado automaticamente pelo sistema de integração Comet + Manus*
`;

      // Gerar script usando a mesma lógica
      const scriptResult = {
        nomeArquivo,
        conteudo,
        caminho: "",
        apiKey,
        porta,
        usarHttps,
      };

      // Construir o caminho completo do arquivo
      const arquivoFinal = scriptResult.nomeArquivo.endsWith('.md') 
        ? scriptResult.nomeArquivo 
        : `${scriptResult.nomeArquivo}.md`;

      // URL da API
      const protocolo = scriptResult.usarHttps ? "https" : "http";
      const url = `${protocolo}://127.0.0.1:${scriptResult.porta}/vault/${encodeURIComponent(arquivoFinal)}`;

      // Script Python
      const scriptPython = `#!/usr/bin/env python3
"""
Script gerado automaticamente pelo Servidor de Automação
Data: ${new Date().toISOString()}

Este script cria um arquivo no Obsidian usando a API Local REST.
"""

import requests
import json
import sys
from urllib.parse import quote

def criar_arquivo_obsidian():
    """Cria arquivo no Obsidian via API Local REST"""
    
    # Configurações
    url = "${url}"
    api_key = "${scriptResult.apiKey}"
    conteudo = """${scriptResult.conteudo.replace(/"/g, '\\"')}"""
    
    # Headers
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "text/markdown"
    }
    
    try:
        print(f"🔄 Criando arquivo: ${arquivoFinal}")
        print(f"📡 URL: {url}")
        
        # Fazer requisição PUT
        response = requests.put(
            url,
            data=conteudo.encode('utf-8'),
            headers=headers,
            verify=False  # Ignora verificação SSL para certificado auto-assinado
        )
        
        # Verificar resposta
        if response.status_code == 204:
            print("✅ Arquivo criado com sucesso!")
            print(f"📁 Localização: ${arquivoFinal}")
            return True
        else:
            print(f"❌ Erro ao criar arquivo!")
            print(f"Status Code: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {str(e)}")
        print("\\n💡 Verifique se:")
        print("  1. O Obsidian está aberto")
        print("  2. O plugin 'Local REST API' está ativo")
        print("  3. A porta ${scriptResult.porta} está acessível")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        return False

if __name__ == "__main__":
    sucesso = criar_arquivo_obsidian()
    sys.exit(0 if sucesso else 1)
`;

      // Script PowerShell
      const scriptPowerShell = `# Script gerado automaticamente pelo Servidor de Automação
# Data: ${new Date().toISOString()}

# Configurações
$url = "${url}"
$apiKey = "${scriptResult.apiKey}"
$conteudo = @"
${scriptResult.conteudo}
"@

# Headers
$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "text/markdown"
}

try {
    Write-Host "🔄 Criando arquivo: ${arquivoFinal}" -ForegroundColor Yellow
    Write-Host "📡 URL: $url" -ForegroundColor Cyan
    
    # Fazer requisição PUT
    $response = Invoke-WebRequest -Uri $url -Method Put -Body ([System.Text.Encoding]::UTF8.GetBytes($conteudo)) -Headers $headers -SkipCertificateCheck
    
    if ($response.StatusCode -eq 204) {
        Write-Host "✅ Arquivo criado com sucesso!" -ForegroundColor Green
        Write-Host "📁 Localização: ${arquivoFinal}" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Erro ao criar arquivo!" -ForegroundColor Red
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Verifique se:" -ForegroundColor Yellow
    Write-Host "  1. O Obsidian está aberto"
    Write-Host "  2. O plugin 'Local REST API' está ativo"
    Write-Host "  3. A porta ${scriptResult.porta} está acessível"
    exit 1
}
`;

      const resultado = {
        sucesso: true,
        arquivoFinal,
        url,
        scripts: {
          python: scriptPython,
          powershell: scriptPowerShell,
        },
        instrucoes: {
          windows: [
            "1. Salve o script Python como 'criar_arquivo_obsidian.py'",
            "2. Abra o terminal (CMD ou PowerShell)",
            "3. Execute: python criar_arquivo_obsidian.py",
            "OU use o script PowerShell:",
            "1. Salve como 'criar_arquivo_obsidian.ps1'",
            "2. Execute: powershell -ExecutionPolicy Bypass -File criar_arquivo_obsidian.ps1",
          ],
          linux_mac: [
            "1. Salve o script Python como 'criar_arquivo_obsidian.py'",
            "2. Torne executável: chmod +x criar_arquivo_obsidian.py",
            "3. Execute: ./criar_arquivo_obsidian.py",
            "OU: python3 criar_arquivo_obsidian.py",
          ],
        },
        observacoes: [
          "⚠️ O Obsidian deve estar aberto",
          "⚠️ O plugin 'Local REST API' deve estar ativo",
          "⚠️ Certifique-se de que a API Key está correta",
          "⚠️ O script ignora verificação SSL (certificado auto-assinado)",
          "✅ O arquivo será criado automaticamente no vault",
        ],
      };

      return {
        ...resultado,
        mensagemComet: "🎉 Script de teste gerado! Execute no seu CPU para criar o arquivo de teste no Obsidian.",
      };
    }),
});
