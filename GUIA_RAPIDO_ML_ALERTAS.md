# Guia Rápido: Machine Learning e Alertas Proativos

**Sistema de Predição de Anomalias e Auto-Healing Preventivo**

---

## 🎯 Visão Geral

Este sistema combina **Machine Learning preditivo** com **alertas proativos multi-canal** para criar uma solução de auto-healing que **prevê falhas 5 minutos antes** e **corrige automaticamente** antes que problemas afetem os usuários.

### Funcionalidades Principais

O sistema oferece três capacidades revolucionárias integradas. Primeiro, **modelos LSTM** (Long Short-Term Memory) treinam com dados históricos de telemetria para identificar padrões normais de comportamento do sistema. Segundo, o **detector de anomalias** monitora métricas em tempo real e compara com predições do modelo, identificando desvios significativos que indicam problemas iminentes. Terceiro, o **sistema de alertas multi-canal** notifica administradores via email, WhatsApp ou push notifications assim que anomalias são detectadas, permitindo ação preventiva.

A arquitetura foi projetada para **zero downtime**. Quando o modelo ML prevê que o uso de CPU ultrapassará 90% nos próximos 5 minutos, o sistema pode automaticamente escalar recursos, redistribuir carga ou executar scripts de correção antes que o problema se manifeste para os usuários finais.

---

## 🚀 Configuração Rápida (15 minutos)

### Passo 1: Treinar Modelos ML (5 minutos)

Acesse o **Dashboard ML** em `http://localhost:3000/ml-dashboard` e clique em **"Iniciar Treinamento"**. O sistema treinará dois modelos LSTM automaticamente:

| Modelo | Métrica | Tempo de Treinamento | Acurácia Esperada |
|--------|---------|---------------------|-------------------|
| CPU Usage | `cpu_usage` | ~60 segundos | >75% |
| Memory Usage | `memory_usage` | ~60 segundos | >70% |

O treinamento requer **mínimo 30 pontos de dados históricos** (aproximadamente 15 minutos de telemetria). Se você acabou de instalar o sistema, aguarde a coleta de dados antes de treinar. O sistema coleta métricas automaticamente a cada 30 segundos.

**Retreinamento Automático**: Modelos com acurácia inferior a 70% são retreinados automaticamente a cada 24 horas. Você pode monitorar a acurácia em tempo real no dashboard de telemetria (`/telemetry`).

### Passo 2: Configurar SMTP (5 minutos)

Para enviar alertas por email, configure as variáveis de ambiente SMTP. Recomendamos usar **Gmail com senha de app** para simplicidade e confiabilidade.

#### Criar Senha de App do Gmail

