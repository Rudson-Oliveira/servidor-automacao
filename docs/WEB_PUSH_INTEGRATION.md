# 🔔 Web Push Notifications - Guia de Integração

## Visão Geral

Sistema completo de notificações push usando Web Push API, permitindo notificar usuários sobre eventos importantes mesmo com o app fechado.

## Arquitetura

```
┌─────────────────┐
│   Frontend      │
│  (React PWA)    │
└────────┬────────┘
         │
         │ 1. Solicita permissão
         │ 2. Registra subscription
         │
┌────────▼────────┐
│  Service Worker │
│  (push listener)│
└────────┬────────┘
         │
         │ 3. Recebe push
         │ 4. Exibe notificação
         │
┌────────▼────────┐
│    Backend      │
│  (tRPC + VAPID) │
└────────┬────────┘
         │
         │ 5. Envia push via web-push
         │
┌────────▼────────┐
│  Push Service   │
│  (FCM/APNS)     │
└─────────────────┘
```

## Componentes

### 1. Backend (tRPC Router)

**Arquivo:** `server/routers/push-notifications.ts`

**Endpoints disponíveis:**

```typescript
// Obter chave pública VAPID
trpc.pushNotifications.getPublicKey.useQuery()

// Registrar subscription
trpc.pushNotifications.subscribe.useMutation({
  endpoint: string,
  keys: { p256dh: string, auth: string },
  userAgent?: string,
  deviceName?: string,
  enabledEvents?: string[]
})

// Cancelar subscription
trpc.pushNotifications.unsubscribe.useMutation({
  endpoint: string
})

// Listar subscriptions do usuário
trpc.pushNotifications.listSubscriptions.useQuery()

// Atualizar eventos habilitados
trpc.pushNotifications.updateEnabledEvents.useMutation({
  subscriptionId: number,
  enabledEvents: string[]
})

// Enviar notificação de teste
trpc.pushNotifications.sendTestNotification.useMutation()
```

### 2. Service Worker

**Arquivo:** `client/public/service-worker.js`

**Listeners implementados:**

```javascript
// Recebe push do servidor
self.addEventListener('push', (event) => {
  // Exibe notificação
  self.registration.showNotification(title, options)
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  // Abre URL ou foca janela existente
  clients.openWindow(url)
})
```

### 3. Frontend (React)

**Componente:** `client/src/components/NotificationPermission.tsx`

**Funcionalidades:**
- Solicita permissão do navegador
- Registra subscription no backend
- Exibe status atual
- Permite testar notificações

**Página:** `client/src/pages/NotificationSettings.tsx`

**Funcionalidades:**
- Configurar tipos de eventos
- Gerenciar dispositivos registrados
- Visualizar histórico de notificações

### 4. Helpers de Triggers

**Arquivo:** `server/helpers/push-triggers.ts`

**Funções disponíveis:**

```typescript
// Mensagem WhatsApp
await notifyWhatsAppMessage(userId, {
  sender: "João",
  message: "Olá, tudo bem?",
  timestamp: new Date()
})

// Tarefa concluída
await notifyTaskCompleted(userId, {
  taskName: "Backup de arquivos",
  result: "100 arquivos copiados com sucesso",
  duration: 5000
})

// Alerta de sistema
await notifySystemAlert(userId, {
  alertType: "warning",
  title: "Espaço em disco baixo",
  message: "Apenas 10% de espaço disponível",
  url: "/control"
})

// Comando desktop
await notifyDesktopCommand(userId, {
  command: "npm install",
  status: "success",
  output: "Pacotes instalados com sucesso"
})

// Sync Obsidian
await notifyObsidianSync(userId, {
  vaultName: "Meu Vault",
  notesCount: 150,
  status: "success",
  message: "Sincronização concluída"
})

// Erro crítico
await notifyCriticalError(userId, {
  component: "Database",
  error: "Conexão perdida",
  stackTrace: "..."
})

// Backup concluído
await notifyBackupCompleted(userId, {
  backupType: "Obsidian",
  filesCount: 250,
  size: "15 MB"
})

// Atualização disponível
await notifyUpdateAvailable(userId, {
  component: "Desktop Agent",
  currentVersion: "1.0.0",
  newVersion: "1.1.0",
  releaseNotes: "Correções de bugs"
})
```

## Como Usar

### 1. Ativar Notificações (Frontend)

```typescript
import { NotificationPermission } from "@/components/NotificationPermission";

function MyPage() {
  return (
    <div>
      <NotificationPermission />
    </div>
  );
}
```

### 2. Enviar Notificação (Backend)

**Exemplo 1: Em um router tRPC**

```typescript
import { notifyTaskCompleted } from "../helpers/push-triggers";

export const myRouter = router({
  processTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Processa tarefa
      const result = await processTask(input.taskId);
      
      // Notifica usuário
      await notifyTaskCompleted(ctx.user.id, {
        taskName: "Processamento de dados",
        result: `${result.count} registros processados`,
        duration: result.duration
      });
      
      return result;
    })
});
```

**Exemplo 2: Em um job agendado**

```typescript
import { notifyObsidianSync } from "../helpers/push-triggers";

async function syncObsidianJob(userId: number) {
  try {
    const result = await syncVault();
    
    await notifyObsidianSync(userId, {
      vaultName: result.vaultName,
      notesCount: result.notesCount,
      status: "success"
    });
  } catch (error) {
    await notifyObsidianSync(userId, {
      vaultName: "Vault",
      notesCount: 0,
      status: "error",
      message: error.message
    });
  }
}
```

