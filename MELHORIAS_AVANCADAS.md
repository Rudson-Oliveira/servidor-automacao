# 🚀 Melhorias Avançadas - Sistema de Auto-Evolução

**Data:** 28 de Novembro de 2025  
**Versão:** 2.0  
**Status:** ✅ Implementado e Testado

---

## 📋 Resumo Executivo

Este documento descreve as 3 melhorias avançadas implementadas no sistema de auto-evolução do Servidor de Automação, transformando-o em uma plataforma de monitoramento e predição de classe mundial.

### Melhorias Implementadas

1. **Alertas Proativos Multi-Canal** - Sistema completo de notificações inteligentes
2. **Machine Learning Preditivo** - Modelo LSTM para predição de séries temporais
3. **Integração Prometheus/Grafana/Sentry** - Monitoramento e tracking de erros profissional

---

## 1️⃣ Sistema de Alertas Proativos

### Visão Geral

Sistema completo de notificações multi-canal que envia alertas inteligentes baseados em anomalias detectadas, predições de falhas e eventos críticos do sistema.

### Funcionalidades

#### Canais de Notificação
- ✉️ **Email** via nodemailer (SMTP configurável)
- 📱 **WhatsApp** via webhook
- 🔔 **Push** via sistema interno de notificações

#### Configuração Granular
- **Severidade mínima**: low, medium, high, critical
- **Tipos de alertas**: anomalias, predições, erros, performance
- **Throttling**: Intervalo mínimo entre alertas (evita spam)
- **Horários permitidos**: Definir janela de horário (ex: 09:00-18:00)
- **Dias permitidos**: Escolher dias da semana (ex: segunda a sexta)

#### Templates Personalizáveis
- Templates por tipo de alerta e severidade
- Variáveis dinâmicas ({{title}}, {{message}}, {{severity}}, etc)
- Suporte para HTML em emails
- Templates do sistema (não podem ser deletados)

### Estrutura do Banco de Dados

```sql
-- Configurações de alertas por usuário
CREATE TABLE alert_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  email_address VARCHAR(320),
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number VARCHAR(20),
  push_enabled BOOLEAN DEFAULT true,
  min_severity ENUM('low','medium','high','critical') DEFAULT 'medium',
  anomaly_alerts BOOLEAN DEFAULT true,
  prediction_alerts BOOLEAN DEFAULT true,
  error_alerts BOOLEAN DEFAULT true,
  performance_alerts BOOLEAN DEFAULT true,
  throttle_minutes INT DEFAULT 15,
  allowed_hours JSON,
  allowed_days JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);

-- Histórico de alertas enviados
CREATE TABLE alert_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('anomaly','prediction','error','performance','custom'),
  severity ENUM('low','medium','high','critical'),
  title VARCHAR(255),
  message TEXT,
  metadata JSON,
  channels JSON,
  email_sent BOOLEAN DEFAULT false,
  email_error TEXT,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_error TEXT,
  push_sent BOOLEAN DEFAULT false,
  push_error TEXT,
  source_type VARCHAR(50),
  source_id INT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Templates de mensagens
CREATE TABLE alert_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  type ENUM('anomaly','prediction','error','performance','custom'),
  severity ENUM('low','medium','high','critical'),
  email_subject VARCHAR(255),
  email_body TEXT,
  email_html TEXT,
  whatsapp_message TEXT,
  push_title VARCHAR(100),
  push_body TEXT,
  variables JSON,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);
```

### Endpoints tRPC

```typescript
// Buscar configuração do usuário
const config = await trpc.alerts.getConfig.useQuery();

// Atualizar configuração
await trpc.alerts.updateConfig.useMutation({
  emailEnabled: true,
  minSeverity: "high",
  throttleMinutes: 30,
  allowedHours: { start: "09:00", end: "18:00" },
  allowedDays: [1, 2, 3, 4, 5], // Segunda a sexta
});

// Buscar histórico de alertas
const history = await trpc.alerts.getHistory.useQuery({ limit: 50 });

// Enviar alerta manualmente
await trpc.alerts.send.useMutation({
  type: "custom",
  severity: "high",
  title: "Alerta Importante",
  message: "Descrição do alerta",
  metadata: { key: "value" },
});

// Testar envio de alerta
await trpc.alerts.test.useMutation({});

// Gerenciar templates
const templates = await trpc.alerts.templates.list.useQuery();
await trpc.alerts.templates.create.useMutation({
  name: "anomalia_cpu_critica",
  type: "anomaly",
  severity: "critical",
  emailSubject: "🚨 [CRÍTICO] Anomalia de CPU Detectada",
  emailBody: "CPU atingiu {{value}}% (threshold: {{threshold}}%)",
  whatsappMessage: "*ALERTA CRÍTICO*\nCPU: {{value}}%",
  pushTitle: "Anomalia de CPU",
  pushBody: "CPU em {{value}}%",
  variables: ["value", "threshold"],
});
```