1. Acesse [Configurações de Segurança do Google](https://myaccount.google.com/security)
2. Ative **Verificação em duas etapas** (se ainda não estiver ativa)
3. Vá em **Senhas de app** → **Selecionar app** → **Outro (nome personalizado)**
4. Digite "Servidor Automação" e clique em **Gerar**
5. Copie a senha de 16 caracteres gerada

#### Adicionar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto e adicione:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Senha de app de 16 dígitos
SMTP_FROM=noreply@automacao.local
```

**Importante**: Reinicie o servidor após adicionar as variáveis de ambiente:

```bash
pnpm dev
```

### Passo 3: Configurar Alertas (5 minutos)

Acesse **Configuração de Alertas** em `http://localhost:3000/alerts-config` e:

1. **Ative alertas por email** (toggle no topo da página)
2. **Digite seu email** para receber notificações
3. **Configure tipos de alertas**:
   - ✅ Anomalias Detectadas (recomendado)
   - ✅ Predições de Falhas (recomendado)
   - ✅ Erros do Sistema (recomendado)
   - ⚠️ Performance (opcional, pode gerar muitos alertas)

4. **Defina severidade mínima**: Recomendamos **"Média"** para evitar spam de alertas de baixa prioridade

5. **Teste o envio**: Clique em **"Testar"** para enviar um email de teste e confirmar que a configuração está correta

---

## 📊 Como Funciona

### Fluxo de Predição e Alerta

O sistema opera em um ciclo contínuo de monitoramento, predição e ação. A cada 30 segundos, o **coletor de telemetria** registra métricas de CPU, memória, disco e rede no banco de dados. Simultaneamente, o **serviço de predição ML** consulta os modelos treinados para prever valores futuros dessas métricas nos próximos 5 minutos.

Quando uma predição indica que uma métrica ultrapassará o threshold crítico (por exemplo, CPU > 90%), o **detector de anomalias** calcula o desvio padrão entre o valor previsto e o padrão histórico. Se o desvio for maior que 2 sigma, uma anomalia é registrada com severidade baseada na magnitude do desvio.

O **orquestrador de alertas** então verifica as configurações do usuário (throttling, horários permitidos, severidade mínima) e decide se deve enviar notificação. Se aprovado, o alerta é enviado via email, WhatsApp ou push notification, dependendo das preferências configuradas. Paralelamente, o **sistema de auto-healing** pode executar scripts de correção automaticamente para resolver o problema antes que ele afete os usuários.

### Exemplo Prático

Imagine que o sistema detecta um **memory leak** em um processo. O fluxo seria:

**T+0min**: Modelo ML prevê que memória atingirá 95% em 5 minutos (atualmente em 70%)  
**T+0min**: Anomalia detectada com severidade **"high"**  
**T+0min**: Alerta enviado por email: *"⚠️ Predição de Falha: Memória atingirá 95% em 5 minutos"*  
**T+1min**: Auto-healing executa script `restart-leaky-process.sh`  
**T+2min**: Memória volta para 45%  
**T+5min**: Alerta de resolução: *"✅ Problema resolvido automaticamente"*  

**Resultado**: Zero downtime. Usuários nem perceberam o problema.

---

## 🔧 Configurações Avançadas

### Throttling de Alertas

Para evitar spam de notificações, o sistema implementa **throttling inteligente**. Por padrão, alertas do mesmo tipo são enviados no máximo a cada **15 minutos**. Você pode ajustar esse intervalo em **Configurações de Alertas** → **Throttling**.

| Intervalo | Uso Recomendado |
|-----------|-----------------|
| 5 minutos | Ambientes críticos de produção |
| 15 minutos | Uso geral (padrão) |
| 30 minutos | Ambientes de desenvolvimento |
| 60 minutos | Sistemas estáveis com poucos problemas |

### Horários Permitidos

Configure **horários de silêncio** para evitar alertas durante a madrugada. Por exemplo, receber alertas apenas das 08:00 às 22:00 em dias úteis. Alertas críticos (severidade "critical") **sempre** são enviados, independente do horário.

### Severidade de Alertas

O sistema classifica alertas em quatro níveis:

**Low (Baixa)**: Desvios pequenos que não requerem ação imediata. Exemplo: CPU em 65% quando o normal é 55%.

**Medium (Média)**: Anomalias que merecem atenção mas não são urgentes. Exemplo: Memória em 80% quando o normal é 60%.

**High (Alta)**: Problemas que requerem ação em breve. Exemplo: Disco com 90% de uso quando o normal é 70%.

**Critical (Crítica)**: Falhas iminentes que requerem ação imediata. Exemplo: Predição de CPU atingir 100% em 2 minutos.

---

## 📈 Monitoramento e Métricas

### Dashboard de Telemetria

Acesse `http://localhost:3000/telemetry` para visualizar:

- **Gráficos de métricas em tempo real** (CPU, memória, disco, rede)
- **Predições do modelo ML** (linha pontilhada nos gráficos)
- **Anomalias detectadas** (marcadores vermelhos)
- **Acurácia dos modelos** (atualizada a cada predição)
- **Padrões aprendidos** (comportamento normal vs anormal)

### Dashboard de Performance

Acesse `http://localhost:3000/performance` para análise detalhada:

- **Componentes mais lentos** do sistema
- **Tempo de resposta** de endpoints
- **Taxa de erro** por componente
- **Relatórios exportáveis** em CSV/JSON

---

## 🛠️ Troubleshooting

### Problema: Modelos não treinam (erro "dados insuficientes")

**Causa**: Sistema precisa de mínimo 30 pontos de dados históricos (15 minutos de telemetria).

**Solução**: Aguarde 15-20 minutos após iniciar o servidor e tente novamente. Verifique se o coletor de telemetria está ativo em `/telemetry`.

### Problema: Emails não são enviados

**Causa 1**: Credenciais SMTP incorretas ou senha de app inválida.

**Solução**: Verifique se a senha de app do Gmail foi copiada corretamente (16 caracteres sem espaços). Teste com `trpc.alerts.test.useMutation()`.

**Causa 2**: Gmail bloqueando acesso de "apps menos seguros".

**Solução**: Use **senha de app** ao invés da senha normal da conta. Senhas de app são geradas especificamente para aplicações e não requerem desabilitar segurança.

**Causa 3**: Firewall bloqueando porta 587.

**Solução**: Verifique se a porta SMTP (587 ou 465) está aberta no firewall. Teste com `telnet smtp.gmail.com 587`.

### Problema: Muitos alertas (spam)

**Causa**: Throttling muito baixo ou severidade mínima muito baixa.

**Solução**: Aumente o intervalo de throttling para 30-60 minutos e defina severidade mínima como **"High"** ou **"Critical"**. Desative alertas de performance se não forem necessários.

### Problema: Acurácia do modelo muito baixa (<50%)

**Causa**: Dados de treinamento insuficientes ou comportamento do sistema muito irregular.

**Solução**: Aguarde mais dados históricos (recomendado 24-48 horas). O sistema retreinará automaticamente. Se o problema persistir, pode indicar que o sistema tem comportamento caótico e ML pode não ser adequado.

---

## 🔗 Links Úteis

| Página | URL | Descrição |
|--------|-----|-----------|
| **Dashboard ML** | `/ml-dashboard` | Visão geral e ações rápidas |
| **Treinamento ML** | `/ml-training` | Treinar modelos individualmente |
| **Config. Alertas** | `/alerts-config` | Configurar SMTP e preferências |
| **Telemetria** | `/telemetry` | Gráficos e métricas em tempo real |
| **Performance** | `/performance` | Análise detalhada de performance |
| **Auto-Healing** | `/control` | Logs de correções automáticas |

---

## 📞 Suporte

Para dúvidas, problemas ou sugestões:

- **Documentação Completa**: Veja `MEMORIA_PROJETO.md` para arquitetura detalhada
- **Testes Automatizados**: Execute `pnpm test` para validar funcionamento
- **Logs do Sistema**: Verifique console do servidor para erros detalhados
- **Issues**: Reporte problemas no repositório do projeto

---

**Última Atualização**: 28 de Novembro de 2025  
**Versão**: 1.0.0  
**Autor**: Manus AI
