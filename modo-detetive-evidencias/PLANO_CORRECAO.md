# 🔧 PLANO DE CORREÇÃO CIRÚRGICA

**Data:** 2025-11-28 20:50  
**Investigador:** Manus (Modo Detetive)  
**Status:** PRONTO PARA EXECUÇÃO

---

## 🎯 OBJETIVO

Restaurar o servidor de automação para estado funcional, removendo TODOS os arquivos problemáticos do "Sistema de Auto-Evolução" e sincronizando o banco de dados.

---

## 📋 CHECKLIST PRÉ-EXECUÇÃO

- [x] Checkpoint problemático identificado: `00297f3`
- [x] Checkpoint funcional identificado: `7633f0e`
- [x] 23 arquivos afetados catalogados
- [x] 10 migrations problemáticas identificadas
- [x] Causa raiz documentada
- [x] Plano de correção criado

---

## 🔧 ETAPAS DA CORREÇÃO

### **ETAPA 1: BACKUP DE SEGURANÇA**

Antes de qualquer modificação, criar backup dos arquivos de investigação:

```bash
# Copiar evidências para local seguro
cp -r /home/ubuntu/servidor-automacao/modo-detetive-evidencias /home/ubuntu/backup-investigacao-$(date +%Y%m%d-%H%M%S)
```

**Validação:** ✅ Backup criado com sucesso

---

### **ETAPA 2: ROLLBACK PARA CHECKPOINT FUNCIONAL**

Fazer rollback HARD para o checkpoint `7633f0e`:

```bash
cd /home/ubuntu/servidor-automacao
git reset --hard 7633f0e
```

**O que isso faz:**
- ✅ Remove TODOS os 13 arquivos novos criados
- ✅ Reverte TODAS as modificações nos 10 arquivos alterados
- ✅ Restaura código para estado funcional de 11:04:27

**Validação:** 
- ✅ `git status` deve mostrar "nothing to commit, working tree clean"
- ✅ Arquivos problemáticos devem ter desaparecido

---

### **ETAPA 3: LIMPAR MIGRATIONS PROBLEMÁTICAS**

Deletar TODAS as 10 migrations não aplicadas:

```bash
cd /home/ubuntu/servidor-automacao

# Deletar migrations SQL
rm -f drizzle/0038_cuddly_thunderbolt.sql
rm -f drizzle/0039_dashing_fallen_one.sql
rm -f drizzle/0040_damp_tinkerer.sql
rm -f drizzle/0041_panoramic_dust.sql
rm -f drizzle/0042_kind_the_initiative.sql
rm -f drizzle/0043_next_sersi.sql
rm -f drizzle/0044_remarkable_magus.sql
rm -f drizzle/0045_shocking_sally_floyd.sql
rm -f drizzle/0046_wide_argent.sql
rm -f drizzle/0047_pretty_hawkeye.sql

# Deletar snapshots
rm -f drizzle/meta/0038_snapshot.json
rm -f drizzle/meta/0039_snapshot.json
rm -f drizzle/meta/0040_snapshot.json
rm -f drizzle/meta/0041_snapshot.json
rm -f drizzle/meta/0042_snapshot.json
rm -f drizzle/meta/0043_snapshot.json
rm -f drizzle/meta/0044_snapshot.json
rm -f drizzle/meta/0045_snapshot.json
rm -f drizzle/meta/0046_snapshot.json
rm -f drizzle/meta/0047_snapshot.json
```

**Validação:**
- ✅ `ls drizzle/*.sql | grep -E "003[8-9]|004[0-7]"` deve retornar vazio
- ✅ `ls drizzle/meta/*.json | grep -E "003[8-9]|004[0-7]"` deve retornar vazio

---

### **ETAPA 4: LIMPAR ARQUIVOS DE INVESTIGAÇÃO**

Deletar arquivos temporários de investigação:

```bash
cd /home/ubuntu/servidor-automacao

rm -f MODO_DETETIVE_INVESTIGACAO.md
rm -f PROTOCOLO_MODO_DETETIVE.md
```

**Validação:**
- ✅ `git status` deve mostrar apenas `modo-detetive-evidencias/` como untracked

---

### **ETAPA 5: REINSTALAR DEPENDÊNCIAS**

Garantir que dependências estão corretas:

```bash
cd /home/ubuntu/servidor-automacao
pnpm install
```

**Validação:**
- ✅ Instalação deve concluir sem erros
- ✅ `pnpm-lock.yaml` deve estar atualizado

---

### **ETAPA 6: SINCRONIZAR BANCO DE DADOS**

Aplicar schema correto ao banco:

