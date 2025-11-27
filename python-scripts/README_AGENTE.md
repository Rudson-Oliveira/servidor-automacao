# 🤖 Agente Local - Sistema Vercept

Controle remoto de aplicações locais similar ao Vercept (Vy).

## 📋 Requisitos

- **Python 3.7+**
- **Conexão com internet**
- **Token de autenticação** (gerado no painel web)

## 🚀 Instalação Rápida

### Windows
```batch
INSTALAR_AGENTE.bat
```

### Linux/macOS
```bash
chmod +x INSTALAR_AGENTE.sh
./INSTALAR_AGENTE.sh
```

## 🔧 Instalação Manual

1. **Instalar dependências:**
   ```bash
   pip install websockets
   ```

2. **Configurar token:**
   - Acesse o painel web em `/agentes-locais`
   - Clique em "Gerar Token"
   - Copie o token gerado
   - Edite `agente_local.py` e cole o token na variável `TOKEN`

3. **Executar agente:**
   ```bash
   python agente_local.py
   ```

## 📡 Comandos Disponíveis

### Shell
Executa comandos do sistema operacional.

**Exemplo:**
```json
{
  "comando": "shell",
  "parametros": {
    "cmd": "echo Hello World"
  }
}
```

### Obsidian - Criar Nota
Cria uma nova nota no vault do Obsidian.

**Exemplo:**
```json
{
  "comando": "obsidian.criar_nota",
  "parametros": {
    "vault_path": "/caminho/para/vault",
    "nome_arquivo": "Minha Nota",
    "conteudo": "# Título\n\nConteúdo da nota"
  }
}
```

### Obsidian - Listar Notas
Lista todas as notas do vault.

**Exemplo:**
```json
{
  "comando": "obsidian.listar_notas",
  "parametros": {
    "vault_path": "/caminho/para/vault"
  }
}
```

### Obsidian - Ler Nota
Lê o conteúdo de uma nota.

**Exemplo:**
```json
{
  "comando": "obsidian.ler_nota",
  "parametros": {
    "vault_path": "/caminho/para/vault",
    "nome_arquivo": "Minha Nota"
  }
}
```

### VSCode - Abrir Arquivo
Abre um arquivo no VSCode.

**Exemplo:**
```json
{
  "comando": "vscode.abrir_arquivo",
  "parametros": {
    "caminho": "/caminho/para/arquivo.txt"
  }
}
```

### Sistema - Informações
Retorna informações do sistema.

**Exemplo:**
```json
{
  "comando": "sistema.info",
  "parametros": {}
}
```

## 🔒 Segurança

- ✅ **Autenticação por token** - Apenas agentes autorizados podem conectar
- ✅ **Timeout de 30s** - Comandos são interrompidos automaticamente
- ✅ **Whitelist de comandos** - Apenas comandos permitidos são executados
- ✅ **Logs completos** - Todas as ações são registradas

## 🔄 Reconexão Automática

O agente possui reconexão automática com **backoff exponencial**:
- Primeira tentativa: 1 segundo
- Segunda tentativa: 2 segundos
- Terceira tentativa: 4 segundos
- ...
- Máximo: 60 segundos

## 📊 Monitoramento

O agente envia **heartbeat** a cada 30 segundos para o servidor. Se não responder por 60 segundos, é marcado como offline.

## 🛠️ Troubleshooting

### Agente não conecta
1. Verifique se o servidor está rodando
2. Verifique se o token está correto
3. Verifique firewall/antivírus
4. Verifique logs do agente

### Comando não executa
1. Verifique se o agente está online
2. Verifique se o comando está na whitelist
3. Verifique parâmetros do comando
4. Verifique logs de execução

### VSCode não abre
1. Verifique se VSCode está instalado
2. Adicione VSCode ao PATH do sistema
3. Teste manualmente: `code arquivo.txt`

## 📚 Documentação Completa

Acesse o painel web em `/agentes-locais` para:
- Gerar novos tokens
- Ver agentes conectados
- Enviar comandos
- Ver histórico de execuções
- Monitorar estatísticas

## 🤝 Suporte

Em caso de problemas, verifique:
1. Logs do agente (console)
2. Histórico de execuções (painel web)
3. Status do servidor (painel web)

## 📄 Licença

Este software é fornecido "como está", sem garantias de qualquer tipo.
