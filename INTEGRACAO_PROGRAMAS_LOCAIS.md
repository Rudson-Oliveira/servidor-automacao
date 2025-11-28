# 🔗 Sistema de Integração com Programas Locais

Documentação completa das 3 opções de integração para controlar programas locais (Obsidian, VSCode, Notion, Slack, etc) a partir do servidor web.

---

## 📋 Visão Geral

Este sistema permite que o servidor web (rodando na nuvem ou localmente) controle e interaja com programas instalados no computador do usuário através de 3 métodos diferentes:

### **Opção 1: URI Schemes Genéricos** ⚡ (Mais Simples)
- **O que é**: Gera links especiais que abrem programas locais
- **Como funciona**: Clique em link → Programa abre automaticamente
- **Reutilizável**: Funciona com 8+ programas diferentes
- **Sem instalação**: Apenas clique e use

### **Opção 2: Scripts Python Locais** 🐍 (Mais Poderoso)
- **O que é**: Script Python rodando no seu computador
- **Como funciona**: Script se conecta ao servidor e executa tarefas
- **Reutilizável**: Pode controlar qualquer programa/arquivo
- **Requer instalação**: Executar uma vez para configurar

### **Opção 3: Plugin Obsidian Customizado** 🔌 (Específico Obsidian)
- **O que é**: Plugin nativo do Obsidian
- **Como funciona**: Integração direta dentro do Obsidian
- **Específico**: Apenas para Obsidian
- **Recursos avançados**: Sincronização automática, comandos customizados

---

## 🎯 Opção 1: URI Schemes Genéricos

### Programas Suportados

| Programa | Scheme | Exemplo de Uso |
|----------|--------|----------------|
| **Obsidian** | `obsidian://` | Criar notas, abrir vault |
| **VSCode** | `vscode://` | Abrir arquivos, ir para linha específica |
| **Notion** | `notion://` | Abrir páginas |
| **Slack** | `slack://` | Abrir canais, enviar DMs |
| **Discord** | `discord://` | Abrir canais |
| **Spotify** | `spotify:` | Tocar músicas, playlists |
| **Zoom** | `zoommtg://` | Entrar em reuniões |
| **Telegram** | `tg://` | Enviar mensagens, abrir chats |

### Endpoints Disponíveis

#### 1. Listar Programas Suportados
```typescript
GET /api/trpc/uriSchemes.listPrograms

Resposta:
[
  {
    "name": "Obsidian",
    "scheme": "obsidian",
    "description": "Aplicativo de notas e conhecimento",
    "actions": {
      "new": {
        "description": "Criar nova nota",
        "params": ["vault", "file", "content"],
        "example": "obsidian://new?vault=MeuVault&file=Nota.md&content=Conteúdo"
      }
    }
  },
  ...
]
```

#### 2. Gerar URI Genérica
```typescript
POST /api/trpc/uriSchemes.generate

Body:
{
  "scheme": "obsidian",
  "action": "new",
  "params": {
    "vault": "MeuVault",
    "file": "Notas/Teste.md",
    "content": "# Minha Nota\n\nConteúdo aqui"
  }
}

Resposta:
{
  "uri": "obsidian://new?vault=MeuVault&file=Notas%2FTeste.md&content=%23%20Minha%20Nota...",
  "safe": true,
  "program": "obsidian"
}
```

#### 3. Atalhos Específicos

**Obsidian - Criar Nota:**
```typescript
POST /api/trpc/uriSchemes.obsidianNewNote

Body:
{
  "vault": "MeuVault",
  "fileName": "Notas/Nova.md",
  "content": "# Título\n\nConteúdo",
  "silent": false,
  "append": false
}
```

**VSCode - Abrir Arquivo:**
```typescript
POST /api/trpc/uriSchemes.vscodeOpenFile

Body:
{
  "filePath": "/caminho/arquivo.ts",
  "line": 42,
  "column": 10
}
```

**Slack - Abrir Canal:**
```typescript
POST /api/trpc/uriSchemes.slackChannel

Body:
{
  "teamId": "T123456",
  "channelId": "C789012"
}
```

**Spotify - Tocar Música:**
```typescript
POST /api/trpc/uriSchemes.spotifyTrack

Body:
{
  "trackId": "6rqhFgbbKwnb9MLmUQDhG6"
}
```

