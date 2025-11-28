# 📊 Prometheus + Grafana - Observabilidade Avançada

## 🎯 Objetivo

Integrar Prometheus e Grafana para observabilidade avançada do sistema, incluindo:
- Coleta automática de métricas
- Visualizações em tempo real
- Alertas configuráveis
- Dashboards customizados
- Histórico de longo prazo (30 dias)

---

## 🚀 Início Rápido

### 1. Iniciar Stack de Observabilidade

```bash
cd /home/ubuntu/servidor-automacao
docker-compose -f docker-compose.observability.yml up -d
```

### 2. Verificar Status

```bash
docker-compose -f docker-compose.observability.yml ps
```

### 3. Acessar Interfaces

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - **Usuário**: `admin`
  - **Senha**: `admin123`
- **Node Exporter**: http://localhost:9100/metrics

---

## 📋 Componentes

### Prometheus (porta 9090)

**Função**: Coleta e armazenamento de métricas time-series

**Targets configurados**:
- `servidor-automacao` - Métricas da aplicação (`/api/trpc/prometheus.metrics`)
- `node-exporter` - Métricas do sistema operacional
- `prometheus` - Auto-monitoramento
- `grafana` - Métricas do Grafana

**Retenção de dados**: 30 dias

### Grafana (porta 3001)

**Função**: Visualização e dashboards

**Dashboards pré-configurados**:
- **Servidor de Automação - Overview** - Dashboard principal com:
  - Gauges de CPU e Memory Usage
  - Gráfico de séries temporais
  - Status do serviço
  - Tempo médio de resposta da API
  - Alertas ativos

**Datasource**: Prometheus (configurado automaticamente)

### Node Exporter (porta 9100)

**Função**: Exporta métricas do sistema operacional

**Métricas disponíveis**:
- CPU, memória, disco, rede
- Processos, file descriptors
- Sistema de arquivos

---

## 🔧 Configuração

### Estrutura de Arquivos

```
servidor-automacao/
├── docker-compose.observability.yml
└── observability/
    ├── prometheus/
    │   ├── prometheus.yml      # Configuração principal
    │   └── alerts.yml          # Regras de alertas
    └── grafana/
        ├── provisioning/
        │   ├── datasources/
        │   │   └── prometheus.yml
        │   └── dashboards/
        │       └── dashboards.yml
        └── dashboards/
            └── servidor-automacao-overview.json
```

### Adicionar Novas Métricas

1. **No servidor**: Expor métrica no endpoint `/api/trpc/prometheus.metrics`
2. **No Prometheus**: Métrica será coletada automaticamente (scrape a cada 15s)
3. **No Grafana**: Criar visualização usando PromQL

### Criar Novo Dashboard

