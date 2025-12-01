# Sistema de Controle de Desktop Agents

**Versão:** 2.0.0  
**Data:** 01 de Dezembro de 2025  
**Autor:** Manus AI

---

## Sumário Executivo

Este documento apresenta a arquitetura completa do Sistema de Controle de Desktop Agents, uma plataforma robusta para monitoramento e controle remoto de computadores através de WebSocket bidirecional e interface web moderna. O sistema foi projetado para oferecer controle em tempo real, auditoria completa e segurança de nível empresarial.

A implementação atual inclui servidor WebSocket com autenticação baseada em tokens, dashboard web responsivo com atualização automática, componentes de visualização de logs e comandos, além de suite completa de testes automatizados. O protocolo de comunicação utiliza mensagens JSON padronizadas com timestamps ISO8601 para garantir rastreabilidade e sincronização precisa entre servidor e clientes.

---

## Arquitetura do Sistema

### Visão Geral

O sistema é composto por três camadas principais que trabalham em conjunto para fornecer uma experiência de controle remoto completa e confiável.

**Camada de Comunicação (WebSocket Server)** é responsável por manter conexões persistentes com os Desktop Agents instalados nos computadores dos usuários. Esta camada implementa autenticação baseada em tokens únicos, heartbeat bidirecional a cada 30 segundos para detecção de desconexão, e roteamento de comandos para os agents apropriados. O servidor escuta na porta 3001 com path específico `/desktop-agent`, garantindo isolamento de outros serviços WebSocket.

**Camada de Aplicação (Backend tRPC)** fornece API REST tipada para o frontend através do framework tRPC, garantindo type-safety completo entre cliente e servidor. Esta camada gerencia autenticação de usuários via Manus OAuth, validação de permissões (agents só podem ser controlados por seus proprietários), e persistência de dados no banco MySQL/TiDB. Todas as operações são auditadas e registradas para compliance e debugging.