**Zoom - Entrar em Reunião:**
```typescript
POST /api/trpc/uriSchemes.zoomJoin

Body:
{
  "meetingId": "123456789",
  "password": "abc123"
}
```

### Validação de Segurança

```typescript
POST /api/trpc/uriSchemes.validate

Body:
{
  "uri": "obsidian://new?vault=Test&file=nota.md"
}

Resposta:
{
  "uri": "obsidian://new?vault=Test&file=nota.md",
  "safe": true,
  "message": "URI válida e segura"
}
```

### Exemplo de Uso no Frontend

```typescript
import { trpc } from '@/lib/trpc';

// Gerar URI do Obsidian
const { data } = await trpc.uriSchemes.obsidianNewNote.mutate({
  vault: 'MeuVault',
  fileName: 'Tarefas/Hoje.md',
  content: '# Tarefas de Hoje\n\n- [ ] Tarefa 1\n- [ ] Tarefa 2',
});

// Abrir no Obsidian
window.location.href = data.uri;
```

---

## 🐍 Opção 2: Scripts Python Locais

### Instalação

#### Passo 1: Baixar Script

```bash
# Baixar do servidor
curl http://localhost:3000/api/scripts/automacao_local_generica.py > automacao_local.py

# Ou copiar do repositório
cp python-scripts/automacao_local_generica.py ~/automacao_local.py
```

#### Passo 2: Instalar Dependências

```bash
pip install requests
```

#### Passo 3: Executar Script

**Modo Teste:**
```bash
python automacao_local.py --server http://localhost:3000 --modo teste
```

**Modo Loop (Produção):**
```bash
python automacao_local.py --server http://localhost:3000 --token SEU_TOKEN
```

### Instalação Automática (Rodar no Boot)

```bash
python INSTALADOR_AUTOMACAO_LOCAL.py --server http://localhost:3000 --token SEU_TOKEN
```

**O instalador configura:**
- **Windows**: Task Scheduler (roda no login)
- **macOS**: LaunchAgent (roda no login)
- **Linux**: systemd service (roda sempre)

### Funcionalidades do Script

#### 1. Obsidian

```python
# Criar nota
automacao.obsidian_criar_nota(
    vault='MeuVault',
    arquivo='Notas/Teste.md',
    conteudo='# Título\n\nConteúdo',
    append=False
)

# Ler nota
conteudo = automacao.obsidian_ler_nota(
    vault='MeuVault',
    arquivo='Notas/Teste.md'
)

# Listar notas
notas = automacao.obsidian_listar_notas(
    vault='MeuVault',
    extensao='.md'
)
```

#### 2. VSCode

```python
# Abrir arquivo
automacao.vscode_abrir_arquivo(
    caminho='/caminho/arquivo.ts',
    linha=42
)
```

#### 3. Sistema de Arquivos

```python
# Ler arquivo
conteudo = automacao.arquivo_ler('/caminho/arquivo.txt')

# Escrever arquivo
automacao.arquivo_escrever(
    caminho='/caminho/novo.txt',
    conteudo='Conteúdo',
    append=False
)

# Buscar arquivos
arquivos = automacao.arquivo_buscar(
    diretorio='/caminho',
    padrao='*.md'
)
```

#### 4. Comandos do Sistema

```python
# Executar comando
resultado = automacao.executar_comando('ls -la')

print(resultado['stdout'])  # Saída do comando
print(resultado['stderr'])  # Erros
print(resultado['codigo'])  # Código de retorno
```

### Comunicação com Servidor

O script busca tarefas periodicamente do servidor:

```python
# Servidor cria tarefa
POST /api/tarefas-locais/criar
{
  "tipo": "obsidian_criar_nota",
  "params": {
    "vault": "MeuVault",
    "arquivo": "Nota.md",
    "conteudo": "Conteúdo"
  }
}

# Script busca tarefas
GET /api/tarefas-locais/pendentes

# Script executa tarefa

# Script envia resultado
POST /api/tarefas-locais/resultado
{
  "tarefa_id": 123,
  "sucesso": true,
  "resultado": "Nota criada com sucesso"
}
```

### Tipos de Tarefas Suportadas

| Tipo | Descrição | Parâmetros |
|------|-----------|------------|
| `obsidian_criar_nota` | Criar nota no Obsidian | vault, arquivo, conteudo, append |
| `obsidian_ler_nota` | Ler nota do Obsidian | vault, arquivo |
| `obsidian_listar_notas` | Listar notas | vault |
| `vscode_abrir` | Abrir arquivo no VSCode | caminho, linha |
| `arquivo_ler` | Ler arquivo | caminho |
| `arquivo_escrever` | Escrever arquivo | caminho, conteudo, append |
| `executar_comando` | Executar comando do sistema | comando |

