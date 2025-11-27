# 🖥️ Desktop Agent - Cliente Python

Cliente Python para controle remoto de computadores via WebSocket.

## 📋 Requisitos

- Python 3.8 ou superior
- Conexão com o servidor WebSocket

## 🚀 Instalação

### 1. Instalar dependências

```bash
pip install -r requirements.txt
```

### 2. Configurar

```bash
# Copiar arquivo de exemplo
cp config.example.json config.json

# Editar configuração
nano config.json  # ou seu editor preferido
```

### 3. Obter Token

Para obter um token de autenticação:

1. Acesse o painel web do servidor
2. Vá em "Desktop Control" → "Agents"
3. Clique em "Novo Agent"
4. Copie o token gerado
5. Cole no arquivo `config.json`

## ▶️ Executar

```bash
python agent.py
```

Ou torne executável:

```bash
chmod +x agent.py
./agent.py
```

## 📝 Configuração

Exemplo de `config.json`:

```json
{
  "server": {
    "url": "ws://localhost:3001",
    "reconnect_interval": 5,
    "max_reconnect_attempts": 10
  },
  "agent": {
    "token": "seu_token_de_64_caracteres_aqui",
    "device_name": "Meu Computador",
    "platform": "Windows 11",
    "version": "1.0.0"
  },
  "heartbeat": {
    "interval": 30,
    "timeout": 10
  },
  "logging": {
    "level": "INFO",
    "file": "agent.log",
    "max_size_mb": 10
  }
}
```

### Parâmetros

**server:**
- `url`: URL do servidor WebSocket
- `reconnect_interval`: Intervalo entre tentativas de reconexão (segundos)
- `max_reconnect_attempts`: Máximo de tentativas de reconexão

**agent:**
- `token`: Token único de autenticação (obrigatório)
- `device_name`: Nome do dispositivo
- `platform`: Sistema operacional (auto-detectado se vazio)
- `version`: Versão do agent

**heartbeat:**
- `interval`: Intervalo entre heartbeats (segundos)
- `timeout`: Timeout para resposta do servidor (segundos)

**logging:**
- `level`: Nível de log (DEBUG, INFO, WARNING, ERROR)
- `file`: Arquivo de log (opcional)
- `max_size_mb`: Tamanho máximo do arquivo de log

## 🔧 Funcionalidades

### ✅ Implementadas (Fase 4)

- ✅ Conexão WebSocket com servidor
- ✅ Autenticação por token
- ✅ Heartbeat automático
- ✅ Reconexão automática
- ✅ Logging estruturado
- ✅ Recebimento de comandos

### 🔄 Em Desenvolvimento

- ⏳ Execução de comandos shell (Fase 5)
- ⏳ Captura de screenshot (Fase 5)
- ⏳ Controle de mouse (Fase 6)
- ⏳ Controle de teclado (Fase 6)
- ⏳ Abertura de aplicativos (Fase 6)

## 📊 Status de Conexão

O agent exibe mensagens coloridas no console:

- 🔌 **Conectando** - Tentando estabelecer conexão
- ✅ **Conectado** - Conexão estabelecida
- 🔐 **Autenticando** - Enviando credenciais
- ✅ **Autenticado** - Pronto para receber comandos
- 💓 **Heartbeat** - Mantendo conexão viva
- 📋 **Comando** - Comando recebido
- ❌ **Erro** - Problema detectado
- 🔄 **Reconectando** - Tentando reconectar

## 🛑 Parar o Agent

Pressione `Ctrl+C` para parar gracefully.

## 📝 Logs

Logs são salvos em:
- **Console**: Saída padrão (stdout)
- **Arquivo**: `agent.log` (se configurado)

Níveis de log:
- **DEBUG**: Informações detalhadas para debug
- **INFO**: Informações gerais de operação
- **WARNING**: Avisos que não impedem funcionamento
- **ERROR**: Erros que impedem operação

## 🔒 Segurança

- ✅ Token único de 64 caracteres
- ✅ Autenticação obrigatória
- ✅ Conexão pode usar WSS (WebSocket Secure)
- ✅ Logs não expõem tokens

## 🐛 Troubleshooting

### Erro: "Token não configurado"

**Solução:** Edite `config.json` e adicione seu token válido.

### Erro: "Conexão recusada"

**Solução:** Verifique se o servidor está rodando e se a URL está correta.

### Erro: "Falha na autenticação"

**Solução:** Verifique se o token está correto e não expirou.

### Reconexão infinita

**Solução:** Verifique logs do servidor para identificar o problema.

## 📞 Suporte

Para problemas ou dúvidas, consulte a documentação do servidor ou entre em contato com o administrador.

## 📄 Licença

Propriedade do projeto Servidor de Automação.
