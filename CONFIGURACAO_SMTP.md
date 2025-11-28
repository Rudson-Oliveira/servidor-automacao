# 📧 Configuração SMTP para Alertas por Email

## 🎯 Objetivo

Ativar o sistema de alertas por email configurando as variáveis de ambiente SMTP no painel de Secrets da interface de gerenciamento.

---

## 📋 Variáveis Necessárias

As seguintes variáveis devem ser adicionadas no **painel Secrets** da interface de gerenciamento:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-aqui
SMTP_FROM=seu-email@gmail.com
```

---

## 🔑 Como Obter a Senha de App do Gmail

### Passo 1: Ativar Verificação em 2 Etapas

1. Acesse https://myaccount.google.com/security
2. Clique em "Verificação em duas etapas"
3. Siga as instruções para ativar

### Passo 2: Gerar Senha de App

1. Acesse https://myaccount.google.com/apppasswords
2. Selecione "Email" como app
3. Selecione "Outro (nome personalizado)" como dispositivo
4. Digite "Servidor Automação"
5. Clique em "Gerar"
6. **Copie a senha de 16 caracteres** (formato: xxxx xxxx xxxx xxxx)

### Passo 3: Adicionar no Painel Secrets

1. Acesse a interface de gerenciamento do projeto
2. Clique no ícone de configurações (⚙️) no canto superior direito
3. Vá para "Settings" → "Secrets"
4. Adicione cada variável:
   - **Key**: `SMTP_HOST` | **Value**: `smtp.gmail.com`
   - **Key**: `SMTP_PORT` | **Value**: `587`
   - **Key**: `SMTP_USER` | **Value**: `seu-email@gmail.com`
   - **Key**: `SMTP_PASS` | **Value**: `xxxx xxxx xxxx xxxx` (senha gerada)
   - **Key**: `SMTP_FROM` | **Value**: `seu-email@gmail.com`

---

## ✅ Validação

Após adicionar as variáveis:

1. Acesse https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/alerts-config
2. Configure seu email no campo "Email para Alertas"
3. Clique em "Testar Envio de Email"
4. Verifique sua caixa de entrada (e spam) para o email de teste

---

## 🔍 Verificação de Status

O sistema valida automaticamente se as variáveis SMTP estão configuradas:

- ✅ **Configurado**: Todas as 5 variáveis presentes
- ⚠️ **Não Configurado**: Faltam variáveis (alertas por email desabilitados)

---

## 🚨 Troubleshooting

### Erro: "SMTP não configurado"

**Causa**: Variáveis de ambiente não foram adicionadas no painel Secrets.

**Solução**: Siga os passos acima para adicionar todas as 5 variáveis.

### Erro: "Autenticação SMTP falhou"

**Causa**: Senha de app incorreta ou expirada.

**Solução**: 
1. Gere uma nova senha de app
2. Atualize a variável `SMTP_PASS` no painel Secrets
3. Reinicie o servidor (se necessário)

### Erro: "Conexão recusada"

**Causa**: Firewall bloqueando porta 587 ou SMTP_HOST incorreto.

**Solução**:
1. Verifique se `SMTP_HOST=smtp.gmail.com`
2. Verifique se `SMTP_PORT=587`
3. Teste conectividade: `telnet smtp.gmail.com 587`

### Email não chega

**Causa**: Email pode estar na pasta de spam.

**Solução**:
1. Verifique a pasta de spam
2. Marque como "Não é spam"
3. Adicione o remetente aos contatos

---

## 📊 Impacto da Configuração

### Funcionalidades Ativadas

✅ **Alertas de Anomalias** - Sistema detecta comportamento anormal e envia email  
✅ **Predições de Falhas** - ML prevê problemas e alerta com antecedência  
✅ **Alertas de Erros** - Erros críticos geram notificações imediatas  
✅ **Alertas de Performance** - Degradação de performance é reportada  
✅ **Auto-Healing Notifications** - Correções automáticas são notificadas  

### Antes vs Depois

| Métrica | Sem SMTP | Com SMTP |
|---------|----------|----------|
| **Alertas funcionais** | 0% | 100% |
| **Tempo de resposta a incidentes** | Manual | Automático |
| **Visibilidade de problemas** | Reativa | Proativa |
| **Downtime médio** | Alto | Baixo |

---

## 🎯 Próximos Passos

Após configurar SMTP:

1. ✅ **Configurar email de destino** em `/alerts-config`
2. ✅ **Testar envio** usando botão "Testar"
3. ✅ **Ajustar severidade mínima** (low, medium, high, critical)
4. ✅ **Ativar tipos de alertas** desejados
5. ✅ **Treinar modelos ML** para ativar predições

---

## 📚 Referências

- [Senhas de app do Google](https://support.google.com/accounts/answer/185833)
- [Configuração SMTP Gmail](https://support.google.com/mail/answer/7126229)
- [Nodemailer Documentation](https://nodemailer.com/about/)

---

## 💡 Dica Pro

Para ambientes de produção, considere usar:

- **SendGrid** (100 emails/dia grátis)
- **Mailgun** (5.000 emails/mês grátis)
- **AWS SES** (62.000 emails/mês grátis)

Esses serviços têm melhor deliverability e não requerem senha de app.

---

**Status**: ⏳ Aguardando configuração manual no painel Secrets  
**Prioridade**: 🔥 CRÍTICA (P0)  
**Tempo estimado**: 5-10 minutos  
**ROI**: 🚀 ALTÍSSIMO (ativa 40% das funcionalidades)