### Configuração SMTP

Adicionar variáveis de ambiente:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
WHATSAPP_WEBHOOK_URL=https://api.whatsapp.com/webhook
```

### Exemplo de Uso

```typescript
import { sendAlert } from "./server/services/alert-service";

// Enviar alerta de anomalia crítica
const result = await sendAlert({
  userId: 1,
  type: "anomaly",
  severity: "critical",
  title: "CPU em 95%",
  message: "CPU atingiu 95% de uso, muito acima do normal (média: 30%)",
  metadata: {
    currentValue: 95,
    threshold: 80,
    component: "server-01",
  },
  sourceType: "anomaly",
  sourceId: 123,
});

console.log(result);
// {
//   success: true,
//   channels: ["email", "push"],
//   errors: { whatsapp: "Webhook não configurado" }
// }
```

---

## 2️⃣ Machine Learning Preditivo

### Visão Geral

Modelo LSTM (Long Short-Term Memory) treinado com TensorFlow.js para predição de séries temporais de métricas do sistema (CPU, memória, disco, rede).

### Arquitetura do Modelo

```
Input: [20 pontos históricos] → LSTM(50 units) → Dropout(0.2) → Dense(1) → Output: [predição]
```

#### Configurações

- **Sequência de entrada**: 20 pontos históricos
- **Horizonte de predição**: 5 minutos à frente
- **Unidades LSTM**: 50
- **Épocas de treinamento**: 50
- **Batch size**: 32
- **Learning rate**: 0.001
- **Threshold de anomalia**: 2.0 desvios padrão

### Funcionalidades

#### Treinamento
- Normalização automática de dados (0-1)
- Criação de sequências com sliding window
- Divisão treino/validação (80/20)
- Métricas de avaliação (loss, MAE, RMSE, accuracy)
- Salvamento do modelo treinado

#### Predição
- Carregamento de modelo treinado
- Predição de valores futuros
- Cálculo de confiança
- Detecção automática de anomalias
- Salvamento de predições no banco

#### Retreinamento Automático
- Comparação de predições com valores reais
- Cálculo de acurácia em tempo real
- Retreinamento quando acurácia < 70%

### Estrutura do Banco de Dados

```sql
CREATE TABLE ml_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  component VARCHAR(200) NOT NULL DEFAULT 'system',
  predicted_value DECIMAL(10,2) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL, -- 0-1
  is_anomaly INT NOT NULL DEFAULT 0, -- 0 ou 1
  threshold DECIMAL(10,2),
  predicted_at TIMESTAMP NOT NULL, -- Quando foi feita
  predicted_for TIMESTAMP NOT NULL, -- Para qual momento
  actual_value DECIMAL(10,2), -- Preenchido depois
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Endpoints tRPC

```typescript
// Treinar modelo
const result = await trpc.ml.train.useMutation({
  metricName: "cpu_usage",
  component: "system",
});
// { success: true, metrics: { loss: 0.0123, mae: 0.0456, rmse: 0.0789, accuracy: 0.92 } }

// Fazer predição
const prediction = await trpc.ml.predict.useMutation({
  metricName: "cpu_usage",
  component: "system",
});
// { success: true, predictions: [{ timestamp, predictedValue, confidence, isAnomaly, threshold }] }

// Retreinar automaticamente
const retrain = await trpc.ml.autoRetrain.useMutation({
  metricName: "cpu_usage",
  component: "system",
});
// { success: true, retrained: true, message: "Modelo retreinado devido à baixa acurácia" }

// Buscar predições recentes
const predictions = await trpc.ml.getPredictions.useQuery({
  metricName: "cpu_usage",
  limit: 50,
  hoursAgo: 24,
});

// Calcular acurácia
const accuracy = await trpc.ml.getAccuracy.useQuery({
  metricName: "cpu_usage",
  hoursAgo: 24,
});
// { accuracy: 0.89, total: 100, correct: 89, avgError: 0.05 }

// Dashboard de ML
const dashboard = await trpc.ml.getDashboard.useQuery();
// {
//   totalPredictions: 1234,
//   anomaliesDetected: 45,
//   accuracy: "89.5%",
//   avgConfidence: "92.3%",
//   predictionsWithActual: 100,
//   correctPredictions: 89
// }

// Listar métricas disponíveis
const metrics = await trpc.ml.getAvailableMetrics.useQuery();
// [{ metricName: "cpu_usage", component: "system", dataPoints: 1000, canTrain: true }]
```

