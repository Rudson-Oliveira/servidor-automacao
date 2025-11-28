# ⚡ Guia de Uso Rápido - Servidor de Automação

**Tempo de leitura:** 5 minutos  
**Nível:** Iniciante  
**Versão:** 1.0.0

---

## 🚀 Comece em 5 Minutos

Este guia vai te ensinar a usar as principais funcionalidades do sistema de forma rápida e prática.

---

## 1️⃣ Primeiro Acesso

### Acessar o Sistema

**Se instalou o .EXE:**
```
http://localhost:3000
```

**Se está usando acesso web:**
```
https://seu-dominio.com
```

### Fazer Login

1. Digite seu **email** e **senha**
2. Clique em **"Entrar"**
3. Você verá o **Dashboard Principal**

---

## 2️⃣ Dashboard Principal

O dashboard mostra uma visão geral do sistema:

| Seção | O que mostra |
|-------|--------------|
| **Status do Sistema** | Se está tudo funcionando |
| **Atividades Recentes** | Últimas ações executadas |
| **Estatísticas** | Mensagens enviadas, notas criadas, etc. |
| **Alertas** | Avisos importantes |

---

## 3️⃣ Principais Funcionalidades

### 📱 WhatsApp Automation

**O que faz:** Envia mensagens automatizadas pelo WhatsApp

**Como usar:**

1. Vá em **WhatsApp** no menu lateral
2. Clique em **"Nova Sessão"**
3. Escaneie o **QR Code** com seu celular
4. Pronto! Agora você pode:
   - Enviar mensagens individuais
   - Enviar mensagens em massa
   - Agendar envios
   - Criar templates

**Exemplo prático:**

```
1. Clique em "Enviar Mensagem"
2. Digite o número: 5511999999999
3. Digite a mensagem: "Olá! Esta é uma mensagem automática."
4. Clique em "Enviar"
```

**Dica:** Use variáveis para personalizar: `{nome}`, `{empresa}`, `{data}`

---

### 📝 Obsidian Integration

**O que faz:** Gerencia suas notas do Obsidian automaticamente

**Como usar:**

1. Vá em **Obsidian** no menu lateral
2. Clique em **"Conectar Vault"**
3. Selecione a pasta do seu Obsidian
4. Pronto! Agora você pode:
   - Criar notas automaticamente
   - Buscar notas por conteúdo
   - Atualizar backlinks
   - Sincronizar com banco de dados

**Exemplo prático:**

```
1. Clique em "Nova Nota"
2. Digite o título: "Reunião de Projeto"
3. Digite o conteúdo: "Discutir roadmap..."
4. Clique em "Salvar"
```

**Dica:** Use tags para organizar: `#projeto`, `#reunião`, `#importante`

---

### 🖥️ Desktop Control

**O que faz:** Controla seu computador remotamente

**Como usar:**

1. Vá em **Desktop Control** no menu lateral
2. Clique em **"Instalar Agente"**
3. Baixe e instale o agente no computador que quer controlar
4. Pronto! Agora você pode:
   - Capturar screenshots
   - Executar comandos
   - Agendar tarefas
   - Monitorar atividades

**Exemplo prático:**

```
1. Clique em "Capturar Screenshot"
2. Selecione "Tela Inteira"
3. Clique em "Capturar"
4. A imagem aparecerá na galeria
```

**Dica:** Configure comandos seguros na lista de permissões

---

### 🤖 AI Governance

**O que faz:** Gerencia múltiplas IAs (Comet, Manus, Perplexity, etc.)

**Como usar:**

1. Vá em **AI Governance** no menu lateral
2. Clique em **"Adicionar IA"**
3. Preencha os dados:
   - Nome da IA
   - API Key
   - Permissões
4. Pronto! A IA está configurada

**Exemplo prático:**

```
1. Adicione "Comet" com sua API Key
2. Configure permissões: "Criar notas", "Buscar arquivos"
3. Teste a conexão
4. Salve
```

**Dica:** Use o sistema de Trust Score para monitorar confiabilidade

---

## 4️⃣ Criando Sua Primeira Automação

### Exemplo: Enviar WhatsApp Diariamente

**Objetivo:** Enviar uma mensagem de bom dia todos os dias às 8h

**Passo a passo:**

1. **Vá em WhatsApp → Agendamentos**
2. **Clique em "Novo Agendamento"**
3. **Preencha:**
   - **Nome:** "Bom dia diário"
   - **Número:** 5511999999999
   - **Mensagem:** "Bom dia! Tenha um ótimo dia!"
   - **Horário:** 08:00
   - **Repetir:** Diariamente
4. **Clique em "Salvar"**

Pronto! A mensagem será enviada automaticamente todos os dias.

---

