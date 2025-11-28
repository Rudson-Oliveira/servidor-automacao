# 🖥️ PLANO DE IMPLEMENTAÇÃO - AUTOMAÇÃO DESKTOP REMOTA

## 🎯 OBJETIVO REAL

Criar um sistema onde você pode **controlar seu computador local** (área de trabalho Windows/Mac/Linux) **remotamente** através da interface web do servidor.

**Exemplos de uso:**
- "Abra o Obsidian no meu PC e configure o vault"
- "Clique no botão 'Sincronizar' do aplicativo X"
- "Tire um screenshot da minha área de trabalho"
- "Abra o Chrome e acesse Gmail"
- "Execute este script Python no meu computador"

---

## 🏗️ ARQUITETURA - CLIENTE-SERVIDOR

```
┌─────────────────────────────────────────────────────────┐
│                    SEU NAVEGADOR                         │
│  - Interface web para dar comandos                       │
│  - Ver área de trabalho em tempo real                    │
│  - Criar workflows de automação                          │
└─────────────────────────────────────────────────────────┘
                            ↓ (HTTPS/WebSocket)
┌─────────────────────────────────────────────────────────┐
│              SERVIDOR WEB (Cloud/VPS)                    │
│  - Recebe comandos do navegador                          │
│  - Envia comandos para o Desktop Agent                   │
│  - Armazena workflows e histórico                        │
│  - Gerencia conexões WebSocket                           │
└─────────────────────────────────────────────────────────┘
                            ↓ (WebSocket/Polling)
┌─────────────────────────────────────────────────────────┐
│         DESKTOP AGENT (Seu computador local)             │
│  - Aplicativo rodando em background                      │
│  - Conecta com o servidor via WebSocket                  │
│  - Executa comandos recebidos:                           │
│    * Controlar mouse/teclado                             │
│    * Abrir aplicativos                                   │
│    * Tirar screenshots                                   │
│    * Executar scripts                                    │
│  - Envia screenshots/status de volta                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│           SUA ÁREA DE TRABALHO (Windows/Mac/Linux)       │
│  - Obsidian, Chrome, VS Code, etc                        │
│  - Arquivos, pastas, aplicativos                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENTES NECESSÁRIOS

### 1. **SERVIDOR WEB** (já existe)
- Backend tRPC com endpoints de controle
- WebSocket server para comunicação em tempo real
- Banco de dados para workflows e histórico

### 2. **DESKTOP AGENT** (NOVO - precisa criar)
- Aplicativo Electron ou Python que roda no seu PC
- Conecta com o servidor via WebSocket
- Executa comandos localmente
- Bibliotecas necessárias:
  - **PyAutoGUI** (Python) - Controlar mouse/teclado
  - **Electron** (Node.js) - Interface desktop
  - **Robot.js** (Node.js) - Automação desktop
  - **Puppeteer** (Node.js) - Controlar navegador local

### 3. **INTERFACE WEB** (NOVA)
- Página para enviar comandos
- Visualização da área de trabalho (screenshots)
- Editor de workflows

---

## 📋 ETAPAS DE IMPLEMENTAÇÃO

### **ETAPA 1: Desktop Agent - Fundação (3-4 horas)**

**Objetivo:** Criar aplicativo que roda no seu PC e se conecta ao servidor.

**Tecnologia escolhida:** Electron + Node.js (mais fácil de integrar)

**Tarefas:**
1. [ ] Criar projeto Electron básico
2. [ ] Implementar conexão WebSocket com o servidor
3. [ ] Criar sistema de autenticação (token único por usuário)
4. [ ] Implementar heartbeat (ping a cada 30s para manter conexão)
5. [ ] Criar tray icon (ícone na bandeja do sistema)
6. [ ] Adicionar auto-start (iniciar com o Windows/Mac)

**Código exemplo:**
```javascript
// desktop-agent/main.js
const { app, Tray, Menu } = require('electron');
const WebSocket = require('ws');

let ws;
let tray;

function connectToServer() {
  ws = new WebSocket('wss://seu-servidor.com/desktop-agent');
  
  ws.on('open', () => {
    console.log('Conectado ao servidor');
    // Autenticar com token
    ws.send(JSON.stringify({
      type: 'auth',
      token: 'SEU_TOKEN_UNICO'
    }));
  });
  
  ws.on('message', (data) => {
    const command = JSON.parse(data);
    executeCommand(command);
  });
  
  ws.on('close', () => {
    console.log('Desconectado. Reconectando em 5s...');
    setTimeout(connectToServer, 5000);
  });
}