```bash
cd /home/ubuntu/servidor-automacao
pnpm db:push
```

**O que isso faz:**
- ✅ Lê `drizzle/schema.ts` (versão funcional)
- ✅ Compara com banco de dados atual
- ✅ Remove tabelas do "Sistema Pai" que não deveriam existir
- ✅ Sincroniza schema para estado correto

**Validação:**
- ✅ Comando deve concluir sem erros
- ✅ Deve mostrar quais tabelas foram removidas/modificadas

---

### **ETAPA 7: REINICIAR SERVIDOR**

Reiniciar servidor de desenvolvimento:

```bash
# Matar processos antigos
pkill -f "node.*servidor-automacao" || true
pkill -f "tsx.*servidor-automacao" || true

# Limpar porta 3000 se estiver em uso
lsof -ti:3000 | xargs kill -9 || true

# Aguardar 2 segundos
sleep 2
```

**Validação:**
- ✅ Nenhum processo do servidor deve estar rodando
- ✅ Porta 3000 deve estar livre

---

### **ETAPA 8: VALIDAR SISTEMA FUNCIONAL**

Verificar que servidor inicia corretamente:

```bash
cd /home/ubuntu/servidor-automacao
pnpm dev &

# Aguardar 10 segundos
sleep 10

# Verificar se servidor está rodando
curl -I http://localhost:3000/ 2>&1 | grep "200 OK"
```

**Validação:**
- ✅ Servidor deve iniciar sem erros
- ✅ Porta 3000 deve responder
- ✅ Não deve haver erros de "EADDRINUSE"
- ✅ Não deve haver erros de migration
- ✅ Não deve haver erros de import

---

### **ETAPA 9: CRIAR CHECKPOINT DE SEGURANÇA**

Criar checkpoint do sistema restaurado:

```bash
cd /home/ubuntu/servidor-automacao

# Adicionar evidências da investigação
git add modo-detetive-evidencias/

# Commit
git commit -m "🔴 MODO DETETIVE: Sistema restaurado após investigação completa

PROBLEMA IDENTIFICADO:
- Checkpoint problemático: 00297f3 (2025-11-28 12:08:03)
- Causa raiz: Sistema de Auto-Evolução quebrou o servidor
- 23 arquivos afetados (13 novos, 10 modificados)
- 10 migrations problemáticas

CORREÇÃO APLICADA:
- Rollback para checkpoint funcional: 7633f0e (2025-11-28 11:04:27)
- Remoção de todos os arquivos problemáticos
- Limpeza de 10 migrations não aplicadas
- Sincronização do banco de dados
- Sistema restaurado e validado

EVIDÊNCIAS:
- Análise completa das 11 imagens fornecidas
- Comparação detalhada de checkpoints
- Documentação completa em modo-detetive-evidencias/

Status: ✅ SISTEMA FUNCIONAL RESTAURADO"
```

**Validação:**
- ✅ Commit criado com sucesso
- ✅ Evidências preservadas no histórico

---

## 📊 RESULTADOS ESPERADOS

Após execução completa:

- ✅ Sistema volta ao estado funcional de 11:04:27
- ✅ Todos os 23 arquivos problemáticos removidos
- ✅ Todas as 10 migrations problemáticas deletadas
- ✅ Banco de dados sincronizado corretamente
- ✅ Servidor inicia sem erros
- ✅ Porta 3000 responde normalmente
- ✅ Evidências da investigação preservadas
- ✅ Checkpoint de segurança criado

---

## ⚠️ AVISOS IMPORTANTES

1. **PERDA DE TRABALHO:**
   - Todo o trabalho do "Sistema de Auto-Evolução" será perdido
   - Isso é INTENCIONAL - o sistema era perigoso e quebrou o servidor

2. **BANCO DE DADOS:**
   - Tabelas do "Sistema Pai" serão removidas
   - Dados nessas tabelas serão perdidos (se houver)
   - Isso é NECESSÁRIO para restaurar consistência

3. **DEPENDÊNCIAS:**
   - Biblioteca `cron` pode ser removida se não for usada em outro lugar
   - Outras dependências adicionadas serão removidas

4. **EVIDÊNCIAS:**
   - TODAS as evidências da investigação estão em `modo-detetive-evidencias/`
   - Esse diretório será preservado e commitado

---

## 🚀 PRONTO PARA EXECUÇÃO

**Status:** ✅ PLANO VALIDADO E PRONTO

**Tempo estimado:** 2-3 minutos

**Risco:** BAIXO (rollback para estado conhecido funcional)

**Aprovação necessária:** SIM (usuário deve confirmar)

---

**Aguardando aprovação do usuário para executar correção...**

