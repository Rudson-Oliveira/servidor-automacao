# 🧪 Testes de Validação do Sistema

Este diretório contém scripts automatizados para validar o funcionamento completo do **Servidor de Automação** após deploy.

---

## 📋 **TESTES DISPONÍVEIS**

### 1. **test-health.ts** - Health Endpoint
Valida se o servidor está respondendo corretamente.

**Verifica:**
- ✅ Status HTTP 200
- ✅ Tempo de resposta < 5s
- ✅ Status = "ok"
- ✅ Timestamp válido
- ✅ Uptime > 0
- ✅ Memória válida (0-100%)
- ✅ Database conectado

**Executar:**
```bash
npx tsx tests/test-health.ts
```

---

### 2. **test-database.ts** - Conexão com Banco de Dados
Valida se o banco de dados está conectado e respondendo.

**Verifica:**
- ✅ Database conectado no health check
- ✅ Query simples executada com sucesso (GET /api/skills)
- ✅ Dados retornados
- ✅ Tempo de resposta adequado

**Executar:**
```bash
npx tsx tests/test-database.ts
```

---

### 3. **test-agent-registration.ts** - Registro de Desktop Agent
Valida se o endpoint de registro de Desktop Agent está funcionando.

**Verifica:**
- ✅ Registro bem-sucedido
- ✅ Agent ID gerado
- ✅ Token de 64 caracteres hexadecimais gerado
- ✅ Mensagem de sucesso retornada
- ✅ Tempo de resposta < 10s

**Executar:**
```bash
npx tsx tests/test-agent-registration.ts
```

---

### 4. **test-tensorflow.ts** - TensorFlow
Verifica se o TensorFlow está carregado e funcionando.

**Verifica:**
- ✅ TensorFlow carregado
- ✅ Versão disponível
- ✅ Backend disponível
- ✅ Tempo de resposta adequado

**Executar:**
```bash
npx tsx tests/test-tensorflow.ts
```

**Nota:** Este teste pode retornar "INCONCLUSIVO" se o health endpoint não incluir informações sobre TensorFlow.

---

### 5. **test-auto-healing.ts** - Auto-Healing
Simula falhas e verifica se o sistema se recupera automaticamente.

**Verifica:**
- ✅ Estado inicial OK
- ✅ Database sempre conectado
- ✅ Maioria das requisições (80%+) bem-sucedidas
- ✅ Sistema recuperado após stress
- ✅ Sistema estável (sem reinicializações)

**Executar:**
```bash
npx tsx tests/test-auto-healing.ts
```

---

## 🚀 **EXECUTAR TODOS OS TESTES**

### Opção 1: Script Bash (Recomendado)
```bash
cd /home/ubuntu/servidor-automacao
./tests/run-all-tests.sh
```

### Opção 2: Executar Manualmente
```bash
cd /home/ubuntu/servidor-automacao

npx tsx tests/test-health.ts
npx tsx tests/test-database.ts
npx tsx tests/test-agent-registration.ts
npx tsx tests/test-tensorflow.ts
npx tsx tests/test-auto-healing.ts
```

---

## 🌐 **CONFIGURAÇÃO**

### Variáveis de Ambiente

Por padrão, os testes usam:
```
SERVER_URL=https://servidor-automacao.onrender.com
DESKTOP_AGENT_REGISTER_TOKEN=manus-agent-register-2024
```

Para testar outro servidor:
```bash
export SERVER_URL=https://seu-servidor.com
./tests/run-all-tests.sh
```

---

## 📊 **INTERPRETAÇÃO DOS RESULTADOS**

### Exit Codes
- **0** = Teste passou ✅
- **1** = Teste falhou ❌
- **2** = Teste inconclusivo ⚠️

### Taxa de Sucesso
- **100%** = Sistema perfeito 🎉
- **80-99%** = Sistema funcional com ressalvas ⚠️
- **< 80%** = Sistema com problemas críticos ❌

---

## 🛠️ **TROUBLESHOOTING**

### Erro: "Connection refused"
- ✅ Verifique se o servidor está online
- ✅ Confirme a URL do servidor
- ✅ Verifique se o deploy foi concluído

### Erro: "Database not connected"
- ✅ Verifique variável `DATABASE_URL` no Render
- ✅ Confirme que o banco de dados está online
- ✅ Verifique logs do servidor

### Erro: "Timeout"
- ✅ Servidor pode estar sobrecarregado
- ✅ Aguarde alguns minutos e tente novamente
- ✅ Verifique se o servidor está em cold start

### Teste "TensorFlow" inconclusivo
- ⚠️  Isso é normal se o health endpoint não incluir info de TensorFlow
- ✅ TensorFlow pode estar funcionando mesmo assim
- ✅ Verifique logs do servidor para confirmar

---

## 📝 **ADICIONAR NOVOS TESTES**

1. Criar arquivo `tests/test-nome.ts`
2. Seguir estrutura dos testes existentes
3. Adicionar ao `run-all-tests.sh`
4. Atualizar este README

---

## 📞 **SUPORTE**

Se algum teste falhar:
1. ✅ Verifique logs do Render
2. ✅ Confirme variáveis de ambiente
3. ✅ Execute testes individualmente para isolar problema
4. ✅ Verifique documentação do projeto

---

**Última atualização:** 01/12/2025