app.whenReady().then(() => {
  // Criar ícone na bandeja
  tray = new Tray('icon.png');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Status: Conectado', enabled: false },
    { label: 'Sair', click: () => app.quit() }
  ]));
  
  connectToServer();
});
```

---

### **ETAPA 2: Desktop Agent - Controle de Mouse/Teclado (2-3 horas)**

**Objetivo:** Implementar comandos básicos de controle.

**Bibliotecas:**
- **robotjs** (Node.js) - Controlar mouse e teclado
- **screenshot-desktop** (Node.js) - Tirar screenshots

**Comandos a implementar:**
1. [ ] `moveMouse(x, y)` - Mover mouse
2. [ ] `click(x, y, button)` - Clicar (left/right/middle)
3. [ ] `doubleClick(x, y)` - Duplo clique
4. [ ] `type(text)` - Digitar texto
5. [ ] `keyPress(key)` - Pressionar tecla (Enter, Ctrl+C, etc)
6. [ ] `screenshot()` - Tirar screenshot
7. [ ] `getScreenSize()` - Obter resolução da tela

**Código exemplo:**
```javascript
// desktop-agent/automation.js
const robot = require('robotjs');
const screenshot = require('screenshot-desktop');

function executeCommand(command) {
  switch(command.type) {
    case 'moveMouse':
      robot.moveMouse(command.x, command.y);
      break;
      
    case 'click':
      robot.moveMouse(command.x, command.y);
      robot.mouseClick(command.button || 'left');
      break;
      
    case 'type':
      robot.typeString(command.text);
      break;
      
    case 'keyPress':
      robot.keyTap(command.key, command.modifiers || []);
      break;
      
    case 'screenshot':
      screenshot().then((img) => {
        // Enviar screenshot de volta para o servidor
        ws.send(JSON.stringify({
          type: 'screenshot',
          data: img.toString('base64')
        }));
      });
      break;
  }
}
```

---

### **ETAPA 3: Desktop Agent - Controle de Aplicativos (2-3 horas)**

**Objetivo:** Abrir, fechar e controlar aplicativos.

**Comandos a implementar:**
1. [ ] `openApp(appName)` - Abrir aplicativo
2. [ ] `closeApp(appName)` - Fechar aplicativo
3. [ ] `focusWindow(title)` - Focar janela específica
4. [ ] `getActiveWindow()` - Obter janela ativa
5. [ ] `listRunningApps()` - Listar apps abertos

**Código exemplo:**
```javascript
// desktop-agent/apps.js
const { exec } = require('child_process');
const activeWin = require('active-win');

function openApp(appName) {
  // Windows
  if (process.platform === 'win32') {
    exec(`start ${appName}`);
  }
  // Mac
  else if (process.platform === 'darwin') {
    exec(`open -a "${appName}"`);
  }
  // Linux
  else {
    exec(appName);
  }
}

function closeApp(appName) {
  // Windows
  if (process.platform === 'win32') {
    exec(`taskkill /IM ${appName}.exe /F`);
  }
  // Mac/Linux
  else {
    exec(`pkill -f ${appName}`);
  }
}

async function getActiveWindow() {
  const win = await activeWin();
  return {
    title: win.title,
    app: win.owner.name,
    bounds: win.bounds
  };
}
```

---

### **ETAPA 4: Desktop Agent - Obsidian Integration (1-2 horas)**

**Objetivo:** Comandos específicos para Obsidian.

**Comandos a implementar:**
1. [ ] `openObsidian(vaultPath)` - Abrir Obsidian com vault específico
2. [ ] `createObsidianNote(title, content)` - Criar nota
3. [ ] `openObsidianSettings()` - Abrir configurações
4. [ ] `installObsidianPlugin(pluginId)` - Instalar plugin

**Código exemplo:**
```javascript
// desktop-agent/obsidian.js
const fs = require('fs');
const path = require('path');

function openObsidian(vaultPath) {
  // Obsidian usa URI scheme: obsidian://open?vault=VaultName
  const vaultName = path.basename(vaultPath);
  const uri = `obsidian://open?vault=${encodeURIComponent(vaultName)}`;
  
  if (process.platform === 'win32') {
    exec(`start ${uri}`);
  } else if (process.platform === 'darwin') {
    exec(`open "${uri}"`);
  } else {
    exec(`xdg-open "${uri}"`);
  }
}

