# 📦 Guia Completo de Instalação - Servidor de Automação

**Versão:** 1.0.0  
**Data:** 01/12/2025  
**Autor:** Manus AI Team

---

## 🎯 Visão Geral

Este sistema oferece **4 métodos de instalação** para atender diferentes necessidades:

| Método | Público | Dificuldade | Tempo |
|--------|---------|-------------|-------|
| 🔗 **Link Web** | Leigos | ⭐ Fácil | 2 min |
| 📦 **.EXE** | Usuários Windows | ⭐⭐ Fácil | 5 min |
| 🔌 **API** | Desenvolvedores | ⭐⭐⭐ Médio | 10 min |
| ☁️ **RENDER** | Administradores | ⭐⭐⭐⭐ Avançado | 20 min |

---

## 🔗 MÉTODO 1: Instalação via LINK (Mais Simples)

### Para quem?
- Usuários leigos
- Quem quer testar rapidamente
- Instalação temporária

### Passo a Passo:

1. **Abra o link de instalação:**
   ```
   https://servidor-automacao.onrender.com/install
   ```

2. **Clique em "Instalar Desktop Agent"**

3. **O navegador vai baixar um script:** `install-agent.ps1`

4. **Clique com botão direito no arquivo** → "Executar com PowerShell"

5. **Aguarde a instalação** (1-2 minutos)

6. **Pronto!** O Desktop Agent estará rodando em segundo plano

### Verificar Instalação:
```powershell
# Abra PowerShell e digite:
Get-Process | Where-Object {$_.Name -like "*desktop-agent*"}
```

---

## 📦 MÉTODO 2: Instalador .EXE (Recomendado)

### Para quem?
- Usuários Windows
- Instalação permanente
- Uso profissional

### Download:
```
https://servidor-automacao.onrender.com/download/desktop-agent-installer.exe
```

### Passo a Passo:

1. **Baixe o instalador** (link acima)

2. **Duplo clique** no arquivo `.exe`

3. **Windows pode alertar** → Clique em "Mais informações" → "Executar assim mesmo"

4. **Siga o assistente:**
   - Aceite os termos
   - Escolha pasta de instalação (padrão: `C:\Program Files\DesktopAgent`)
   - Clique em "Instalar"

5. **Configuração automática:**
   - Conecta ao servidor: `https://servidor-automacao.onrender.com`
   - Registra o agente
   - Inicia serviço em segundo plano

6. **Ícone na bandeja** do Windows aparecerá

### Recursos do Instalador:
- ✅ Auto-healing integrado
- ✅ Atualização automática
- ✅ Desinstalador incluído
- ✅ Logs em `C:\ProgramData\DesktopAgent\logs`

### Desinstalar:
```
Painel de Controle → Programas → Desinstalar Desktop Agent
```

---

## 🔌 MÉTODO 3: API de Instalação (Para Desenvolvedores)

### Para quem?
- Desenvolvedores
- Integração com outros sistemas
- Automação de deploy

### Endpoint:
```
POST https://servidor-automacao.onrender.com/api/desktop-agent/install
```

### Exemplo (PowerShell):
```powershell
$response = Invoke-RestMethod -Uri "https://servidor-automacao.onrender.com/api/desktop-agent/install" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
    } `
    -Body (@{
        "os" = "windows"
        "version" = "latest"
        "auto_start" = $true
    } | ConvertTo-Json)

# Baixar e executar instalador
Invoke-WebRequest -Uri $response.installer_url -OutFile "desktop-agent-setup.exe"
Start-Process -FilePath "desktop-agent-setup.exe" -ArgumentList "/silent" -Wait

Write-Host "Instalação concluída! Token: $($response.token)"
```

### Exemplo (Python):
```python
import requests
import subprocess

# Solicitar instalação
response = requests.post(
    "https://servidor-automacao.onrender.com/api/desktop-agent/install",
    json={
        "os": "windows",
        "version": "latest",
        "auto_start": True
    }
)

data = response.json()

# Baixar instalador
installer_url = data["installer_url"]
subprocess.run(["curl", "-o", "setup.exe", installer_url])

# Executar instalação silenciosa
subprocess.run(["setup.exe", "/silent"])

print(f"Instalado! Token: {data['token']}")
```

### Resposta da API:
```json
{
  "success": true,
  "installer_url": "https://servidor-automacao.onrender.com/download/agent-abc123.exe",
  "token": "dagt_1234567890abcdef",
  "expires_in": 3600,
  "websocket_url": "wss://servidor-automacao.onrender.com/desktop-agent"
}
```

### Autenticação:
```bash
# Após instalação, o agente se conecta automaticamente
# Token é salvo em: C:\ProgramData\DesktopAgent\config.json
```

---

## ☁️ MÉTODO 4: Deploy no RENDER (Já Configurado!)

### Para quem?
- Administradores de sistema
- Deploy em produção
- Servidor 24/7 na nuvem

### Status Atual:
✅ **Servidor no ar:** https://servidor-automacao.onrender.com  
✅ **GitHub conectado:** https://github.com/Rudson-Oliveira/servidor-automacao  
✅ **Deploy automático:** Ativo  
✅ **Health checks:** Configurados

### Configuração (Já Feita):

1. **Repositório GitHub:**
   - URL: `https://github.com/Rudson-Oliveira/servidor-automacao`
   - Branch: `main`
   - Auto-deploy: Ativo