### Exemplo: Backup Automático de Notas

**Objetivo:** Fazer backup das notas do Obsidian toda sexta-feira

**Passo a passo:**

1. **Vá em Obsidian → Sincronização**
2. **Clique em "Configurar Auto-Sync"**
3. **Preencha:**
   - **Vault:** Selecione seu vault
   - **Frequência:** Semanal
   - **Dia:** Sexta-feira
   - **Horário:** 18:00
4. **Clique em "Ativar"**

Pronto! Suas notas serão sincronizadas automaticamente.

---

### Exemplo: Monitoramento de Sistema

**Objetivo:** Receber alerta se CPU ultrapassar 80%

**Passo a passo:**

1. **Vá em Desktop → Alertas**
2. **Clique em "Novo Alerta"**
3. **Preencha:**
   - **Nome:** "CPU Alta"
   - **Métrica:** CPU Usage
   - **Condição:** Maior que 80%
   - **Ação:** Enviar notificação
4. **Clique em "Salvar"**

Pronto! Você receberá alertas quando a CPU estiver alta.

---

## 5️⃣ Dicas e Truques

### 💡 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + K` | Busca rápida |
| `Ctrl + N` | Nova nota/mensagem |
| `Ctrl + S` | Salvar |
| `Ctrl + /` | Abrir ajuda |
| `Esc` | Fechar modal |

### 🎨 Personalização

**Mudar tema:**
1. Clique no ícone de engrenagem (⚙️)
2. Selecione **"Aparência"**
3. Escolha **"Claro"** ou **"Escuro"**

**Mudar idioma:**
1. Clique no ícone de engrenagem (⚙️)
2. Selecione **"Idioma"**
3. Escolha seu idioma preferido

### 🔔 Notificações

**Ativar notificações:**
1. Clique no ícone de sino (🔔)
2. Clique em **"Permitir notificações"**
3. Escolha quais eventos você quer ser notificado

**Tipos de notificações:**
- ✅ Tarefas concluídas
- ❌ Erros e falhas
- 📊 Relatórios diários
- 🔔 Alertas do sistema

---

## 6️⃣ Recursos Avançados

### 🧠 Machine Learning Preditivo

O sistema usa ML para prever problemas antes que aconteçam.

**Como funciona:**
1. Coleta dados históricos (CPU, memória, disco)
2. Treina modelos de predição
3. Alerta você ANTES de um problema ocorrer

**Como usar:**
- Vá em **ML Dashboard**
- Veja predições para as próximas 24 horas
- Configure ações automáticas

### 🔧 Auto-Healing

O sistema se auto-corrige quando detecta problemas.

**Exemplos:**
- CPU alta → Reinicia processos pesados
- Memória cheia → Limpa cache
- Disco cheio → Remove arquivos temporários
- Serviço parado → Reinicia automaticamente

**Como configurar:**
- Vá em **Auto-Healing**
- Ative as correções automáticas
- Configure limites e ações

### 📊 Analytics

Veja estatísticas detalhadas de uso.

**Métricas disponíveis:**
- Mensagens WhatsApp enviadas
- Notas Obsidian criadas
- Screenshots capturados
- Comandos executados
- Taxa de sucesso
- Tempo de resposta

**Como acessar:**
- Vá em **Analytics**
- Escolha o período (dia, semana, mês)
- Exporte relatórios (CSV, PDF)

---

## 7️⃣ Solução Rápida de Problemas

### ❌ Problema: WhatsApp desconectou

**Solução:**
1. Vá em **WhatsApp → Sessões**
2. Clique em **"Reconectar"**
3. Escaneie o QR Code novamente

### ❌ Problema: Obsidian não sincroniza

**Solução:**
1. Vá em **Obsidian → Vaults**
2. Clique em **"Forçar Sincronização"**
3. Aguarde alguns segundos

### ❌ Problema: Desktop Control não responde

**Solução:**
1. Vá em **Desktop → Status**
2. Clique em **"Reiniciar Agente"**
3. Aguarde 30 segundos

---

## 8️⃣ Próximos Passos

Agora que você conhece o básico, explore:

1. **Tutoriais Avançados** - `/tutoriais`
2. **Documentação Completa** - `README_INSTALACAO.md`
3. **API Reference** - `API_REFERENCE_COMET.md`
4. **Comunidade** - Discord, GitHub

---

## 📞 Precisa de Ajuda?

- **Email:** suporte@servidor-automacao.com
- **Discord:** https://discord.gg/servidor-automacao
- **Documentação:** http://localhost:3000/docs

---

**🎉 Divirta-se automatizando!**

**Desenvolvido com ❤️ por Manus AI**  
**Versão:** 1.0.0 | **Data:** 28/11/2025
