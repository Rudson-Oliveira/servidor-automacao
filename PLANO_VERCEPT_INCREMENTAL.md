# 🎯 Plano Incremental - Sistema Similar ao Vercept (Vy)

## 📋 Análise do Vercept

**Conceito Principal:** Assistente de IA que roda **localmente** no computador do usuário e executa tarefas diretamente, sem depender de cloud.

**Diferenciais:**
- ✅ **Execução Local**: Roda no Windows 11+ do usuário
- ✅ **Zero Configuração**: Não precisa conectar Slack, Google Drive, Notion - funciona direto
- ✅ **Privacidade**: Dados ficam no computador, não vão para nuvem
- ✅ **Ação Real**: Não apenas sugere, mas **executa** tarefas

**Casos de Uso Identificados:**
1. Interagir com APIs via terminal
2. Planejar viagens (buscar voos, camping)
3. Configurar Slack workspace
4. Preparar para reuniões (ler calendário)
5. Gerar flashcards Anki
6. Resumir reviews de produtos
7. Scraping de links via CLI
8. Pesquisar pessoas em redes sociais

## 🏗️ Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPUTADOR DO USUÁRIO                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AGENTE LOCAL (Python/Electron)                        │ │
│  │  - Roda em background                                  │ │
│  │  - Monitora comandos                                   │ │
│  │  - Executa ações localmente                            │ │
│  │  - Acessa apps (Obsidian, VSCode, Slack, etc)          │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│                      WebSocket                               │
└─────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR WEB (Manus)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  INTERFACE WEB                                         │ │
│  │  - Dashboard de controle                               │ │
│  │  - Enviar comandos                                     │ │
│  │  - Ver status de agentes                               │ │
│  │  - Histórico de execuções                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SERVIDOR WEBSOCKET                                    │ │
│  │  - Gerencia conexões                                   │ │
│  │  - Roteia comandos                                     │ │
│  │  - Autentica agentes                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementação Incremental (Item por Item)

### ✅ ITEM 1: Servidor WebSocket Básico (Backend)
**Objetivo:** Criar servidor que aceita conexões WebSocket

**Tarefas:**
- [ ] Instalar biblioteca `ws` no projeto
- [ ] Criar arquivo `server/_core/websocket-server.ts`
- [ ] Implementar servidor WebSocket básico na porta 8080
- [ ] Testar conexão com cliente simples (wscat)
- [ ] Adicionar logs de conexão/desconexão

**Validação:** Conseguir conectar via `wscat -c ws://localhost:8080`

---

### ✅ ITEM 2: Sistema de Autenticação por Token
**Objetivo:** Apenas agentes autenticados podem conectar

**Tarefas:**
- [ ] Criar endpoint `/api/trpc/agente.gerarToken` (gera token único)
- [ ] Validar token ao conectar no WebSocket
- [ ] Rejeitar conexões sem token válido
- [ ] Salvar tokens no banco de dados (tabela `agente_tokens`)

**Validação:** Conexão sem token é rejeitada, com token válido é aceita

---

### ✅ ITEM 3: Agente Local Python Básico
**Objetivo:** Script Python que conecta ao servidor

**Tarefas:**
- [ ] Criar `python-scripts/agente_local.py`
- [ ] Instalar `websocket-client` (pip)
- [ ] Conectar ao servidor WebSocket
- [ ] Enviar mensagem "ping" a cada 30s (heartbeat)
- [ ] Receber e exibir mensagens do servidor

**Validação:** Agente conecta, envia ping, servidor responde pong

---

### ✅ ITEM 4: Envio de Comandos Simples
**Objetivo:** Servidor envia comando, agente executa

**Tarefas:**
- [ ] Criar endpoint `/api/trpc/agente.enviarComando`
- [ ] Agente recebe comando via WebSocket
- [ ] Agente executa comando shell simples (`echo "teste"`)
- [ ] Agente retorna resultado ao servidor
- [ ] Servidor salva resultado no banco

**Validação:** Enviar comando "echo teste", receber "teste" de volta

---

### ✅ ITEM 5: Interface Web - Dashboard de Agentes
**Objetivo:** Ver agentes conectados e enviar comandos