1. Acessar Grafana (http://localhost:3001)
2. Clicar em "+" → "Dashboard"
3. Adicionar painéis com queries PromQL
4. Salvar dashboard
5. Exportar JSON e salvar em `observability/grafana/dashboards/`

---

## 📊 Queries PromQL Úteis

### Métricas do Sistema

```promql
# CPU Usage atual
cpu_usage

# Memory Usage atual
memory_usage

# CPU Usage médio (última hora)
avg_over_time(cpu_usage[1h])

# Memory Usage máximo (últimas 24h)
max_over_time(memory_usage[24h])
```

### Métricas de API

```promql
# Tempo médio de resposta (últimos 5 min)
avg_over_time(api_response_time_ms[5m])

# Taxa de erros (últimos 5 min)
rate(api_errors_total[5m])

# Requisições por segundo
rate(api_requests_total[1m])
```

### Alertas

```promql
# Alertas ativos
ALERTS{alertstate="firing"}

# Alertas críticos
ALERTS{alertstate="firing",severity="critical"}
```

---

## 🚨 Alertas Configurados

### CPU Usage

- **HighCPUUsage**: CPU > 80% por 2 minutos (warning)
- **CriticalCPUUsage**: CPU > 95% por 1 minuto (critical)

### Memory Usage

- **HighMemoryUsage**: Memory > 85% por 2 minutos (warning)
- **CriticalMemoryUsage**: Memory > 95% por 1 minuto (critical)

### API Performance

- **SlowAPIResponse**: Tempo de resposta > 1s por 5 minutos (warning)
- **HighErrorRate**: Taxa de erro > 5% por 2 minutos (warning)

### Service Health

- **ServiceDown**: Aplicação down por 1 minuto (critical)
- **PrometheusTargetDown**: Target não responde por 2 minutos (warning)

---

## 🔍 Troubleshooting

### Prometheus não coleta métricas da aplicação

**Causa**: Endpoint `/api/trpc/prometheus.metrics` não acessível

**Solução**:
1. Verificar se aplicação está rodando: `curl http://localhost:3000/api/trpc/prometheus.metrics`
2. Verificar logs do Prometheus: `docker logs servidor-automacao-prometheus`
3. Verificar targets no Prometheus: http://localhost:9090/targets

### Grafana não mostra dados

**Causa**: Datasource não configurado ou sem dados no Prometheus

**Solução**:
1. Verificar datasource: Grafana → Configuration → Data Sources
2. Testar conexão com Prometheus
3. Verificar se Prometheus tem dados: http://localhost:9090/graph

### Docker não inicia

**Causa**: Portas já em uso ou Docker não instalado

**Solução**:
1. Verificar portas: `sudo netstat -tulpn | grep -E '9090|3001|9100'`
2. Instalar Docker: `curl -fsSL https://get.docker.com | sh`
3. Adicionar usuário ao grupo docker: `sudo usermod -aG docker $USER`

---

## 📈 Métricas Disponíveis

### Sistema

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| `cpu_usage` | Uso de CPU | % (0-100) |
| `memory_usage` | Uso de memória | % (0-100) |
| `disk_usage` | Uso de disco | % (0-100) |
| `network_rx_bytes` | Bytes recebidos | bytes |
| `network_tx_bytes` | Bytes enviados | bytes |

### Aplicação

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| `api_requests_total` | Total de requisições | count |
| `api_errors_total` | Total de erros | count |
| `api_response_time_ms` | Tempo de resposta | ms |
| `ml_predictions_total` | Total de predições ML | count |
| `ml_anomalies_detected` | Anomalias detectadas | count |

### Node Exporter

| Métrica | Descrição |
|---------|-----------|
| `node_cpu_seconds_total` | Tempo de CPU por core |
| `node_memory_MemAvailable_bytes` | Memória disponível |
| `node_disk_io_time_seconds_total` | Tempo de I/O de disco |
| `node_network_receive_bytes_total` | Bytes recebidos por interface |

---

## 🎨 Customização

### Alterar Intervalo de Scraping

Editar `observability/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s  # Alterar para 30s, 1m, etc
```

### Alterar Retenção de Dados

Editar `docker-compose.observability.yml`:

```yaml
command:
  - '--storage.tsdb.retention.time=30d'  # Alterar para 7d, 90d, etc
```

### Adicionar Novo Target

Editar `observability/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'meu-servico'
    static_configs:
      - targets: ['localhost:8080']
```

---

## 🔄 Comandos Úteis

```bash
# Iniciar stack
docker-compose -f docker-compose.observability.yml up -d

# Parar stack
docker-compose -f docker-compose.observability.yml down

# Ver logs
docker-compose -f docker-compose.observability.yml logs -f

# Reiniciar Prometheus (recarregar configuração)
docker-compose -f docker-compose.observability.yml restart prometheus

# Limpar volumes (apaga dados históricos)
docker-compose -f docker-compose.observability.yml down -v

# Atualizar imagens
docker-compose -f docker-compose.observability.yml pull
docker-compose -f docker-compose.observability.yml up -d
```

---

## 📊 Integração com Sistema de Alertas

O Prometheus pode enviar alertas para o sistema de alertas do Servidor de Automação via webhook.

### Configurar Webhook (Opcional)

1. Criar endpoint no servidor: `POST /api/prometheus/webhook`
2. Configurar Alertmanager (não incluído por padrão)
3. Alertmanager envia alertas para o endpoint
4. Sistema processa e envia via email/WhatsApp

---

## 💡 Boas Práticas

### Monitoramento

- ✅ Revisar dashboards diariamente
- ✅ Configurar alertas para métricas críticas
- ✅ Manter histórico de pelo menos 30 dias
- ✅ Fazer backup de configurações importantes

### Performance

- ✅ Não coletar métricas desnecessárias
- ✅ Usar labels com moderação (evita cardinalidade alta)
- ✅ Agregar dados antigos (downsampling)
- ✅ Monitorar uso de disco do Prometheus

### Segurança

- ✅ Alterar senha padrão do Grafana
- ✅ Usar HTTPS em produção
- ✅ Restringir acesso às portas (firewall)
- ✅ Fazer backup regular dos dashboards

---

## 🎯 Próximos Passos

Após configurar Prometheus/Grafana:

1. ✅ **Explorar dashboards** - Familiarizar-se com visualizações
2. ✅ **Configurar alertas** - Ajustar thresholds conforme necessário
3. ✅ **Criar dashboards customizados** - Para métricas específicas do negócio
4. ✅ **Integrar com Alertmanager** - Para roteamento avançado de alertas
5. ✅ **Configurar backup** - Dos dados e configurações

---

## 📚 Referências

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)

---

**Status**: ✅ Configuração completa  
**Prioridade**: 🔥 MÉDIA (P2)  
**Tempo de setup**: ~10 minutos  
**Benefícios**: Observabilidade profissional, análises históricas, alertas avançados