### Comandos Úteis

**Windows:**
```powershell
# Ver status da tarefa
schtasks /query /tn "AutomacaoLocal"

# Iniciar manualmente
schtasks /run /tn "AutomacaoLocal"

# Parar
schtasks /end /tn "AutomacaoLocal"

# Desinstalar
schtasks /delete /tn "AutomacaoLocal" /f
```

**macOS:**
```bash
# Ver status
launchctl list | grep automacao

# Parar
launchctl unload ~/Library/LaunchAgents/com.automacao.local.plist

# Iniciar
launchctl load ~/Library/LaunchAgents/com.automacao.local.plist

# Ver logs
tail -f ~/Library/Logs/automacao_local.log
```

**Linux:**
```bash
# Ver status
systemctl --user status automacao-local

# Parar
systemctl --user stop automacao-local

# Reiniciar
systemctl --user restart automacao-local

# Ver logs
journalctl --user -u automacao-local -f

# Desinstalar
systemctl --user disable automacao-local
```

---

## 🔌 Opção 3: Plugin Obsidian Customizado

### Instalação

#### Método 1: Manual (Desenvolvimento)

1. Copiar pasta `obsidian-plugin` para `.obsidian/plugins/automacao-servidor/`
2. No Obsidian: `Configurações → Plugins da Comunidade`
3. Desativar "Modo Restrito"
4. Ativar "Automação com Servidor"

#### Método 2: Build

```bash
cd obsidian-plugin
npm install
npm run build
```

Copiar `main.js` e `manifest.json` para `.obsidian/plugins/automacao-servidor/`

### Configuração

1. `Configurações → Automação com Servidor`
2. **URL do Servidor**: `http://localhost:3000`
3. **Token de API**: (opcional)
4. **Sincronização Automática**: Ativar
5. **Intervalo**: 60 segundos
6. Clicar "Testar Conexão"

### Funcionalidades

#### 1. Comandos (Ctrl/Cmd+P)

- **Sincronizar com Servidor**
- **Enviar Nota Atual para Servidor**
- **Buscar Tarefas do Servidor**

#### 2. Ícone na Ribbon

Botão de sincronização rápida na barra lateral esquerda.

#### 3. Sincronização Automática

- Busca tarefas a cada X segundos
- Executa automaticamente
- Notificações visuais de status

### Tarefas Suportadas

#### Criar Nota
```json
{
  "tipo": "criar_nota",
  "params": {
    "arquivo": "Pasta/Nota.md",
    "conteudo": "# Título\n\nConteúdo"
  }
}
```

#### Atualizar Nota
```json
{
  "tipo": "atualizar_nota",
  "params": {
    "arquivo": "Pasta/Nota.md",
    "conteudo": "Novo conteúdo"
  }
}
```

#### Deletar Nota
```json
{
  "tipo": "deletar_nota",
  "params": {
    "arquivo": "Pasta/Nota.md"
  }
}
```

#### Listar Notas
```json
{
  "tipo": "listar_notas",
  "params": {
    "pasta": "Pasta/"  // opcional
  }
}
```

### API do Servidor (Endpoints)

```typescript
// Sincronizar vault
POST /api/obsidian/sync
Body: { vault: string, timestamp: number }

// Enviar nota
POST /api/obsidian/enviar-nota
Body: { vault: string, arquivo: string, conteudo: string, metadata: {...} }

// Buscar tarefas
POST /api/obsidian/tarefas
Body: { vault: string }
Resposta: { success: boolean, tarefas: [...] }

// Notificar conclusão
POST /api/obsidian/tarefa-concluida
Body: { tarefaId: number, sucesso: boolean, erro?: string }

// Receber lista de notas
POST /api/obsidian/lista-notas
Body: { vault: string, pasta: string, notas: [...] }
```

---

## 🔄 Comparação das Opções

