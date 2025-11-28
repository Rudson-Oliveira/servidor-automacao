# 🔗 Integração Avançada com Obsidian

## 📋 Visão Geral

Sistema completo de integração com Obsidian que vai além da simples catalogação de links, oferecendo gerenciamento de vaults, sincronização de notas, busca avançada e automação de fluxos.

## 🎯 Funcionalidades Implementadas (MVP)

### ✅ 1. Gerenciamento de Vaults
- Criar múltiplos vaults isolados
- Personalização (nome, descrição, cor, ícone)
- Estatísticas em tempo real (total de notas, tags, backlinks)
- Status de sincronização

### ✅ 2. CRUD de Notas
- Criar notas com título, conteúdo e frontmatter
- Editar notas existentes
- Deletar notas
- Versionamento automático (histórico completo)
- Detecção de mudanças (hash SHA-256)

### ✅ 3. Sistema de Tags
- Tags automáticas extraídas do conteúdo
- Contador de uso por tag
- Navegação por tags
- Cores personalizáveis

### ✅ 4. Backlinks
- Detecção automática de links entre notas
- Visualização de incoming/outgoing links
- Suporte a wikilinks, markdown links e embeds
- Contexto do link

### ✅ 5. Busca Full-Text
- Busca em títulos e conteúdo
- Texto normalizado (sem markdown)
- Resultados limitados a 50 por performance

### ✅ 6. Importação/Exportação
- Importar vault completo (array de notas)
- Exportar vault para JSON
- Preservação de metadados (tags, frontmatter, timestamps)

### ✅ 7. Backups
- Criação manual de backups
- Metadados de backup (tamanho, total de notas, hash)
- Histórico de backups por vault

### ✅ 8. Configuração de Sincronização
- Sync automático configurável
- Intervalo de sync personalizável
- Estratégias de resolução de conflitos
- Filtros de pastas e extensões
- Backup automático antes de sync

## 🗄️ Schema de Banco de Dados

### Tabelas Principais

1. **obsidian_vaults** - Vaults do usuário
2. **obsidian_notas** - Notas com conteúdo completo
3. **obsidian_notas_historico** - Versionamento
4. **obsidian_tags** - Tags únicas por vault
5. **obsidian_notas_tags** - Relação N:N
6. **obsidian_backlinks** - Links entre notas
7. **obsidian_fluxos** - Automações (preparado)
8. **obsidian_fluxos_log** - Histórico de execuções
9. **obsidian_backups** - Backups do vault
10. **obsidian_sync_configs** - Configurações de sync
11. **obsidian_search_index** - Índice de busca

## 🔌 API tRPC

### Endpoints Disponíveis

```typescript
// Vaults
trpc.obsidianAdvanced.createVault.useMutation()
trpc.obsidianAdvanced.listVaults.useQuery()
trpc.obsidianAdvanced.getVault.useQuery({ vaultId })

// Notas
trpc.obsidianAdvanced.createNota.useMutation()
trpc.obsidianAdvanced.listNotas.useQuery({ vaultId })
trpc.obsidianAdvanced.getNota.useQuery({ notaId })
trpc.obsidianAdvanced.updateNota.useMutation()
trpc.obsidianAdvanced.deleteNota.useMutation()

// Busca
trpc.obsidianAdvanced.searchNotas.useQuery({ vaultId, query })

// Tags
trpc.obsidianAdvanced.listTags.useQuery({ vaultId })

// Histórico
trpc.obsidianAdvanced.getNotaHistorico.useQuery({ notaId })

// Backlinks
trpc.obsidianAdvanced.getBacklinks.useQuery({ notaId })

// Importação/Exportação
trpc.obsidianAdvanced.importVault.useMutation()
trpc.obsidianAdvanced.exportVault.useQuery({ vaultId })

// Backups
trpc.obsidianAdvanced.createBackup.useMutation()
trpc.obsidianAdvanced.listBackups.useQuery({ vaultId })

// Sync Config
trpc.obsidianAdvanced.getSyncConfig.useQuery({ vaultId })
trpc.obsidianAdvanced.updateSyncConfig.useMutation()
```

## 🎨 Interface

### Página: `/obsidian/vaults`

**Funcionalidades:**
- Grid de vaults com cards coloridos
- Busca por nome/descrição
- Estatísticas visuais (notas, tags, último sync)
- Dialog de criação de vault
- Navegação para notas do vault

**Proteções Anti-Flickering:**
- useMemo para filtros
- useCallback para handlers
- Invalidação inteligente após mutations