2. **Render Service:**
   - ID: `srv-d4mudfm3jp1c73a7vok0`
   - Região: Oregon
   - Plano: Starter (gratuito)

3. **Variáveis de Ambiente:**
   ```
   NODE_ENV=production
   PORT=3000
   HUGGING_FACE_TOKEN=(configurado)
   DATABASE_URL=(configurado)
   JWT_SECRET=(auto-gerado)
   ```

4. **Build Command:**
   ```bash
   cd server && pnpm install && cd ../client && pnpm install && pnpm build
   ```

5. **Start Command:**
   ```bash
   cd server && node index.js
   ```

### Monitoramento:
```bash
# Health check
curl https://servidor-automacao.onrender.com/api/health

# Status simples
curl https://servidor-automacao.onrender.com/api/health/simple
```

### Logs:
👉 https://dashboard.render.com/web/srv-d4mudfm3jp1c73a7vok0/logs

### Redeploy Manual:
```bash
# Via Dashboard
Dashboard → Deploy → Manual Deploy

# Via API (com Render API Key)
curl -X POST https://api.render.com/v1/services/srv-d4mudfm3jp1c73a7vok0/deploys \
  -H "Authorization: Bearer rnd_clXsL8VGDK7ucGyxymEResmWceDF"
```

---

## 🔧 Configuração Pós-Instalação

### 1. Verificar Conexão:
```bash
# Windows (PowerShell)
Test-NetConnection servidor-automacao.onrender.com -Port 443

# Linux/Mac
curl -I https://servidor-automacao.onrender.com/api/status
```

### 2. Configurar Firewall:
```powershell
# Permitir Desktop Agent no Firewall do Windows
New-NetFirewallRule -DisplayName "Desktop Agent" `
    -Direction Outbound `
    -Action Allow `
    -Program "C:\Program Files\DesktopAgent\agent.exe"
```

### 3. Testar Comunicação:
```bash
# Enviar comando de teste
curl -X POST https://servidor-automacao.onrender.com/api/desktop-agent/test \
  -H "Content-Type: application/json" \
  -d '{"command": "ping"}'
```

---

## 🛡️ Segurança

### Certificados SSL:
- ✅ HTTPS habilitado automaticamente no Render
- ✅ Certificado Let's Encrypt renovado automaticamente

### Autenticação:
- ✅ Tokens JWT com expiração de 24h
- ✅ API Keys para integrações
- ✅ WebSocket com autenticação obrigatória

### Firewall:
```bash
# Portas necessárias:
- 443 (HTTPS) - Servidor web
- 443 (WSS) - WebSocket seguro
```

---

## 🐛 Troubleshooting

### Erro: "Não consegue conectar ao servidor"
```bash
# Verificar se servidor está online
curl https://servidor-automacao.onrender.com/api/status

# Se retornar 502, aguardar rebuild do Render (5-10 min)
```

### Erro: "Desktop Agent não inicia"
```powershell
# Ver logs
Get-Content "C:\ProgramData\DesktopAgent\logs\agent.log" -Tail 50

# Reiniciar serviço
Restart-Service -Name "DesktopAgent"
```

### Erro: "Token inválido"
```bash
# Gerar novo token
curl -X POST https://servidor-automacao.onrender.com/api/desktop-agent/register \
  -H "Content-Type: application/json" \
  -d '{"machine_id": "seu-id-unico"}'
```

---

## 📞 Suporte

### Documentação:
- 📖 README: `/README.md`
- 🔧 Melhorias: `/MELHORIAS_IMPLEMENTADAS.md`
- 🧠 Base Comet: `/COMET_KNOWLEDGE_BASE_FINAL.md`

### Logs:
- **Servidor:** Dashboard Render
- **Desktop Agent:** `C:\ProgramData\DesktopAgent\logs`
- **Navegador:** Console do DevTools (F12)

### Contato:
- **GitHub Issues:** https://github.com/Rudson-Oliveira/servidor-automacao/issues
- **Email:** rud.pa@hotmail.com

---

## ✅ Checklist de Instalação

### Desktop Agent (Windows):
- [ ] Baixar instalador (.EXE ou via Link)
- [ ] Executar instalação
- [ ] Verificar serviço rodando
- [ ] Testar conexão com servidor
- [ ] Configurar firewall (se necessário)

### Servidor (Render):
- [x] Repositório GitHub criado
- [x] Render conectado ao GitHub
- [x] Deploy automático configurado
- [x] Variáveis de ambiente definidas
- [x] Health checks ativos
- [ ] Validar URL pública funcionando

---

**Última atualização:** 01/12/2025  
**Versão do sistema:** 1.0.0  
**Status:** ✅ Pronto para uso