| Característica | URI Schemes | Scripts Python | Plugin Obsidian |
|----------------|-------------|----------------|-----------------|
| **Instalação** | ✅ Nenhuma | ⚠️ Simples | ⚠️ Manual |
| **Configuração** | ✅ Nenhuma | ⚠️ Média | ⚠️ Média |
| **Reutilizável** | ✅ 8+ programas | ✅ Qualquer programa | ❌ Apenas Obsidian |
| **Bidirecional** | ❌ Apenas abrir | ✅ Ler e escrever | ✅ Ler e escrever |
| **Automático** | ❌ Manual | ✅ Loop contínuo | ✅ Sincronização |
| **Offline** | ✅ Funciona | ❌ Requer servidor | ❌ Requer servidor |
| **Segurança** | ✅ Validação | ⚠️ Token opcional | ⚠️ Token opcional |

### Quando Usar Cada Opção?

**Use URI Schemes quando:**
- ✅ Quer simplicidade máxima (sem instalação)
- ✅ Apenas precisa abrir programas/arquivos
- ✅ Quer suportar múltiplos programas
- ✅ Não precisa de automação contínua

**Use Scripts Python quando:**
- ✅ Precisa ler/escrever arquivos localmente
- ✅ Quer automação contínua (loop)
- ✅ Precisa executar comandos do sistema
- ✅ Quer controlar qualquer programa (não apenas Obsidian)

**Use Plugin Obsidian quando:**
- ✅ Usa apenas Obsidian
- ✅ Quer integração nativa e profunda
- ✅ Precisa de sincronização automática
- ✅ Quer comandos dentro do Obsidian

---

## 🚀 Exemplos Práticos

### Exemplo 1: Criar Nota no Obsidian (URI)

```typescript
// Frontend
const { data } = await trpc.uriSchemes.obsidianNewNote.mutate({
  vault: 'Trabalho',
  fileName: 'Reuniões/2025-01-26.md',
  content: `# Reunião 26/01/2025\n\n## Participantes\n- João\n- Maria\n\n## Pauta\n- Item 1\n- Item 2`,
});

// Abrir no Obsidian
window.location.href = data.uri;
```

### Exemplo 2: Catalogar Links Automaticamente (Script Python)

```python
# Servidor cria tarefa
POST /api/tarefas-locais/criar
{
  "tipo": "obsidian_criar_nota",
  "params": {
    "vault": "Conhecimento",
    "arquivo": "Links/AI Research.md",
    "conteudo": "# AI Research\n\n- [Stanford HAI](https://hai.stanford.edu)\n- [OpenAI](https://openai.com)"
  }
}

# Script Python (rodando localmente) busca tarefa e cria nota
# Nota aparece automaticamente no Obsidian
```

### Exemplo 3: Sincronização Bidirecional (Plugin)

```typescript
// 1. Usuário edita nota no Obsidian
// 2. Plugin detecta mudança
// 3. Plugin envia para servidor

POST /api/obsidian/enviar-nota
{
  "vault": "Pessoal",
  "arquivo": "Diário/2025-01-26.md",
  "conteudo": "# Hoje\n\nFoi um ótimo dia!",
  "metadata": {
    "criado": 1706284800000,
    "modificado": 1706288400000,
    "tamanho": 1024
  }
}

// 4. Servidor processa e armazena
// 5. Servidor pode criar tarefas para outros dispositivos
// 6. Plugin em outro computador busca tarefas
// 7. Nota é sincronizada automaticamente
```

---

## 🔐 Segurança

### URI Schemes
- ✅ Validação de padrões perigosos (javascript:, data:, etc)
- ✅ Whitelist de schemes permitidos
- ✅ Encoding automático de parâmetros

### Scripts Python
- ⚠️ Use token de autenticação
- ⚠️ Configure HTTPS em produção
- ⚠️ Valide comandos do sistema
- ⚠️ Limite permissões de arquivos

### Plugin Obsidian
- ⚠️ Use token de autenticação
- ⚠️ Configure HTTPS em produção
- ✅ Validação de tarefas antes de executar
- ✅ Logs de todas as operações

---

## 📚 Próximos Passos

1. **Testar URI Schemes**: Acesse `/uri-schemes-test` no servidor
2. **Instalar Script Python**: Execute `INSTALADOR_AUTOMACAO_LOCAL.py`
3. **Instalar Plugin Obsidian**: Copie para `.obsidian/plugins/`
4. **Configurar Tokens**: Gere tokens de API no servidor
5. **Criar Automações**: Combine as 3 opções para fluxos complexos

---

**Desenvolvido com ❤️ para integrar programas locais com o servidor de automação**