**Camada de Apresentação (Dashboard Web)** oferece interface moderna construída com React 19, Tailwind CSS 4 e shadcn/ui. O dashboard apresenta visualização em tempo real do status dos agents, histórico de comandos executados, timeline de logs de atividade, e estatísticas agregadas do sistema. A interface atualiza automaticamente a cada 5 segundos através de polling otimizado, eliminando a necessidade de WebSocket no frontend.

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Dashboard Desktop Agents                             │  │
│  │  - Agent Cards (status, platform, IP)                 │  │
│  │  - Stats Cards (total, online, comandos, screenshots) │  │
│  │  - Auto-refresh (5s polling)                          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  AgentCommands       │  │  AgentLogs               │    │
│  │  - Histórico         │  │  - Timeline de eventos   │    │
│  │  - Filtros           │  │  - Filtros por nível     │    │
│  │  - Detalhes          │  │  - Metadata expandível   │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ tRPC (HTTP/REST)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express + tRPC)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  desktopControl Router                                │  │
│  │  - createAgent()   - listAgents()                     │  │
│  │  - sendCommand()   - listCommands()                   │  │
│  │  - listLogs()      - getStats()                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Database Layer (MySQL/TiDB)                          │  │
│  │  - desktop_agents    - desktop_commands               │  │
│  │  - desktop_logs      - desktop_screenshots            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ WebSocket (wss://)
                              │
┌─────────────────────────────────────────────────────────────┐
│              WEBSOCKET SERVER (Port 3001)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  DesktopAgentServer                                   │  │
│  │  - Path: /desktop-agent                               │  │
│  │  - Autenticação via token                             │  │
│  │  - Heartbeat (30s)                                    │  │
│  │  - Roteamento de comandos                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ WebSocket Client
                              │
┌─────────────────────────────────────────────────────────────┐
│                  DESKTOP AGENTS (Clientes)                  │
│  - Windows Desktop Agent                                    │
│  - macOS Desktop Agent                                      │
│  - Linux Desktop Agent                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Protocolo de Comunicação WebSocket

### Formato de Mensagens

Todas as mensagens trocadas entre servidor e Desktop Agents seguem um formato JSON padronizado com campos obrigatórios para rastreabilidade e auditoria. O protocolo foi projetado para ser extensível, permitindo adição de novos tipos de mensagem sem quebrar compatibilidade com versões anteriores.

**Estrutura Base de Mensagem:**

```typescript
interface WebSocketMessage {
  type: string;              // Tipo da mensagem (auth, heartbeat, command, etc)
  timestamp: string;         // ISO8601 timestamp (obrigatório)
  device_id?: string;        // Identificador do dispositivo (opcional)
  data?: any;                // Payload específico do tipo de mensagem
}
```

O campo `timestamp` utiliza formato ISO8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`) para garantir compatibilidade internacional e precisão de milissegundos. O campo `device_id` permite identificar múltiplos agents no mesmo computador, útil para cenários de virtualização ou containers.

### Fluxo de Autenticação

O processo de autenticação ocorre imediatamente após o estabelecimento da conexão WebSocket. O servidor envia mensagem de boas-vindas e aguarda o cliente enviar suas credenciais dentro de um timeout de 30 segundos.

**1. Conexão Estabelecida (HTTP 101 Switching Protocols)**

```
Cliente → Servidor: WebSocket Handshake
Servidor → Cliente: HTTP/1.1 101 Switching Protocols
```

**2. Mensagem de Boas-Vindas**

```json
{
  "type": "welcome",
  "message": "Desktop Agent Server - Autentique-se enviando { type: 'auth', token: 'seu_token' }"
}
```

**3. Autenticação do Cliente**

```json
{
  "type": "auth",
  "timestamp": "2025-12-01T14:05:21.616Z",
  "device_id": "desktop-win-001",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**4. Resposta de Sucesso**

```json
{
  "type": "auth_success",
  "agentId": 120033,
  "deviceName": "DESKTOP-RUDSON",
  "message": "Autenticação bem-sucedida"
}
```

**5. Resposta de Erro**

```json
{
  "type": "error",
  "error": "Token inválido"
}
```

Após autenticação bem-sucedida, o servidor atualiza o status do agent para `online` no banco de dados, registra log de auditoria com IP do cliente, e inicia envio de comandos pendentes. Se a autenticação falhar, a conexão é fechada imediatamente para prevenir ataques de força bruta.

### Heartbeat Bidirecional

O mecanismo de heartbeat garante detecção rápida de desconexões inesperadas, mesmo quando firewalls ou proxies intermediários mantêm a conexão TCP aberta. O intervalo de 30 segundos foi escolhido para balancear detecção rápida com overhead de rede mínimo.

**Cliente → Servidor (a cada 30 segundos)**

```json
{
  "type": "heartbeat",
  "timestamp": "2025-12-01T14:05:51.832Z",
  "device_id": "desktop-win-001"
}
```

**Servidor → Cliente (resposta imediata)**

```json
{
  "type": "heartbeat_ack",
  "timestamp": "2025-12-01T14:05:51.835Z"
}
```

O servidor mantém timestamp do último heartbeat recebido (`lastPing`) e considera o agent offline se não receber heartbeat por 90 segundos (3x o intervalo normal). Esta margem de segurança previne falsos positivos causados por latência de rede temporária ou garbage collection no cliente.

### Envio de Comandos

Comandos são enviados do servidor para o Desktop Agent quando o usuário solicita uma ação através do dashboard web. O sistema suporta dois tipos principais de comandos: `shell` (execução de comandos do sistema operacional) e `screenshot` (captura de tela).

**Servidor → Cliente (comando shell)**

```json
{
  "type": "command",
  "timestamp": "2025-12-01T14:06:15.123Z",
  "commandId": 90046,
  "commandType": "shell",
  "commandData": {
    "command": "ls -la /home/user/Documents"
  }
}
```

**Servidor → Cliente (comando screenshot)**

```json
{
  "type": "command",
  "timestamp": "2025-12-01T14:06:20.456Z",
  "commandId": 90047,
  "commandType": "screenshot",
  "commandData": {
    "format": "png",
    "quality": 90
  }
}
```

O campo `commandId` é único e permite rastreamento do comando desde a criação até a conclusão. O servidor marca o comando como `sent` no banco de dados imediatamente após envio, e o cliente deve responder com resultado ou erro dentro de um timeout configurável (padrão: 60 segundos para shell, 30 segundos para screenshot).

### Resposta de Comandos

Após executar o comando, o Desktop Agent envia resultado de volta ao servidor. Para comandos shell, o resultado inclui stdout, stderr e código de saída. Para screenshots, o resultado inclui imagem em base64 que é automaticamente enviada para S3.

**Cliente → Servidor (resultado de sucesso)**

```json
{
  "type": "command_result",
  "timestamp": "2025-12-01T14:06:16.789Z",
  "device_id": "desktop-win-001",
  "commandId": 90046,
  "success": true,
  "result": {
    "stdout": "total 48\ndrwxr-xr-x  12 user  staff   384 Dec  1 14:00 .\ndrwxr-xr-x+ 45 user  staff  1440 Dec  1 13:30 ..",
    "stderr": "",
    "exitCode": 0
  },
  "executionTimeMs": 1234
}
```

**Cliente → Servidor (resultado de erro)**

```json
{
  "type": "command_result",
  "timestamp": "2025-12-01T14:06:16.789Z",
  "device_id": "desktop-win-001",
  "commandId": 90046,
  "success": false,
  "error": "Command not found: invalidcommand",
  "executionTimeMs": 45
}
```

**Cliente → Servidor (screenshot com upload S3)**

```json
{
  "type": "command_result",
  "timestamp": "2025-12-01T14:06:21.234Z",
  "device_id": "desktop-win-001",
  "commandId": 90047,
  "success": true,
  "result": {
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
    "format": "png",
    "width": 1920,
    "height": 1080,
    "fileSize": 245678
  },
  "executionTimeMs": 567
}
```

O servidor processa o resultado automaticamente: para screenshots, extrai o base64, faz upload para S3, e substitui o campo `image_base64` por `screenshot_url` antes de salvar no banco. Este processo garante que o banco de dados não seja sobrecarregado com dados binários grandes.

### Logs de Atividade

Desktop Agents podem enviar logs de atividade para o servidor a qualquer momento, permitindo debugging remoto e auditoria de ações. Logs são categorizados em quatro níveis de severidade: `debug`, `info`, `warning` e `error`.

**Cliente → Servidor (log de atividade)**

```json
{
  "type": "log",
  "timestamp": "2025-12-01T14:06:30.567Z",
  "device_id": "desktop-win-001",
  "level": "info",
  "message": "Desktop Agent conectado via WebSocket",
  "metadata": {
    "ipAddress": "192.168.1.100",
    "platform": "win32",
    "version": "1.0.0"
  }
}
```

Logs são armazenados indefinidamente no banco de dados e podem ser consultados através do dashboard web com filtros por agent, nível de severidade, e intervalo de tempo. O campo `metadata` aceita JSON arbitrário, permitindo anexar informações contextuais relevantes para cada tipo de log.

---

## Banco de Dados

### Schema Completo

O sistema utiliza quatro tabelas principais para armazenar informações sobre agents, comandos, screenshots e logs. Todas as tabelas incluem índices otimizados para consultas frequentes e foreign keys para garantir integridade referencial.

**Tabela: `desktop_agents`**

Armazena informações sobre cada Desktop Agent registrado no sistema. Cada agent possui um token único gerado automaticamente durante criação, que serve como credencial de autenticação permanente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INT AUTO_INCREMENT | Chave primária |
| `userId` | INT | FK para `users.id` (proprietário) |
| `token` | VARCHAR(64) UNIQUE | Token de autenticação (gerado automaticamente) |
| `deviceName` | VARCHAR(255) | Nome do computador |
| `platform` | VARCHAR(50) | Sistema operacional (win32, darwin, linux) |
| `version` | VARCHAR(50) | Versão do Desktop Agent instalado |
| `status` | ENUM | Status atual (online, offline, busy, error) |
| `lastPing` | TIMESTAMP | Último heartbeat recebido |
| `ipAddress` | VARCHAR(45) | Endereço IP (IPv4 ou IPv6) |
| `createdAt` | TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | Última atualização |

**Índices:** `user_id_idx`, `status_idx`, `token_idx`

**Tabela: `desktop_commands`**

Registra todos os comandos enviados aos Desktop Agents, incluindo status de execução, resultado e tempo de processamento. Esta tabela é essencial para auditoria e debugging.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INT AUTO_INCREMENT | Chave primária |
| `agentId` | INT | FK para `desktop_agents.id` |
| `userId` | INT | FK para `users.id` (quem solicitou) |
| `commandType` | VARCHAR(50) | Tipo (shell, screenshot, etc) |
| `commandData` | TEXT | JSON com parâmetros do comando |
| `status` | ENUM | Status (pending, sent, executing, completed, failed) |
| `result` | TEXT | JSON com resultado da execução |
| `errorMessage` | TEXT | Mensagem de erro (se falhou) |
| `sentAt` | TIMESTAMP | Quando foi enviado ao agent |
| `completedAt` | TIMESTAMP | Quando foi concluído |
| `executionTimeMs` | INT | Tempo de execução em milissegundos |
| `createdAt` | TIMESTAMP | Data de criação |

**Índices:** `agent_id_idx`, `user_id_idx`, `status_idx`, `command_type_idx`

**Tabela: `desktop_screenshots`**

Armazena metadados de screenshots capturados. As imagens em si são armazenadas no S3 para otimizar performance do banco de dados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INT AUTO_INCREMENT | Chave primária |
| `agentId` | INT | FK para `desktop_agents.id` |
| `userId` | INT | FK para `users.id` |
| `imageUrl` | TEXT | URL da imagem no S3 |
| `imageKey` | VARCHAR(500) | Chave S3 (para deleção) |
| `width` | INT | Largura da imagem em pixels |
| `height` | INT | Altura da imagem em pixels |
| `fileSize` | INT | Tamanho do arquivo em bytes |
| `format` | VARCHAR(20) | Formato (png, jpg, webp) |
| `createdAt` | TIMESTAMP | Data de captura |

**Índices:** `agent_id_idx`, `user_id_idx`

**Tabela: `desktop_logs`**

Armazena logs de atividade enviados pelos Desktop Agents. Logs podem estar associados a comandos específicos ou serem eventos independentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INT AUTO_INCREMENT | Chave primária |
| `commandId` | INT NULLABLE | FK para `desktop_commands.id` (opcional) |
| `agentId` | INT | FK para `desktop_agents.id` |
| `userId` | INT | FK para `users.id` |
| `level` | ENUM | Nível (debug, info, warning, error) |
| `message` | TEXT | Mensagem do log |
| `metadata` | TEXT | JSON com informações adicionais |
| `createdAt` | TIMESTAMP | Data de criação |

**Índices:** `command_id_idx`, `agent_id_idx`, `user_id_idx`, `level_idx`

### Queries Otimizadas

O sistema utiliza queries otimizadas com índices apropriados para garantir performance mesmo com milhares de agents e milhões de comandos. Todas as consultas incluem filtro por `userId` para garantir isolamento de dados entre usuários.

**Listar agents online do usuário:**

```sql
SELECT * FROM desktop_agents
WHERE userId = ? 
  AND status = 'online'
  AND lastPing > DATE_SUB(NOW(), INTERVAL 90 SECOND)
ORDER BY deviceName ASC;
```

**Listar comandos pendentes de um agent:**

```sql
SELECT * FROM desktop_commands
WHERE agentId = ? 
  AND status IN ('pending', 'sent')
ORDER BY createdAt ASC
LIMIT 10;
```

**Estatísticas agregadas do usuário:**

```sql
SELECT 
  COUNT(*) as totalAgents,
  SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as onlineAgents,
  (SELECT COUNT(*) FROM desktop_commands WHERE userId = ?) as totalCommands,
  (SELECT COUNT(*) FROM desktop_screenshots WHERE userId = ?) as totalScreenshots
FROM desktop_agents
WHERE userId = ?;
```

---

## API tRPC (Backend)

### Endpoints Disponíveis

O sistema expõe API tRPC completa para gerenciamento de Desktop Agents. Todos os endpoints requerem autenticação via Manus OAuth e validam que o usuário possui permissão para acessar os recursos solicitados.

**`desktopControl.createAgent`** (Mutation)

Cria novo Desktop Agent e retorna token de autenticação. Este endpoint é chamado durante instalação do Desktop Agent no computador do usuário.

```typescript
// Input
{
  deviceName: string;  // Nome do computador
  platform?: string;   // win32, darwin, linux (auto-detectado se omitido)
  version?: string;    // Versão do Desktop Agent (padrão: "1.0.0")
}

// Output
{
  success: true,
  agent: {
    id: number;
    deviceName: string;
    token: string;        // Token único para autenticação WebSocket
    platform: string;
    version: string;
    status: "offline";
    createdAt: Date;
  },
  message: string;
}
```

**`desktopControl.listAgents`** (Query)

Lista todos os Desktop Agents do usuário autenticado, incluindo informação de status online/offline calculada dinamicamente baseada no último heartbeat.

```typescript
// Output
Array<{
  id: number;
  deviceName: string | null;
  platform: string | null;
  version: string | null;
  status: "online" | "offline" | "busy" | "error";
  lastPing: Date | null;
  ipAddress: string | null;
  isOnline: boolean;           // Calculado: lastPing < 90 segundos
  timeSinceLastPing: number;   // Segundos desde último heartbeat
  createdAt: Date;
}>
```

**`desktopControl.sendCommand`** (Mutation)

Envia comando para Desktop Agent específico. Valida que o agent pertence ao usuário e está online antes de enviar.

```typescript
// Input
{
  agentId: number;
  commandType: "shell" | "screenshot";
  commandData: Record<string, any>;  // Objeto (não string JSON)
}

// Output
{
  success: true,
  commandId: number;
  message: string;
}

// Erros possíveis:
// - "Agent não encontrado ou não pertence ao usuário"
// - "Agent está offline. Última conexão há X segundos"
// - "Comando bloqueado: [razão]" (validação de segurança)
```

**`desktopControl.listCommands`** (Query)

Lista comandos com filtros opcionais por agent, status e tipo. Resultados ordenados por data de criação (mais recentes primeiro).

```typescript
// Input
{
  agentId?: number;
  status?: "pending" | "sent" | "executing" | "completed" | "failed";
  commandType?: "shell" | "screenshot";
  limit?: number;  // Padrão: 50
}

// Output
Array<{
  id: number;
  agentId: number;
  commandType: string;
  commandData: string;  // JSON string
  status: string;
  result: string | null;
  errorMessage: string | null;
  executionTimeMs: number | null;
  createdAt: Date;
  sentAt: Date | null;
  completedAt: Date | null;
}>
```

**`desktopControl.listLogs`** (Query)

Lista logs de atividade com filtros por agent, comando e nível de severidade.

```typescript
// Input
{
  agentId?: number;
  commandId?: number;
  level?: "debug" | "info" | "warning" | "error";
  limit?: number;  // Padrão: 100
}

// Output
Array<{
  id: number;
  agentId: number;
  commandId: number | null;
  level: "debug" | "info" | "warning" | "error";
  message: string;
  metadata: string | null;  // JSON string
  createdAt: Date;
}>
```

**`desktopControl.getStats`** (Query)

Retorna estatísticas agregadas do sistema para o usuário autenticado.

```typescript
// Output
{
  agents: {
    total: number;
    online: number;
    offline: number;
  },
  commands: {
    total: number;
    pending: number;
    executing: number;
    completed: number;
    failed: number;
    avgExecutionTimeMs: number;
    successRate: number;  // Percentual (0-100)
  },
  screenshots: {
    total: number;
  }
}
```

### Validação de Segurança

Todos os comandos shell passam por validação de segurança antes de serem enviados ao Desktop Agent. O sistema implementa whitelist/blacklist configurável e auditoria completa de comandos bloqueados.

**Comandos Bloqueados por Padrão:**

- `rm -rf /` (deleção recursiva perigosa)
- `:(){ :|:& };:` (fork bomb)
- `dd if=/dev/zero of=/dev/sda` (sobrescrever disco)
- Comandos com `sudo` ou `su` (escalação de privilégios)
- Comandos com redirecionamento para arquivos de sistema (`> /etc/passwd`)

**Comandos que Requerem Confirmação:**

- Deleção de arquivos (`rm`, `del`)
- Modificação de sistema (`chmod`, `chown`)
- Instalação de software (`apt install`, `brew install`)
- Comandos de rede (`curl`, `wget`, `nc`)

A validação é implementada no arquivo `server/command-security.ts` e pode ser customizada por usuário através de regras específicas armazenadas no banco de dados.

---

## Dashboard Web (Frontend)

### Página Principal: `/dashboard/desktop-agents`

A página principal do dashboard oferece visão completa de todos os Desktop Agents do usuário, com atualização automática a cada 5 segundos. A interface foi projetada para ser intuitiva e responsiva, funcionando perfeitamente em desktop, tablet e mobile.

**Componentes Principais:**

**Header** contém título da página, descrição breve e controles de atualização. Usuário pode desabilitar auto-refresh para economizar bateria em dispositivos móveis ou forçar atualização manual clicando no botão "Atualizar".

**Stats Cards** exibem métricas agregadas em cards visuais:

- **Total de Agents:** Número total de Desktop Agents registrados
- **Online:** Agents atualmente conectados (indicador verde pulsante)
- **Comandos Executados:** Total de comandos enviados (todos os status)
- **Screenshots:** Total de capturas de tela realizadas

**Agent Cards Grid** apresenta cada Desktop Agent em card individual com informações essenciais:

- Ícone da plataforma (🪟 Windows, 🍎 macOS, 🐧 Linux)
- Nome do dispositivo
- Status visual (bolinha colorida: verde=online, cinza=offline, amarelo=busy, vermelho=error)
- Badges com plataforma e versão
- Último heartbeat (formato relativo: "há 30 segundos")
- Endereço IP
- Data de criação

Clicar em um Agent Card seleciona o agent e exibe detalhes completos abaixo do grid.

### Componente: `AgentCommands`

Exibe histórico de comandos executados no agent selecionado, com filtros e visualização detalhada de resultados.

**Funcionalidades:**

- **Filtro por Status:** Dropdown permite filtrar comandos por status (todos, pendente, enviado, executando, completo, falhou)
- **Auto-refresh:** Atualiza lista a cada 5 segundos quando habilitado
- **Ícones Visuais:** Cada comando possui ícone indicando tipo (Terminal para shell, Câmera para screenshot) e status (Relógio para pendente, Spinner para executando, Check para completo, X para falhou)
- **Detalhes Expandíveis:** Clicar em "Ver comando" expande JSON formatado com parâmetros enviados
- **Resultados:** Comandos completados exibem resultado em caixa verde; comandos falhados exibem erro em caixa vermelha
- **Tempo de Execução:** Badge mostra tempo de execução em milissegundos para comandos concluídos

**Exemplo de Visualização:**

```
┌─────────────────────────────────────────────────────────┐
│ 🟢 COMPLETED  shell  há 2 minutos                       │
│ ▼ Ver comando                                           │
│   {                                                     │
│     "command": "ls -la /home/user/Documents"            │
│   }                                                     │
│ ✅ Ver resultado                                        │
│   stdout: "total 48\ndrwxr-xr-x  12 user  staff..."     │
│   exitCode: 0                                           │
│ ⏱️ 1234ms                                               │
└─────────────────────────────────────────────────────────┘
```

### Componente: `AgentLogs`

Timeline de eventos do Desktop Agent com filtros por nível de severidade e visualização de metadata.

**Funcionalidades:**

- **Filtro por Nível:** Dropdown permite filtrar logs (todos, debug, info, warning, error)
- **Ícones por Severidade:** 
  - 🐛 Debug (cinza)
  - ℹ️ Info (azul)
  - ⚠️ Warning (amarelo)
  - 🚨 Error (vermelho)
- **Badges Coloridos:** Cada log possui badge com nível de severidade em cor apropriada
- **Timestamp Relativo:** Exibe tempo decorrido desde o evento ("há 5 minutos")
- **Metadata Expandível:** Logs com metadata adicional podem ser expandidos para visualizar JSON completo
- **Associação com Comandos:** Logs relacionados a comandos exibem badge "Comando #123"

**Exemplo de Visualização:**

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ INFO  há 30 segundos                                 │
│ Desktop Agent conectado via WebSocket                   │
│ ▼ Ver detalhes                                          │
│   {                                                     │
│     "ipAddress": "192.168.1.100",                       │
│     "platform": "win32",                                │
│     "version": "1.0.0"                                  │
│   }                                                     │
└─────────────────────────────────────────────────────────┘
```

### Responsividade

O dashboard utiliza Tailwind CSS com breakpoints responsivos para garantir experiência otimizada em todos os dispositivos:

- **Desktop (>1024px):** Grid de 3 colunas para Agent Cards, 2 colunas para detalhes
- **Tablet (768px-1024px):** Grid de 2 colunas para Agent Cards, 1 coluna para detalhes
- **Mobile (<768px):** Grid de 1 coluna para todos os componentes, cards empilhados verticalmente

Todos os componentes utilizam `ScrollArea` do shadcn/ui para garantir que conteúdo longo não quebre o layout, com scroll suave e barras de rolagem customizadas.

---

## Testes Automatizados

### Suite de Testes de Integração

O sistema inclui suite completa de testes automatizados que validam todos os endpoints da API e fluxos de negócio. Testes são executados com Vitest e cobrem cenários de sucesso, erro e edge cases.

**Arquivo:** `server/desktop-control.integration.test.ts`

**Cobertura de Testes:**

**Agent Management (3 testes)**

- ✅ `deve criar um novo agent` - Valida criação de agent com token único
- ✅ `deve listar agents do usuário` - Valida listagem e cálculo de status online/offline
- ✅ `deve calcular corretamente o status online/offline` - Valida lógica de heartbeat

**Command Management (4 testes)**

- ✅ `deve enviar comando shell para agent` - Valida envio de comando shell com validação de segurança
- ✅ `deve enviar comando screenshot para agent` - Valida envio de comando screenshot
- ✅ `deve listar comandos do agent` - Valida listagem com filtros
- ✅ `deve filtrar comandos por status` - Valida filtro por status específico

**Logs Management (2 testes)**

- ✅ `deve listar logs do agent` - Valida listagem de logs
- ✅ `deve filtrar logs por nível` - Valida filtro por severidade

**Statistics (1 teste)**

- ✅ `deve retornar estatísticas do sistema` - Valida estrutura e valores das estatísticas

**Security & Validation (3 testes)**

- ✅ `deve rejeitar comando de usuário não autorizado` - Valida isolamento de dados entre usuários
- ✅ `deve validar tipo de comando` - Valida enum de tipos de comando
- ✅ `deve validar limite de resultados` - Valida paginação

**Execução dos Testes:**

```bash
pnpm test desktop-control.integration.test.ts
```

**Resultado:**

```
✓ server/desktop-control.integration.test.ts (13 tests) 301ms
 Test Files  1 passed (1)
      Tests  13 passed (13)
   Duration  2.51s
```

### Suite de Testes WebSocket

**Arquivo:** `server/websocket.connection.test.ts`

**Cobertura de Testes:**

- ✅ `deve aceitar conexão WebSocket com HTTP 101 handshake` - Valida upgrade de protocolo
- ✅ `deve receber mensagem de boas-vindas após conexão` - Valida mensagem inicial
- ✅ `deve autenticar com token válido` - Valida fluxo de autenticação completo
- ✅ `deve rejeitar token inválido` - Valida segurança de autenticação
- ✅ `deve processar heartbeat e responder com heartbeat_ack` - Valida mecanismo de heartbeat
- ✅ `deve validar formato ISO8601 dos timestamps` - Valida padronização de timestamps

**Execução dos Testes:**

```bash
pnpm test websocket.connection.test.ts
```

**Resultado:**

```
✓ server/websocket.connection.test.ts (6 tests) 590ms
 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  1.71s
```

### Cobertura Total

O sistema possui **19 testes automatizados** cobrindo todas as funcionalidades críticas. Testes são executados automaticamente em CI/CD antes de cada deploy, garantindo que regressões sejam detectadas imediatamente.

---

## Segurança

### Autenticação e Autorização

**Desktop Agents:** Autenticação baseada em tokens únicos gerados durante criação do agent. Tokens são armazenados em hash SHA-256 no banco de dados e nunca expostos em logs. Cada token possui 64 caracteres hexadecimais (256 bits de entropia), tornando ataques de força bruta impraticáveis.

**Usuários Web:** Autenticação via Manus OAuth com JWT. Tokens de sessão expiram após 7 dias de inatividade e são renovados automaticamente em cada requisição. Cookies de sessão utilizam flags `httpOnly`, `secure` e `sameSite=strict` para prevenir XSS e CSRF.

**Isolamento de Dados:** Todas as queries incluem filtro por `userId` para garantir que usuários só possam acessar seus próprios agents, comandos e logs. Tentativas de acessar recursos de outros usuários retornam erro 404 (não 403) para prevenir enumeração.

### Validação de Comandos

Sistema implementa validação em múltiplas camadas:

**Camada 1 - Validação de Schema (tRPC):** Valida tipos de dados, campos obrigatórios e enums antes de processar requisição.

**Camada 2 - Validação de Permissões:** Verifica que agent pertence ao usuário e está online antes de enviar comando.

**Camada 3 - Validação de Segurança:** Analisa comando shell contra whitelist/blacklist configurável. Comandos perigosos são bloqueados automaticamente.

**Camada 4 - Auditoria:** Todos os comandos (permitidos e bloqueados) são registrados em tabela de auditoria com timestamp, usuário, agent e resultado da validação.

### Proteção Contra Ataques

**Rate Limiting:** API implementa rate limiting de 100 requisições por minuto por usuário. WebSocket implementa rate limiting de 10 mensagens por segundo por agent.

**Input Sanitization:** Todos os inputs são sanitizados antes de serem armazenados no banco de dados. Comandos shell não são executados diretamente pelo servidor - são apenas retransmitidos para o Desktop Agent, que executa em sandbox isolado.

**DDoS Protection:** WebSocket Server implementa timeout de autenticação (30 segundos) e limita número de conexões simultâneas por IP (10 conexões). Conexões não autenticadas são fechadas automaticamente.

**SQL Injection:** Sistema utiliza Drizzle ORM com prepared statements, tornando SQL injection impossível. Queries raw SQL são evitadas completamente.

**XSS Protection:** Frontend sanitiza todos os outputs antes de renderizar no DOM. Metadata de logs e resultados de comandos são exibidos em blocos `<pre>` com escape automático.

---

## Monitoramento e Observabilidade

### Logs de Sistema

Servidor registra logs estruturados em formato JSON para facilitar parsing e análise:

```json
{
  "timestamp": "2025-12-01T14:05:21.616Z",
  "level": "info",
  "service": "DesktopAgentServer",
  "message": "Agent 120033 (DESKTOP-RUDSON) autenticado",
  "metadata": {
    "agentId": 120033,
    "userId": 1,
    "ipAddress": "192.168.1.100"
  }
}
```

Logs são enviados para stdout e podem ser coletados por sistemas como Elasticsearch, Datadog ou CloudWatch.

### Métricas

Sistema expõe métricas Prometheus em `/metrics`:

- `desktop_agents_total{status}` - Total de agents por status
- `desktop_commands_total{status,type}` - Total de comandos por status e tipo
- `desktop_command_duration_seconds{type}` - Histograma de tempo de execução
- `desktop_websocket_connections_total` - Total de conexões WebSocket ativas
- `desktop_heartbeat_failures_total` - Total de heartbeats falhados

### Health Checks

Endpoint `/api/health` retorna status de saúde do sistema:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-01T14:05:21.616Z",
  "checks": {
    "database": "healthy",
    "websocket": "healthy",
    "redis": "healthy"
  },
  "uptime": 86400
}
```

---

## Roadmap

### Funcionalidades Planejadas

**Q1 2026:**

- Suporte a múltiplos monitores em screenshots
- Gravação de vídeo da tela
- Transferência de arquivos bidirecional
- Controle remoto de mouse/teclado

**Q2 2026:**

- Automação de tarefas com agendamento
- Macros e scripts reutilizáveis
- Integração com CI/CD (executar testes em agents remotos)
- API pública para integrações externas

**Q3 2026:**

- Desktop Agent para Android/iOS
- Suporte a containers Docker
- Clustering de WebSocket Servers
- Replicação geográfica

---

## Conclusão

O Sistema de Controle de Desktop Agents representa uma solução completa e robusta para gerenciamento remoto de computadores. A arquitetura foi projetada para escalar horizontalmente, suportando milhares de agents simultâneos com latência mínima e alta disponibilidade.

A implementação atual cobre todos os requisitos essenciais: autenticação segura, comunicação em tempo real, auditoria completa e interface web moderna. Os testes automatizados garantem qualidade e previnem regressões, enquanto o monitoramento permite identificar e resolver problemas proativamente.

O sistema está pronto para produção e pode ser expandido facilmente com novas funcionalidades através da arquitetura modular baseada em tRPC e WebSocket.

---

**Documentação gerada por:** Manus AI  
**Versão:** 2.0.0  
**Data:** 01 de Dezembro de 2025