### Exemplo de Uso

```typescript
import { trainModel, predict, autoRetrain } from "./server/services/ml-prediction-service";

// 1. Treinar modelo com dados históricos
const metrics = await trainModel("cpu_usage", "system");
console.log(`Modelo treinado! Acurácia: ${(metrics.accuracy * 100).toFixed(2)}%`);

// 2. Fazer predição
const predictions = await predict("cpu_usage", "system");
console.log(predictions);
// [{
//   timestamp: 1732800000000,
//   predictedValue: 85.3,
//   confidence: 0.92,
//   isAnomaly: true,
//   threshold: 80.0
// }]

// 3. Retreinar se necessário
const retrained = await autoRetrain("cpu_usage", "system");
if (retrained) {
  console.log("Modelo retreinado!");
}
```

### Localização dos Modelos

Modelos treinados são salvos em:
```
/home/ubuntu/servidor-automacao/ml-models/{metricName}-{component}/model.json
```

---

## 3️⃣ Integração Prometheus/Grafana/Sentry

### Prometheus - Exportador de Métricas

#### Métricas Padrão do Node.js
- CPU usage
- Memory usage (heap, RSS, external)
- Event loop lag
- Garbage collection duration

#### Métricas Customizadas

```typescript
// Requisições HTTP
http_requests_total{method, path, status}
http_request_duration_seconds{method, path, status}

// Telemetria
telemetry_cpu_usage_percent
telemetry_memory_usage_mb
telemetry_disk_usage_percent
telemetry_network_in_mbps
telemetry_network_out_mbps

// Anomalias
anomalies_detected_total{metric_name, severity}

// Predições
predictions_total{metric_name, is_anomaly}
prediction_accuracy_percent{metric_name}

// Alertas
alerts_sent_total{type, severity, channel}

// Erros
system_errors_total{type, component}

// Tarefas
tasks_executed_total{status, type}
task_duration_seconds{type}
```

#### Endpoint de Scraping

```
GET /api/trpc/prometheus.metrics
```

Retorna métricas no formato Prometheus:

```
# HELP http_requests_total Total de requisições HTTP recebidas
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/api/status",status="200"} 1234

# HELP telemetry_cpu_usage_percent Uso de CPU em porcentagem
# TYPE telemetry_cpu_usage_percent gauge
telemetry_cpu_usage_percent 45.2
```

#### Configuração do Prometheus

Adicionar ao `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'servidor-automacao'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/trpc/prometheus.metrics'
```

#### Coleta Automática

Métricas são atualizadas automaticamente a cada 30 segundos.

### Grafana - Dashboards

#### Dashboards Recomendados

1. **Sistema Geral**
   - CPU, memória, disco, rede
   - Requisições HTTP
   - Erros do sistema

2. **Machine Learning**
   - Predições realizadas
   - Acurácia do modelo
   - Anomalias detectadas

3. **Alertas**
   - Alertas enviados por canal
   - Taxa de sucesso
   - Distribuição por severidade

#### Exemplo de Query PromQL

```promql
# CPU usage médio nas últimas 24h
avg_over_time(telemetry_cpu_usage_percent[24h])

# Taxa de requisições HTTP por minuto
rate(http_requests_total[1m])

# Anomalias detectadas nas últimas 6h
increase(anomalies_detected_total[6h])

# Acurácia do modelo de predição
avg(prediction_accuracy_percent{metric_name="cpu_usage"})
```

### Sentry - Tracking de Erros

#### Funcionalidades

- Tracking automático de exceções
- Performance monitoring
- Breadcrumbs de contexto
- Source maps para debugging
- Alertas customizados
- Error Boundary no React

#### Configuração

Adicionar variável de ambiente:

```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

#### Inicialização no Servidor

```typescript
import { initSentry } from "./server/services/sentry-service";

// Inicializar Sentry
initSentry(process.env.SENTRY_DSN);
```

#### Uso no Código

```typescript
import {
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  withSentry,
} from "./server/services/sentry-service";

// Capturar exceção
try {
  // código
} catch (error) {
  captureException(error, {
    component: "ml-prediction",
    metricName: "cpu_usage",
  });
}

// Capturar mensagem
captureMessage("Modelo retreinado com sucesso", "info");

// Adicionar breadcrumb
addBreadcrumb("Iniciando treinamento", "ml", "info", {
  metricName: "cpu_usage",
  dataPoints: 1000,
});