function createObsidianNote(vaultPath, title, content) {
  const notePath = path.join(vaultPath, `${title}.md`);
  fs.writeFileSync(notePath, content, 'utf8');
  
  // Abrir a nota no Obsidian
  const uri = `obsidian://open?vault=${encodeURIComponent(path.basename(vaultPath))}&file=${encodeURIComponent(title)}`;
  exec(`start ${uri}`);
}
```

---

### **ETAPA 5: Servidor - Backend WebSocket (2-3 horas)**

**Objetivo:** Criar servidor WebSocket para comunicação com Desktop Agent.

**Tarefas:**
1. [ ] Criar WebSocket server (ws ou socket.io)
2. [ ] Implementar autenticação por token
3. [ ] Criar endpoints tRPC para enviar comandos
4. [ ] Armazenar conexões ativas no banco
5. [ ] Implementar fila de comandos

**Código exemplo:**
```typescript
// server/services/desktopAgentServer.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

// Map de conexões ativas: userId -> WebSocket
const activeConnections = new Map<number, WebSocket>();

wss.on('connection', (ws) => {
  let userId: number | null = null;
  
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    
    if (msg.type === 'auth') {
      // Validar token e obter userId
      userId = validateToken(msg.token);
      if (userId) {
        activeConnections.set(userId, ws);
        ws.send(JSON.stringify({ type: 'auth', success: true }));
      }
    }
    
    if (msg.type === 'screenshot') {
      // Salvar screenshot no S3 ou banco
      saveScreenshot(userId, msg.data);
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      activeConnections.delete(userId);
    }
  });
});

