# 🚀 GUIA DE INSTALAÇÃO - DESKTOP AGENT

**Versão:** 2.1.0  
**Última atualização:** 01/12/2025

---

## 📋 PRÉ-REQUISITOS

- ✅ **Python 3.7+** instalado
- ✅ **Conexão com internet** (WebSocket)
- ✅ **Token de autenticação** (obtenha em: https://automacao-api-alejofy2.manus.space/desktop/agents)

---

## 🎯 MÉTODO 1: INSTALADOR AUTOMÁTICO (RECOMENDADO)

### **Windows**

```powershell
# 1. Abrir PowerShell no diretório do Desktop Agent
cd C:\Users\SEU_USUARIO\DesktopAgent

# 2. Executar instalador
python instalar.py
```

### **Linux / macOS**

```bash
# 1. Navegar para o diretório
cd ~/DesktopAgent

# 2. Executar instalador
python3 instalar.py
```

### **O que o instalador faz:**

1. ✅ Verifica versão do Python
2. ✅ Instala dependências automaticamente
3. ✅ Detecta informações do sistema
4. ✅ Cria `config.json` com encoding correto
5. ✅ **Testa conexão com o servidor**
6. ✅ **Rollback automático se falhar**

---

## 🔧 MÉTODO 2: INSTALAÇÃO MANUAL

### **Passo 1: Instalar Dependências**

```bash
pip install websocket-client
pip install Pillow  # Opcional (para screenshots)
```

### **Passo 2: Criar config.json**

#### **Opção A: Gerador PowerShell (Windows)**

```powershell
.\gerar_config.ps1
```

#### **Opção B: Gerador Python (Multiplataforma)**

```bash
python gerar_config.py
```

#### **Opção C: Manual (Criar arquivo)**

Criar arquivo `config.json` com o seguinte conteúdo:

```json
{
  "server": {
    "url": "wss://automacao-ws-alejofy2.manus.space/desktop-agent",
    "max_reconnect_attempts": 10
  },
  "agent": {
    "token": "SEU_TOKEN_AQUI_64_CARACTERES",
    "device_name": "PC-Nome",
    "platform": "Windows 11",
    "version": "2.1.0"
  },
  "heartbeat": {
    "interval": 30,
    "timeout": 90
  },
  "logging": {
    "level": "INFO"
  }
}
```

**⚠️ IMPORTANTE (Windows):**
- **NÃO use** `Out-File -Encoding UTF8` (adiciona BOM)
- **USE** o gerador PowerShell ou Python
- Se criar manualmente, use editor que salve UTF-8 **SEM BOM** (VS Code, Notepad++, etc.)

### **Passo 3: Executar Agent**

```bash
python agent.py
```

---

## 🔍 SOLUÇÃO DE PROBLEMAS

### **Erro: "Unexpected UTF-8 BOM"**

**Causa:** Arquivo `config.json` foi criado com BOM (Byte Order Mark)

**Solução:**
```powershell
# Recriar config.json usando gerador
.\gerar_config.ps1
```

Ou use o instalador automático:
```bash
python instalar.py
```

---

### **Erro: "Token inválido"**

**Causa:** Token incorreto ou expirado

**Solução:**
1. Obter novo token em: https://automacao-api-alejofy2.manus.space/desktop/agents
2. Recriar `config.json` com token correto:
   ```bash
   python gerar_config.py
   ```

---

### **Erro: "Módulo 'websocket' não encontrado"**

**Causa:** Dependência não instalada

**Solução:**
```bash
pip install websocket-client
```

Ou use o instalador automático:
```bash
python instalar.py
```

---

### **Erro: "Connection refused" ou "Timeout"**

**Causa:** Firewall bloqueando conexão WebSocket

**Solução:**
1. Verificar firewall do Windows
2. Permitir Python no firewall
3. Verificar proxy/VPN
4. Testar URL manualmente:
   ```bash
   curl https://automacao-api-alejofy2.manus.space/health
   ```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
DesktopAgent/
├── agent.py              # Agent principal
├── instalar.py           # Instalador automático (RECOMENDADO)
├── gerar_config.py       # Gerador Python de config.json
├── gerar_config.ps1      # Gerador PowerShell de config.json
├── config.json           # Configuração (criar com instalador)
├── config.example.json   # Exemplo de configuração
├── INSTALACAO.md         # Este arquivo
└── README.md             # Documentação geral
```

---

## ✅ VERIFICAÇÃO DE INSTALAÇÃO

### **Teste Rápido**

```bash
python agent.py
```

**Saída esperada:**
```
============================================================
Desktop Agent Iniciado
Dispositivo: PC-Nome
Plataforma: Windows 11
Versão: 2.1.0
============================================================
[INFO] Conectando ao servidor...
[INFO] Conectado ao servidor
[INFO] Autenticado com sucesso!
[INFO] Agent online e pronto para receber comandos
```

---

## 🆘 SUPORTE

### **Problemas Comuns Resolvidos**

✅ **UTF-8 BOM** → Instalador cria arquivo correto  
✅ **Token inválido** → Instalador valida token  
✅ **Dependências** → Instalador instala automaticamente  
✅ **Conexão** → Instalador testa antes de finalizar  
✅ **Rollback** → Instalador reverte se falhar  

### **Contato**

- **Dashboard:** https://automacao-api-alejofy2.manus.space/desktop/agents
- **Logs:** Verifique saída do `agent.py` para detalhes

---

## 🔄 ATUALIZAÇÃO

### **Atualizar para versão mais recente:**

1. Baixar nova versão do `agent.py`
2. Manter `config.json` existente
3. Executar:
   ```bash
   python agent.py
   ```

**Não é necessário recriar `config.json`** (compatível com versões anteriores)

---

## 📊 HISTÓRICO DE CORREÇÕES

### **v2.1.0** (01/12/2025)
- ✅ Correção UTF-8 BOM (Windows PowerShell)
- ✅ Detecção automática de encoding
- ✅ Instalador inteligente com teste de conexão
- ✅ Geradores Windows-safe de config.json
- ✅ Rollback automático em caso de falha

### **v2.0.0** (30/11/2025)
- ✅ Correção UnicodeEncodeError no Windows
- ✅ Suporte a caracteres especiais no banner
- ✅ Melhorias na reconexão automática

---

## 🎯 PRÓXIMOS PASSOS

Após instalação bem-sucedida:

1. ✅ Agent conectado e autenticado
2. ✅ Aguardando comandos remotos
3. ✅ Monitorar via Dashboard
4. ✅ Testar comandos remotos

**Desktop Agent pronto para uso! 🚀**