## 🚀 Roadmap - Fase 2 (Futuro)

### 🔄 Sincronização em Tempo Real
- [ ] Watcher de arquivos locais
- [ ] Sync bidirecional automático
- [ ] Resolução automática de conflitos
- [ ] Progress bar de sincronização
- [ ] Notificações de mudanças

### ✏️ Editor Markdown Integrado
- [ ] Monaco Editor ou CodeMirror
- [ ] Preview lado a lado
- [ ] Suporte a sintaxe Obsidian (wikilinks, callouts)
- [ ] Auto-save
- [ ] Atalhos de teclado
- [ ] Barra de ferramentas

### 🤖 Fluxos de Automação
- [ ] Builder visual drag-and-drop
- [ ] Triggers: nota_criada, nota_modificada, tag_adicionada, whatsapp_recebido
- [ ] Actions: criar_nota, enviar_whatsapp, executar_script
- [ ] Templates de fluxos pré-configurados
- [ ] Webhooks para eventos externos

### 🕸️ Graph View
- [ ] Visualização interativa de backlinks
- [ ] D3.js ou Cytoscape.js
- [ ] Filtros por tags
- [ ] Zoom e pan
- [ ] Destaque de clusters

### 👥 Colaboração
- [ ] Compartilhamento de vaults
- [ ] Edição colaborativa em tempo real
- [ ] Comentários em notas
- [ ] Histórico de atividades

### 🔌 Plugins
- [ ] Sistema de plugins extensível
- [ ] API para desenvolvedores
- [ ] Marketplace de plugins
- [ ] Hot reload de plugins

## 📖 Exemplos de Uso

### Criar Vault e Nota

```typescript
// 1. Criar vault
const { mutate: createVault } = trpc.obsidianAdvanced.createVault.useMutation();

createVault({
  nome: "Meu Vault Pessoal",
  descricao: "Notas pessoais e projetos",
  cor: "#8b5cf6",
  icone: "📚"
});

// 2. Criar nota
const { mutate: createNota } = trpc.obsidianAdvanced.createNota.useMutation();

createNota({
  vaultId: 1,
  titulo: "Reunião 2024-01-15",
  caminho: "reunioes/2024-01-15.md",
  conteudo: `# Reunião 2024-01-15

## Participantes
- João
- Maria

## Tópicos
- Planejamento Q1
- Budget 2024

#reuniao #planejamento`,
  tags: ["reuniao", "planejamento"]
});
```

### Buscar Notas

```typescript
const { data } = trpc.obsidianAdvanced.searchNotas.useQuery({
  vaultId: 1,
  query: "planejamento"
});

console.log(data?.resultados); // Notas que contêm "planejamento"
```

### Exportar Vault

```typescript
const { data } = trpc.obsidianAdvanced.exportVault.useQuery({
  vaultId: 1
});

// Baixar como JSON
const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `vault-${data.vault.nome}.json`;
a.click();
```

## 🔐 Segurança

- ✅ Todas as rotas protegidas com `protectedProcedure`
- ✅ Validação de inputs com Zod
- ✅ Isolamento por usuário (userId)
- ✅ Hash SHA-256 para detecção de mudanças
- ✅ Versionamento automático (rollback seguro)

## 🎯 Performance

- ✅ Índices em colunas frequentemente buscadas
- ✅ Busca limitada a 50 resultados
- ✅ Lazy loading de histórico e backlinks
- ✅ Texto plano pré-processado para busca
- ✅ Memoização no frontend

## 🐛 Troubleshooting

### Erro: "Database not available"
**Solução:** Verificar conexão com banco de dados em `drizzle.config.ts`

### Notas não aparecem após importação
**Solução:** Verificar que `vaultId` está correto e executar `refetch()`

### Busca retorna resultados vazios
**Solução:** Verificar que `conteudoPlainText` foi gerado corretamente

## 📚 Referências

- [Obsidian Local REST API Plugin](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Obsidian API Documentation](https://docs.obsidian.md/)
- [Markdown Specification](https://commonmark.org/)

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Atualizar schema em `drizzle/schema-obsidian.ts`
2. Executar `pnpm db:push`
3. Adicionar helpers em `server/db-obsidian.ts`
4. Criar endpoints em `server/routers/obsidianAdvanced.ts`
5. Implementar UI em `client/src/pages/`
6. Testar e documentar

---

**Status:** ✅ MVP Funcional
**Última Atualização:** 2024-01-15
**Versão:** 1.0.0