// Definir usuário
setUser({ id: 1, email: "user@example.com" });

// Wrapper para funções
const trainModelWithSentry = withSentry(trainModel, "trainModel");
```

#### Error Boundary React

```tsx
import { SentryErrorBoundary } from "./components/SentryErrorBoundary";

function App() {
  return (
    <SentryErrorBoundary>
      <YourApp />
    </SentryErrorBoundary>
  );
}
```

#### Tipos de Erros Rastreados

- **Database errors**: Erros de query SQL
- **API errors**: Erros de APIs externas
- **ML errors**: Erros de treinamento/predição
- **React errors**: Erros de componentes

---

## 📦 Dependências Instaladas

```json
{
  "dependencies": {
    "nodemailer": "^7.0.11",
    "@sentry/node": "^10.27.0",
    "@sentry/tracing": "^7.120.4",
    "prom-client": "^15.1.3",
    "@tensorflow/tfjs": "^4.22.0",
    "@tensorflow/tfjs-node": "^4.22.0"
  }
}
```

---

## 🧪 Testes

### Testes Unitários Criados

1. **server/alerts.test.ts** - Sistema de alertas
2. **server/ml-prediction.test.ts** - Machine learning preditivo

### Executar Testes

```bash
pnpm test server/alerts.test.ts
pnpm test server/ml-prediction.test.ts
```

---

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

```bash
# SMTP (para emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# WhatsApp (opcional)
WHATSAPP_WEBHOOK_URL=https://api.whatsapp.com/webhook

# Sentry (opcional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 2. Configurar Alertas

```typescript
// Atualizar configuração do usuário
await trpc.alerts.updateConfig.useMutation({
  emailEnabled: true,
  emailAddress: "admin@example.com",
  minSeverity: "high",
  anomalyAlerts: true,
  predictionAlerts: true,
  throttleMinutes: 15,
});
```

### 3. Treinar Modelo de ML

```typescript
// Treinar modelo com dados históricos
const result = await trpc.ml.train.useMutation({
  metricName: "cpu_usage",
  component: "system",
});

console.log(`Acurácia: ${(result.metrics.accuracy * 100).toFixed(2)}%`);
```

### 4. Configurar Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'servidor-automacao'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/trpc/prometheus.metrics'
```

### 5. Iniciar Grafana

```bash
docker run -d -p 3001:3000 grafana/grafana
```

Acessar: http://localhost:3001  
Adicionar Prometheus como data source: http://localhost:9090

---

## 📊 Métricas de Sucesso

### Alertas Proativos
- ✅ 3 canais de notificação (email, WhatsApp, push)
- ✅ Configuração granular por usuário
- ✅ Templates personalizáveis
- ✅ Throttling inteligente
- ✅ Histórico completo

### Machine Learning
- ✅ Modelo LSTM implementado
- ✅ Acurácia > 70% (retreinamento automático)
- ✅ Predição 5 minutos à frente
- ✅ Detecção automática de anomalias
- ✅ Dashboard de métricas

### Monitoramento
- ✅ Exportador Prometheus completo
- ✅ 15+ métricas customizadas
- ✅ Coleta automática a cada 30s
- ✅ Integração Sentry
- ✅ Error Boundary React

---

## 🎯 Próximos Passos

### Sugestões de Melhorias Futuras

1. **Alertas**
   - Integração com Slack
   - Integração com Telegram
   - SMS via Twilio
   - Webhooks customizados

2. **Machine Learning**
   - Modelos para outras métricas (memória, disco, rede)
   - Ensemble de modelos (combinar LSTM + Random Forest)
   - Transfer learning
   - AutoML para otimização de hiperparâmetros

3. **Monitoramento**
   - Dashboards Grafana pré-configurados
   - Alertas no Prometheus
   - Integração com PagerDuty
   - APM (Application Performance Monitoring)

---

## 📝 Conclusão

As 3 melhorias avançadas transformaram o Servidor de Automação em uma plataforma de monitoramento e predição de classe mundial, com:

- **Alertas inteligentes** que notificam proativamente sobre problemas
- **Machine learning** que prevê falhas antes que aconteçam
- **Monitoramento profissional** com Prometheus, Grafana e Sentry

O sistema agora é capaz de:
1. Detectar anomalias em tempo real
2. Prever falhas com 5 minutos de antecedência
3. Notificar automaticamente por múltiplos canais
4. Monitorar performance e erros em produção
5. Retreinar modelos automaticamente para manter alta acurácia

**Status:** ✅ Pronto para produção
