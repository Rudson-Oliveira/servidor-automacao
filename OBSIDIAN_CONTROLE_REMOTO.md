# 🔗 Obsidian - Controle Remoto via Web

Sistema completo de controle remoto do Obsidian inspirado no [Vercept](https://vercept.com/), permitindo gerenciar seu vault local através de uma interface web.

## 🎯 Como Funciona

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│  Seu Computador │ ◄────────────────────────► │  Servidor Web    │
│                 │                             │                  │
│  ┌───────────┐  │                             │  ┌────────────┐  │
│  │ Obsidian  │  │                             │  │ Interface  │  │
│  │  Vault    │  │                             │  │    Web     │  │
│  └─────▲─────┘  │                             │  └──────▲─────┘  │
│        │        │                             │         │        │
│  ┌─────┴─────┐  │                             │         │        │
│  │  Agente   │  │                             │    Você acessa   │
│  │  Python   │  │                             │   de qualquer    │
│  └───────────┘  │                             │   dispositivo    │
└─────────────────┘                             └──────────────────┘
```

**Fluxo:**
1. **Agente Python** roda no seu computador e monitora o vault
2. **Servidor Web** gerencia conexões e comandos
3. **Interface Web** permite controlar tudo remotamente

## 📦 Instalação

### 1. No Seu Computador (Onde está o Obsidian)

```bash
# Clone ou baixe os arquivos
cd python-scripts

# Execute o instalador
./INSTALAR_AGENTE_OBSIDIAN.sh

# Ou manualmente:
pip3 install -r requirements.txt
```

### 2. Obter Token de Autenticação

1. Acesse o servidor web: `https://SEU-SERVIDOR/obsidian/remote`
2. Clique em "Gerar Token"
3. Copie o token gerado

### 3. Iniciar o Agente

```bash
python3 obsidian_agent.py \
  --vault /caminho/para/seu/vault \
  --server wss://SEU-SERVIDOR/ws/obsidian \
  --token SEU_TOKEN_AQUI
```

**Exemplo (Windows):**
```bash
python3 obsidian_agent.py \
  --vault "C:\Users\SeuNome\Documents\ObsidianVault" \
  --server wss://servidor-automacao.manus.space/ws/obsidian \
  --token abc123xyz
```

**Exemplo (Mac/Linux):**
```bash
python3 obsidian_agent.py \
  --vault "/Users/SeuNome/Documents/ObsidianVault" \
  --server wss://servidor-automacao.manus.space/ws/obsidian \
  --token abc123xyz
```

## 🎮 Funcionalidades

### ✅ Já Implementadas

1. **Listar Arquivos** - Veja todos os arquivos .md do vault
2. **Ler Arquivos** - Leia conteúdo de qualquer nota
3. **Criar Arquivos** - Crie novas notas remotamente
4. **Editar Arquivos** - Modifique notas existentes (com backup automático)
5. **Deletar Arquivos** - Remove notas (move para .trash)
6. **Busca Global** - Busque texto em todo o vault
7. **Estrutura de Pastas** - Visualize a árvore de diretórios
8. **Sincronização em Tempo Real** - Mudanças locais são detectadas automaticamente

### 🔄 Sincronização Bidirecional

- **Local → Web**: Quando você edita no Obsidian, mudanças aparecem na web
- **Web → Local**: Quando você edita na web, arquivos são atualizados no Obsidian

## 🛡️ Segurança

1. **Autenticação por Token** - Apenas quem tem o token pode conectar
2. **WebSocket Seguro (WSS)** - Comunicação criptografada
3. **Backup Automático** - Antes de editar, cria backup `.md.backup`
4. **Lixeira** - Arquivos deletados vão para `.trash` (não são perdidos)
5. **Dados Locais** - Seu vault nunca é enviado para a nuvem, apenas comandos

## 📱 Interface Web

Acesse `/obsidian/remote` para:

- Ver agentes conectados
- Explorar arquivos do vault
- Editor de markdown com preview
- Buscar em todas as notas
- Criar/editar/deletar arquivos

## 🔧 Solução de Problemas

### Agente não conecta

```bash
# Verifique se o servidor está acessível
curl https://SEU-SERVIDOR/api/health

# Teste WebSocket manualmente
wscat -c wss://SEU-SERVIDOR/ws/obsidian
```

### Dependências faltando

```bash
# Reinstale dependências
pip3 install --upgrade -r requirements.txt
```

### Erro de permissão no vault

- Certifique-se que o agente tem permissão de leitura/escrita no vault
- No Windows, execute como Administrador se necessário

## 🚀 Executar como Serviço (Opcional)

### Windows (Task Scheduler)

1. Abra "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Trigger: "Ao fazer logon"
4. Ação: Iniciar programa
   - Programa: `python3`
   - Argumentos: `obsidian_agent.py --vault ... --server ... --token ...`

### Mac (launchd)

Crie `~/Library/LaunchAgents/com.obsidian.agent.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.obsidian.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/caminho/para/obsidian_agent.py</string>
        <string>--vault</string>
        <string>/caminho/vault</string>
        <string>--server</string>
        <string>wss://servidor/ws/obsidian</string>
        <string>--token</string>
        <string>SEU_TOKEN</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.obsidian.agent.plist
```

### Linux (systemd)

Crie `/etc/systemd/system/obsidian-agent.service`:

```ini
[Unit]
Description=Obsidian Remote Agent
After=network.target

[Service]
Type=simple
User=SEU_USUARIO
ExecStart=/usr/bin/python3 /caminho/para/obsidian_agent.py \
  --vault /caminho/vault \
  --server wss://servidor/ws/obsidian \
  --token SEU_TOKEN
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable obsidian-agent
sudo systemctl start obsidian-agent
```

## 📊 Monitoramento

O agente exibe logs em tempo real:

```
✅ Agente Obsidian iniciado
📁 Vault: /Users/nome/Documents/Vault
🌐 Servidor: wss://servidor/ws/obsidian
🔄 Conectando ao servidor...
✅ Conectado ao servidor!
👁️  Monitorando mudanças no vault...
```

## 🔗 Comparação com Vercept

| Funcionalidade | Vercept (Vy) | Nosso Sistema |
|----------------|--------------|---------------|
| Controle remoto de apps | ✅ | ✅ (Obsidian) |
| Agente local | ✅ | ✅ (Python) |
| Zero configuração | ✅ | ⚠️ (Requer instalação) |
| Privacidade (dados locais) | ✅ | ✅ |
| Interface web | ✅ | ✅ |
| Sincronização em tempo real | ✅ | ✅ |
| Multiplataforma | ✅ | ✅ |

## 📝 Roadmap

- [ ] Interface web completa (em desenvolvimento)
- [ ] Suporte a plugins do Obsidian
- [ ] Edição colaborativa em tempo real
- [ ] Versionamento de arquivos
- [ ] Integração com Git
- [ ] Suporte a outros apps (Notion, VSCode, etc)

## 🤝 Suporte

Problemas? Entre em contato ou abra uma issue no repositório.

---

**Desenvolvido com inspiração no [Vercept](https://vercept.com/)**