// Função para enviar comando ao Desktop Agent
export function sendCommandToDesktop(userId: number, command: any) {
  const ws = activeConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(command));
    return true;
  }
  return false;
}
```

---

### **ETAPA 6: Servidor - Endpoints tRPC (1-2 horas)**

**Objetivo:** Criar API para controlar Desktop Agent.

**Endpoints a criar:**
```typescript
// server/routers/desktopControl.ts
export const desktopControlRouter = router({
  // Verificar se Desktop Agent está conectado
  isConnected: protectedProcedure.query(({ ctx }) => {
    return isDesktopAgentConnected(ctx.user.id);
  }),
  
  // Enviar comando de clique
  click: protectedProcedure
    .input(z.object({ x: z.number(), y: z.number() }))
    .mutation(({ ctx, input }) => {
      return sendCommandToDesktop(ctx.user.id, {
        type: 'click',
        x: input.x,
        y: input.y
      });
    }),
  
  // Digitar texto
  type: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(({ ctx, input }) => {
      return sendCommandToDesktop(ctx.user.id, {
        type: 'type',
        text: input.text
      });
    }),
  
  // Tirar screenshot
  screenshot: protectedProcedure
    .mutation(({ ctx }) => {
      return sendCommandToDesktop(ctx.user.id, {
        type: 'screenshot'
      });
    }),
  
  // Abrir aplicativo
  openApp: protectedProcedure
    .input(z.object({ appName: z.string() }))
    .mutation(({ ctx, input }) => {
      return sendCommandToDesktop(ctx.user.id, {
        type: 'openApp',
        appName: input.appName
      });
    }),
  
  // Abrir Obsidian
  openObsidian: protectedProcedure
    .input(z.object({ vaultPath: z.string() }))
    .mutation(({ ctx, input }) => {
      return sendCommandToDesktop(ctx.user.id, {
        type: 'openObsidian',
        vaultPath: input.vaultPath
      });
    }),
});
```

---

### **ETAPA 7: Frontend - Interface de Controle (3-4 horas)**

**Objetivo:** Criar interface web para controlar o desktop.

**Páginas a criar:**

1. **`/desktop/controle`** - Controle remoto
   - Visualização da área de trabalho (screenshot atualizado)
   - Botões de controle (mouse, teclado)
   - Campo para digitar texto
   - Botões de atalhos (Ctrl+C, Ctrl+V, Enter)

2. **`/desktop/apps`** - Gerenciar aplicativos
   - Lista de apps instalados
   - Botões: Abrir, Fechar, Focar
   - Atalhos para apps comuns (Obsidian, Chrome, VS Code)

3. **`/desktop/workflows`** - Workflows automatizados
   - Criar sequências de comandos
   - Exemplo: "Abrir Obsidian → Criar nota → Digitar conteúdo"

**Código exemplo:**
```tsx
// client/src/pages/DesktopControl.tsx
export default function DesktopControl() {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const clickMutation = trpc.desktopControl.click.useMutation();
  const screenshotMutation = trpc.desktopControl.screenshot.useMutation();
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    clickMutation.mutate({ x, y });
  };
  
  const takeScreenshot = async () => {
    await screenshotMutation.mutateAsync();
    // Screenshot será enviado via WebSocket e atualizado automaticamente
  };
  
  return (
    <div>
      <h1>Controle Remoto Desktop</h1>
      
      {/* Visualização da área de trabalho */}
      <canvas 
        onClick={handleCanvasClick}
        style={{ border: '1px solid black', cursor: 'crosshair' }}
      />
      
      {/* Controles */}
      <div>
        <Button onClick={takeScreenshot}>Atualizar Screenshot</Button>
        <Button onClick={() => trpc.desktopControl.openApp.mutate({ appName: 'Obsidian' })}>
          Abrir Obsidian
        </Button>
      </div>
    </div>
  );
}
```

---

### **ETAPA 8: Segurança e Autenticação (1-2 horas)**

**Objetivo:** Garantir que apenas você pode controlar seu desktop.

**Medidas de segurança:**
1. [ ] Token único por usuário (gerado no servidor)
2. [ ] Criptografia TLS/SSL (wss://)
3. [ ] Timeout de inatividade (desconectar após 1h sem uso)
4. [ ] Confirmação para comandos perigosos (fechar apps, deletar arquivos)
5. [ ] Log de todos os comandos executados

---

## 📊 RESUMO DAS ETAPAS

| Etapa | Descrição | Tempo | Complexidade |
|-------|-----------|-------|--------------|
| 1 | Desktop Agent - Fundação | 3-4h | Média |
| 2 | Desktop Agent - Mouse/Teclado | 2-3h | Média |
| 3 | Desktop Agent - Aplicativos | 2-3h | Média |
| 4 | Desktop Agent - Obsidian | 1-2h | Baixa |
| 5 | Servidor - WebSocket | 2-3h | Alta |
| 6 | Servidor - Endpoints tRPC | 1-2h | Baixa |
| 7 | Frontend - Interface | 3-4h | Média |
| 8 | Segurança | 1-2h | Média |
| **TOTAL** | | **15-23h** | |

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

### **MVP (Mínimo Viável) - 8-10 horas:**
1. ✅ Etapa 1: Desktop Agent - Fundação
2. ✅ Etapa 2: Desktop Agent - Mouse/Teclado
3. ✅ Etapa 5: Servidor - WebSocket
4. ✅ Etapa 6: Servidor - Endpoints básicos
5. ✅ Etapa 7: Frontend - Interface simples

**Com o MVP você consegue:**
- Conectar Desktop Agent ao servidor
- Clicar e digitar remotamente
- Tirar screenshots
- Controlar mouse/teclado

### **Versão Completa - 15-23 horas:**
- Todas as etapas
- Controle total de aplicativos
- Integração específica com Obsidian
- Workflows automatizados

---

## ⚠️ LIMITAÇÕES E DESAFIOS

### **Desafios Técnicos:**
1. **Latência** - Pode haver delay entre comando e execução (depende da internet)
2. **Resolução** - Screenshot pode ficar grande (comprimir antes de enviar)
3. **Segurança** - Desktop Agent tem acesso total ao PC (precisa proteger bem)
4. **Firewall** - Pode bloquear conexão WebSocket (usar porta 443/HTTPS)

### **Limitações:**
1. ❌ Não funciona se Desktop Agent não estiver rodando
2. ❌ Não funciona se PC estiver desligado
3. ❌ Pode ter problemas com apps que bloqueiam automação
4. ❌ Screenshots consomem banda (especialmente em 4K)

---

## 🎯 ALTERNATIVAS MAIS SIMPLES

Se você quer algo **mais rápido e simples**, considere usar ferramentas existentes:

### **Opção A: Usar Playwright MCP + Obsidian Local**
- Playwright já está integrado via MCP
- Pode controlar navegador local
- Obsidian tem API REST local
- **Tempo:** 2-3 horas

### **Opção B: Usar AnyDesk/TeamViewer API**
- Integrar com API deles
- Controle remoto já pronto
- Você só cria a interface web
- **Tempo:** 3-4 horas

### **Opção C: Usar Obsidian URI Scheme**
- Obsidian aceita comandos via URI
- Não precisa de Desktop Agent
- Limitado a Obsidian apenas
- **Tempo:** 1 hora

---

## 🤔 PRÓXIMA DECISÃO

**Qual caminho você prefere?**

1. **Desktop Agent completo** (15-23h) - Controle total do desktop
2. **MVP Desktop Agent** (8-10h) - Controle básico (mouse, teclado, screenshots)
3. **Alternativa A** (2-3h) - Playwright + Obsidian API local
4. **Alternativa B** (3-4h) - Integração com AnyDesk/TeamViewer
5. **Alternativa C** (1h) - Apenas Obsidian URI Scheme

Me diga qual você prefere e eu começo a implementar! 🚀
