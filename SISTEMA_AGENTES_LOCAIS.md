# 🤖 Sistema de Agentes Locais (Vercept)

Sistema completo de controle remoto de aplicações locais via WebSocket, similar ao Vercept/Vy.

## 📋 Visão Geral

O Sistema de Agentes Locais permite **controlar remotamente** aplicações e executar comandos no seu computador local através de uma interface web moderna e intuitiva.

### ✨ Principais Funcionalidades

- ✅ **Controle Remoto via WebSocket** - Conexão em tempo real
- ✅ **Múltiplos Agentes** - Gerenciar vários computadores
- ✅ **Comandos Shell** - Executar comandos do sistema
- ✅ **Integração Obsidian** - Criar, listar e ler notas
- ✅ **Integração VSCode** - Abrir arquivos remotamente
- ✅ **Histórico Completo** - Rastreamento de todas execuções
- ✅ **Estatísticas** - Taxa de sucesso, tempo médio, etc
- ✅ **Reconexão Automática** - Agente se reconecta automaticamente
- ✅ **Heartbeat** - Monitoramento de conexão a cada 30s

## 🏗️ Arquitetura

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│  Interface Web  │ ◄─────────────────────────► │ Servidor Backend │
│   (React/tRPC)  │         /ws/agente          │   (Node.js/WS)   │
└─────────────────┘                             └──────────────────┘
                                                         │
                                                         │ WebSocket
                                                         ▼
                                                ┌──────────────────┐
                                                │  Agente Python   │
                                                │  (Computador     │
                                                │   Local)         │
                                                └──────────────────┘
```

## 📦 Componentes

### 1. Backend (Node.js + WebSocket)

**Arquivos:**
- `server/_core/websocket-agente.ts` - Servidor WebSocket
- `server/routers/agente.ts` - APIs tRPC
- `drizzle/schema-agentes.ts` - Schema do banco

**Funcionalidades:**
- Gerenciamento de conexões WebSocket
- Autenticação por tokens
- Heartbeat e detecção de timeout
- Histórico de execuções no banco
- 8 APIs tRPC (gerar token, listar agentes, enviar comando, etc)

### 2. Frontend (React + TailwindCSS)

**Arquivos:**
- `client/src/pages/AgentesLocais.tsx` - Interface principal

**Funcionalidades:**
- Dashboard com estatísticas
- Gerenciamento de tokens
- Envio de comandos
- Visualização de agentes conectados
- Histórico de execuções
- Auto-refresh a cada 5s

### 3. Agente Local (Python)

**Arquivos:**
- `python-scripts/agente_local.py` - Agente principal

**Funcionalidades:**
- Conexão WebSocket com reconexão automática
- 6 comandos implementados:
  - `shell` - Executar comando shell
  - `obsidian.criar_nota` - Criar nota no Obsidian
  - `obsidian.listar_notas` - Listar notas do vault
  - `obsidian.ler_nota` - Ler conteúdo de nota
  - `vscode.abrir_arquivo` - Abrir arquivo no VSCode
  - `sistema.info` - Informações do sistema

## 🚀 Como Usar

### Passo 1: Gerar Token

1. Acesse `/agentes-locais` na interface web
2. Vá na aba "Tokens"
3. Digite um nome (ex: "Meu Desktop")
4. Clique em "Gerar Token"
5. **Copie o token** (será exibido apenas uma vez)

### Passo 2: Instalar Agente

**Windows:**
```bash
# Baixar agente_local.py
python agente_local.py
```

**Linux/Mac:**
```bash
chmod +x agente_local.py
./agente_local.py
```

### Passo 3: Configurar Agente

Edite `agente_local.py` e configure:

```python
SERVIDOR_URL = "ws://SEU_SERVIDOR:3000/ws/agente"
TOKEN = "seu_token_aqui"
```

### Passo 4: Executar Agente

```bash
python agente_local.py
```

Você verá:
```
🤖 Agente Local - Sistema Vercept
📌 Versão: 1.0.0
💻 Sistema: Windows 11
🏷️  ID: DESKTOP-ABC_1234567890
📝 Nome: DESKTOP-ABC
============================================================
🔌 Conectando: ws://localhost:3000/ws/agente
✅ Conectado! ID: DESKTOP-ABC_1234567890
📝 Registrado: DESKTOP-ABC v1.0.0
✅ Registro confirmado
```

### Passo 5: Enviar Comandos

Na interface web, vá na aba "Comandos":

**Exemplo 1: Comando Shell**
```json
Comando: shell
Parâmetros: {"cmd": "ls -la"}
```

**Exemplo 2: Criar Nota Obsidian**
```json
Comando: obsidian.criar_nota
Parâmetros: {
  "vault_path": "/caminho/para/vault",
  "nome_arquivo": "teste",
  "conteudo": "# Teste\n\nNota criada remotamente!"
}
```

**Exemplo 3: Informações do Sistema**
```json
Comando: sistema.info
Parâmetros: {}
```

## 📊 APIs Disponíveis

### tRPC Endpoints

1. **agente.gerarToken** - Gerar novo token
2. **agente.listarTokens** - Listar tokens (sem expor completo)
3. **agente.desativarToken** - Desativar token
4. **agente.listarAgentes** - Listar agentes conectados
5. **agente.enviarComando** - Enviar comando para agente
6. **agente.desconectarAgente** - Desconectar agente
7. **agente.historico** - Histórico de execuções
8. **agente.estatisticas** - Estatísticas gerais

## 🔒 Segurança

- ✅ Tokens de 64 caracteres (SHA-256)
- ✅ Tokens armazenados no banco
- ✅ Autenticação obrigatória
- ✅ Timeout de 30s por comando
- ✅ Versionamento de agentes
- ✅ Logs de auditoria completos

## 🧪 Testes

```bash
# Executar testes unitários
pnpm test server/routers/agente.test.ts
```

**Resultado:**
```
✓ agente.gerarToken - deve gerar token com 64 caracteres
✓ agente.listarTokens - deve listar tokens sem expor completo
✓ agente.listarAgentes - deve retornar lista de agentes
✓ agente.historico - deve retornar histórico vazio inicialmente
✓ agente.estatisticas - deve retornar estatísticas válidas

Tests  5 passed (5)
```

## 📈 Estatísticas

A interface exibe em tempo real:

- **Total de Execuções** - Quantidade total de comandos executados
- **Taxa de Sucesso** - Percentual de comandos bem-sucedidos
- **Tempo Médio** - Tempo médio de execução em ms
- **Agentes Online** - Quantidade de agentes conectados

## 🐛 Troubleshooting

### Agente não conecta

1. Verificar URL do servidor
2. Verificar token
3. Verificar firewall
4. Ver logs do agente

### Comando não executa

1. Verificar se agente está online
2. Verificar sintaxe JSON dos parâmetros
3. Ver histórico de execuções
4. Verificar timeout (30s)

### Interface não carrega

1. Verificar se servidor está rodando
2. Verificar console do navegador
3. Limpar cache do navegador

## 🔄 Próximas Melhorias

- [ ] Fila persistente de comandos
- [ ] Notificações em tempo real
- [ ] Rate limiting (10 cmd/min)
- [ ] Whitelist de comandos
- [ ] Compressão de payloads
- [ ] Suporte a múltiplos usuários
- [ ] Permissões por agente
- [ ] Logs detalhados com níveis

## 📝 Licença

MIT

## 👥 Autor

Rudson Oliveira - Sistema de Automação

---

**Versão:** 1.0.0  
**Data:** 2025-01-27  
**Status:** ✅ Produção
