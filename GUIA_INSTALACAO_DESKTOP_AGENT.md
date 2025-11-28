# 🚀 Guia de Instalação do Desktop Agent

## 📋 Visão Geral

Este guia irá ajudá-lo a instalar o **Desktop Agent** no seu computador Windows, permitindo que o sistema assuma controle remoto do seu navegador e desktop para automação completa.

---

## ✅ Pré-requisitos

### 1. Python 3.11 ou superior

**Verificar se já está instalado:**
```cmd
python --version
```

**Se não estiver instalado:**
1. Acesse: https://www.python.org/downloads/
2. Baixe Python 3.11 ou superior
3. **IMPORTANTE:** Marque a opção "Add Python to PATH" durante a instalação
4. Clique em "Install Now"

---

## 🔧 Instalação Passo-a-Passo

### Passo 1: Baixar Arquivos

Baixe os seguintes arquivos para uma pasta no seu computador (ex: `C:\DesktopAgent\`):

1. **INSTALAR_DESKTOP_AGENT.bat** - Script de instalação
2. **agent.py** - Código do Desktop Agent
3. **Este guia (GUIA_INSTALACAO_DESKTOP_AGENT.md)**

### Passo 2: Executar Instalador

1. Abra a pasta onde salvou os arquivos
2. Clique com botão direito em **INSTALAR_DESKTOP_AGENT.bat**
3. Selecione **"Executar como administrador"**
4. Aguarde a instalação das dependências

**O instalador irá:**
- ✅ Verificar instalação do Python
- ✅ Instalar `websockets` (comunicação com servidor)
- ✅ Instalar `pillow` (captura de screenshots)
- ✅ Instalar `psutil` (informações do sistema)
- ✅ Instalar `pywin32` (controle do Windows)

### Passo 3: Configurar Token (JÁ CONFIGURADO)

O arquivo `agent.py` já está configurado com:

```python
TOKEN = "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e"
SERVER_URL = "wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent"
```

**Não é necessário alterar nada!**

### Passo 4: Executar Desktop Agent

1. Abra o **Prompt de Comando** (cmd) como administrador
2. Navegue até a pasta onde salvou os arquivos:
   ```cmd
   cd C:\DesktopAgent
   ```
3. Execute o agent:
   ```cmd
   python agent.py
   ```

**Você verá:**
```
==================================================
DESKTOP AGENT - Sistema de Automação Remota
==================================================
Device: SEU-COMPUTADOR
Platform: Windows
Version: 1.0.0
Server: wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent
==================================================

2024-11-28 10:00:00 - __main__ - INFO - Conectando ao servidor...
2024-11-28 10:00:01 - __main__ - INFO - Conexão WebSocket estabelecida
2024-11-28 10:00:01 - __main__ - INFO - Mensagem de autenticação enviada
2024-11-28 10:00:02 - __main__ - INFO - Autenticação bem-sucedida! Agent ID: 1
2024-11-28 10:00:32 - __main__ - DEBUG - Heartbeat enviado
```

---

## 🎯 Validação da Instalação

### 1. Verificar Conexão

Após executar `python agent.py`, você deve ver:
- ✅ "Conexão WebSocket estabelecida"
- ✅ "Autenticação bem-sucedida! Agent ID: X"
- ✅ "Heartbeat enviado" (a cada 30 segundos)

### 2. Testar no Dashboard

1. Acesse: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/desktop
2. Você verá seu computador listado em **"Agents Conectados"**
3. Status deve estar **"Online" (verde)**

---

## 🔥 Comandos Disponíveis

Após conectado, o sistema pode executar remotamente:

### 1. Comandos Shell
```python
# Exemplo: Listar arquivos
dir C:\

# Exemplo: Ver informações do sistema
systeminfo
```

### 2. Screenshots
```python
# Capturar tela completa
# Será enviado automaticamente para o servidor
```

### 3. Controle de Navegador (via Playwright)
```python
# Abrir navegador
# Navegar para sites
# Preencher formulários
# Clicar em botões
```

---

## 🛠️ Solução de Problemas

### Erro: "Python não encontrado"

**Solução:**
1. Instale Python 3.11+
2. Marque "Add Python to PATH"
3. Reinicie o Prompt de Comando

### Erro: "pip não encontrado"

**Solução:**
```cmd
python -m ensurepip --upgrade
```

### Erro: "Falha na autenticação"

**Solução:**
1. Verifique se o TOKEN está correto no `agent.py`
2. Verifique se o servidor está online
3. Verifique sua conexão com a internet

### Erro: "Conexão WebSocket fechada"

**Solução:**
- O agent irá reconectar automaticamente em 5 segundos
- Se persistir, verifique firewall/antivírus

### Erro: "Pillow não instalado"

**Solução:**
```cmd
pip install pillow
```

---

## 🔒 Segurança

### Token de Autenticação

- ✅ Token único de 64 caracteres
- ✅ Criptografado em trânsito (WSS)
- ✅ Validado no servidor
- ✅ Não compartilhe seu token!

### Permissões

O Desktop Agent pode:
- ✅ Executar comandos shell (com sua permissão)
- ✅ Capturar screenshots
- ✅ Controlar navegador
- ❌ NÃO pode acessar senhas ou dados bancários
- ❌ NÃO pode instalar software sem sua permissão

---

## 📊 Logs

Todos os comandos executados são registrados em:
- **Arquivo:** `agent.log` (na mesma pasta do agent.py)
- **Console:** Saída em tempo real

**Exemplo de log:**
```
2024-11-28 10:05:00 - __main__ - INFO - Executando comando 123: shell
2024-11-28 10:05:01 - __main__ - INFO - Executando shell: dir C:\
2024-11-28 10:05:02 - __main__ - INFO - Resultado enviado para comando 123
```

---

## 🚀 Próximos Passos

Após instalação bem-sucedida:

1. ✅ **Testar Screenshot**
   - Acesse o dashboard: `/desktop`
   - Clique em "Capturar Screenshot"
   - Veja a imagem aparecer na galeria

2. ✅ **Testar Comando Shell**
   - Digite: `dir C:\`
   - Clique em "Enviar Comando"
   - Veja o resultado em "Logs"

3. ✅ **Controle do Navegador**
   - O sistema irá abrir o navegador automaticamente
   - Navegar para sites específicos
   - Executar tarefas automatizadas

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs em `agent.log`
2. Consulte a seção "Solução de Problemas"
3. Verifique se todos os pré-requisitos foram atendidos

---

## ✅ Checklist de Instalação

- [ ] Python 3.11+ instalado
- [ ] Dependências instaladas (websockets, pillow, psutil, pywin32)
- [ ] Arquivo agent.py baixado
- [ ] Agent executado com sucesso
- [ ] Conexão WebSocket estabelecida
- [ ] Autenticação bem-sucedida
- [ ] Agent aparece como "Online" no dashboard
- [ ] Primeiro screenshot capturado
- [ ] Primeiro comando shell executado

---

**Parabéns! Seu Desktop Agent está instalado e funcionando! 🎉**