**Tarefas:**
- [ ] Criar página `/agentes-locais`
- [ ] Listar agentes conectados (nome, IP, status, última atividade)
- [ ] Formulário para enviar comando
- [ ] Exibir resultado do comando
- [ ] Botão "Desconectar agente"

**Validação:** Ver agente conectado, enviar comando, ver resultado

---

### ✅ ITEM 6: Integração com Obsidian (Primeiro App)
**Objetivo:** Agente consegue criar arquivos no Obsidian

**Tarefas:**
- [ ] Adicionar comando `obsidian.criar_nota`
- [ ] Agente detecta caminho do vault Obsidian
- [ ] Criar arquivo `.md` no vault
- [ ] Retornar sucesso/erro
- [ ] Interface web para criar nota via agente

**Validação:** Criar nota "Teste.md" remotamente, arquivo aparece no Obsidian

---

### ✅ ITEM 7: Instalador Automático do Agente
**Objetivo:** Usuário instala agente com 1 clique

**Tarefas:**
- [ ] Criar `INSTALAR_AGENTE.bat` (Windows)
- [ ] Criar `INSTALAR_AGENTE.sh` (Linux/Mac)
- [ ] Instalar dependências Python automaticamente
- [ ] Configurar agente para iniciar com Windows
- [ ] Gerar token automaticamente

**Validação:** Executar instalador, agente conecta automaticamente

---

### ✅ ITEM 8: Múltiplos Comandos Obsidian
**Objetivo:** CRUD completo de notas

**Tarefas:**
- [ ] Comando `obsidian.listar_notas`
- [ ] Comando `obsidian.ler_nota`
- [ ] Comando `obsidian.editar_nota`
- [ ] Comando `obsidian.deletar_nota`
- [ ] Comando `obsidian.buscar_conteudo`

**Validação:** Executar todos os comandos via interface web

---

### ✅ ITEM 9: Integração com VSCode
**Objetivo:** Abrir arquivos e projetos no VSCode

**Tarefas:**
- [ ] Comando `vscode.abrir_arquivo`
- [ ] Comando `vscode.abrir_pasta`
- [ ] Comando `vscode.executar_terminal`
- [ ] Detectar instalação do VSCode

**Validação:** Abrir arquivo remotamente, VSCode abre no computador

---

### ✅ ITEM 10: Sistema de Logs e Histórico
**Objetivo:** Rastrear todas as execuções

**Tarefas:**
- [ ] Tabela `agente_execucoes` no banco
- [ ] Salvar comando, resultado, timestamp
- [ ] Página `/agentes-locais/historico`
- [ ] Filtros (por agente, por comando, por data)

**Validação:** Ver histórico de comandos executados

---

## 🎯 Próximas Expansões (Após Item 10)

- [ ] Integração com Slack
- [ ] Integração com Notion
- [ ] Integração com Google Calendar
- [ ] Integração com Gmail
- [ ] Comandos de sistema (abrir apps, fechar, reiniciar)
- [ ] Automações agendadas
- [ ] Workflows customizados
- [ ] Interface de arrastar e soltar (low-code)

## 📊 Diferencial do Nosso Sistema vs Vercept

| Funcionalidade | Vercept (Vy) | Nosso Sistema |
|----------------|--------------|---------------|
| Execução local | ✅ | ✅ |
| Zero configuração | ✅ | ⚠️ (Requer instalação) |
| Privacidade | ✅ | ✅ |
| Interface web | ❌ | ✅ |
| Controle remoto | ❌ | ✅ |
| Open source | ❌ | ✅ (potencial) |
| Multiplataforma | ⚠️ (Windows 11+) | ✅ (Win/Mac/Linux) |
| Customizável | ❌ | ✅ |

## 🚀 Estratégia de Implementação

1. **Validar cada item** antes de avançar
2. **Salvar checkpoint** após cada item concluído
3. **Testar manualmente** cada funcionalidade
4. **Documentar** cada comando criado
5. **Não pular etapas** - fazer na ordem

---

**Status Atual:** Aguardando aprovação do usuário para iniciar ITEM 1