**Exemplo 3: Em um webhook**

```typescript
import { notifyWhatsAppMessage } from "../helpers/push-triggers";

app.post("/webhook/whatsapp", async (req, res) => {
  const { userId, sender, message } = req.body;
  
  await notifyWhatsAppMessage(userId, {
    sender,
    message,
    timestamp: new Date()
  });
  
  res.json({ success: true });
});
```

## Tipos de Eventos

| Evento | Descrição | Trigger |
|--------|-----------|---------|
| `whatsapp_message` | Nova mensagem WhatsApp | Webhook WhatsApp |
| `task_completed` | Tarefa concluída | Finalização de job |
| `system_alert` | Alerta de sistema | Erro, warning, info |
| `desktop_command` | Comando desktop finalizado | Desktop Agent |
| `obsidian_sync` | Sync Obsidian concluído | Sync job |

## Configuração de Eventos

Usuários podem configurar quais eventos geram notificações em `/notifications`:

```typescript
const enabledEvents = [
  "whatsapp_message",  // ✅ Habilitado
  "task_completed",    // ✅ Habilitado
  "system_alert",      // ❌ Desabilitado
  "desktop_command",   // ✅ Habilitado
  "obsidian_sync"      // ❌ Desabilitado
];
```

## Banco de Dados

**Tabela:** `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSON NOT NULL,
  user_agent TEXT,
  device_name VARCHAR(255),
  enabled_events JSON NOT NULL,
  is_active INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP
);
```

## VAPID Keys

**Geradas automaticamente durante setup:**

```
VAPID_PUBLIC_KEY=BOC9YMeQErFYwxanllNh3dl3siNwViGhrYXma4CqRU8ZR8cs1FMAYKxMEyRrsMTXMRmSBmsZaQiko3sr7Q_4ie8
VAPID_PRIVATE_KEY=UWcB2dzzNcCuJOyT_Qlm0FJ9e3IQAsfacBao-pcriq4
```

**⚠️ Importante:** Não compartilhe a chave privada!

## Compatibilidade

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ (macOS 13+) | ✅ (iOS 16.4+) |
| Edge | ✅ | ✅ |
| Opera | ✅ | ✅ |

## Limitações

1. **Permissão do usuário:** Notificações só funcionam se o usuário conceder permissão
2. **Service Worker:** Requer HTTPS (exceto localhost)
3. **Tamanho da mensagem:** Limite de ~4KB por notificação
4. **Rate limiting:** Push services podem limitar envios em massa
5. **Bateria:** Notificações frequentes podem drenar bateria

## Boas Práticas

### 1. Respeite o usuário
- Não envie notificações excessivas
- Permita desativar por tipo de evento
- Forneça opção de desativar completamente

### 2. Mensagens relevantes
- Título claro e objetivo (máx 50 caracteres)
- Corpo informativo (máx 100 caracteres)
- Ações úteis (abrir, fechar)

### 3. Tratamento de erros
- Desative subscriptions com erro 410 (Gone)
- Implemente retry com backoff exponencial
- Monitore taxa de sucesso

### 4. Performance
- Envie notificações em batch quando possível
- Use índices no banco de dados
- Cache subscriptions ativas

## Troubleshooting

### Notificações não aparecem

1. Verificar permissão do navegador
2. Verificar se Service Worker está ativo
3. Verificar console do navegador por erros
4. Testar com endpoint `/api/trpc/pushNotifications.sendTestNotification`

### Subscription falha

1. Verificar VAPID keys
2. Verificar se está em HTTPS
3. Verificar se Service Worker está registrado
4. Limpar cache e tentar novamente

### Erro 410 (Gone)

- Subscription expirou ou foi revogada
- Remover do banco de dados
- Solicitar nova subscription

## Exemplos de Integração

### WhatsApp Router

```typescript
// server/routers/whatsapp.ts
import { notifyWhatsAppMessage } from "../helpers/push-triggers";

export const whatsappRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({ to: z.string(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await sendWhatsAppMessage(input.to, input.message);
      
      // Notifica remetente sobre envio
      await notifyWhatsAppMessage(ctx.user.id, {
        sender: "Você",
        message: `Mensagem enviada para ${input.to}`,
        timestamp: new Date()
      });
      
      return result;
    })
});
```

### Desktop Router

```typescript
// server/routers/desktop.ts
import { notifyDesktopCommand } from "../helpers/push-triggers";

export const desktopRouter = router({
  executeCommand: protectedProcedure
    .input(z.object({ command: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const output = await executeCommand(input.command);
        
        await notifyDesktopCommand(ctx.user.id, {
          command: input.command,
          status: "success",
          output
        });
        
        return { success: true, output };
      } catch (error) {
        await notifyDesktopCommand(ctx.user.id, {
          command: input.command,
          status: "error",
          output: error.message
        });
        
        throw error;
      }
    })
});
```

## Próximos Passos

- [ ] Implementar agrupamento de notificações
- [ ] Adicionar notificações silenciosas (background sync)
- [ ] Implementar badge count
- [ ] Adicionar rich notifications (imagens, botões)
- [ ] Implementar analytics de notificações
- [ ] Criar dashboard de métricas

## Referências

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [web-push library](https://github.com/web-push-libs/web-push)
- [VAPID Protocol](https://datatracker.ietf.org/doc/html/rfc8292)
