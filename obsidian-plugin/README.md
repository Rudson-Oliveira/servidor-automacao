# Plugin Obsidian - Automação com Servidor

Plugin para integrar o Obsidian com o servidor de automação, permitindo sincronizar notas, executar tarefas remotas e automatizar fluxos de trabalho.

## 🚀 Funcionalidades

- ✅ **Sincronização com Servidor** - Sincronize suas notas com o servidor de automação
- ✅ **Envio de Notas** - Envie a nota atual para o servidor
- ✅ **Busca de Tarefas** - Busque e execute tarefas do servidor automaticamente
- ✅ **Sincronização Automática** - Configure sincronização periódica (a cada X segundos)
- ✅ **Comandos Customizados** - Acesse funcionalidades via paleta de comandos (Ctrl/Cmd+P)
- ✅ **Ícone na Ribbon** - Botão de sincronização rápida na barra lateral

## 📦 Instalação

### Opção 1: Instalação Manual (Desenvolvimento)

1. Clone ou baixe este repositório
2. Copie a pasta `obsidian-plugin` para `.obsidian/plugins/` do seu vault
3. Renomeie para `automacao-servidor`
4. No Obsidian, vá em `Configurações → Plugins da Comunidade`
5. Desative o "Modo Restrito" se necessário
6. Ative o plugin "Automação com Servidor"

### Opção 2: Build do Plugin

```bash
cd obsidian-plugin
npm install
npm run build
```

Copie `main.js` e `manifest.json` para `.obsidian/plugins/automacao-servidor/`

## ⚙️ Configuração

1. Abra `Configurações → Automação com Servidor`
2. Configure:
   - **URL do Servidor**: `http://localhost:3000` (ou URL do seu servidor)
   - **Token de API**: (opcional) Token de autenticação
   - **Sincronização Automática**: Ative para buscar tarefas automaticamente
   - **Intervalo de Sincronização**: Tempo em segundos entre sincronizações (padrão: 60s)

3. Clique em "Testar Conexão" para verificar se está funcionando

## 🎯 Comandos Disponíveis

Acesse via `Ctrl/Cmd+P`:

- **Sincronizar com Servidor** - Sincroniza vault com servidor
- **Enviar Nota Atual para Servidor** - Envia a nota aberta para o servidor
- **Buscar Tarefas do Servidor** - Busca e executa tarefas pendentes

## 🔄 Fluxo de Trabalho

### 1. Enviar Nota para Servidor

```
Obsidian → Plugin → Servidor
```

1. Abra uma nota
2. Execute comando "Enviar Nota Atual para Servidor"
3. Nota é enviada com metadados (data de criação, modificação, tamanho)

### 2. Receber Tarefas do Servidor

```
Servidor → Plugin → Obsidian
```

1. Servidor cria tarefas (criar nota, atualizar, deletar, listar)
2. Plugin busca tarefas periodicamente
3. Tarefas são executadas automaticamente
4. Resultado é enviado de volta ao servidor

### 3. Sincronização Automática

```
Loop: Buscar Tarefas → Executar → Notificar Servidor
```

- Intervalo configurável (padrão: 60s)
- Executa em background
- Notificações visuais de status

## 📋 Tipos de Tarefas Suportadas

### `criar_nota`
Cria nova nota no vault.

```json
{
  "tipo": "criar_nota",
  "params": {
    "arquivo": "Pasta/Nota.md",
    "conteudo": "# Título\n\nConteúdo da nota"
  }
}
```

### `atualizar_nota`
Atualiza nota existente.

```json
{
  "tipo": "atualizar_nota",
  "params": {
    "arquivo": "Pasta/Nota.md",
    "conteudo": "Novo conteúdo"
  }
}
```

### `deletar_nota`
Deleta nota do vault.

```json
{
  "tipo": "deletar_nota",
  "params": {
    "arquivo": "Pasta/Nota.md"
  }
}
```

### `listar_notas`
Lista todas as notas de uma pasta.

```json
{
  "tipo": "listar_notas",
  "params": {
    "pasta": "Pasta/" // opcional, vazio = todas
  }
}
```

## 🔐 Segurança

- **Token de API**: Use token para autenticação segura
- **HTTPS**: Configure servidor com HTTPS em produção
- **Validação**: Todas as operações são validadas antes de executar
- **Logs**: Erros são logados no console do Obsidian (Ctrl/Cmd+Shift+I)

## 🐛 Troubleshooting

### Plugin não aparece na lista

1. Verifique se a pasta está em `.obsidian/plugins/automacao-servidor/`
2. Certifique-se de que `manifest.json` e `main.js` estão presentes
3. Recarregue o Obsidian (Ctrl/Cmd+R)

### Erro de conexão com servidor

1. Verifique se o servidor está rodando
2. Teste a URL no navegador
3. Verifique firewall/antivírus
4. Tente `http://localhost:3000` ao invés de `http://127.0.0.1:3000`

### Tarefas não são executadas

1. Verifique se sincronização automática está ativada
2. Veja logs no console (Ctrl/Cmd+Shift+I)
3. Teste manualmente: "Buscar Tarefas do Servidor"
4. Verifique se servidor tem tarefas pendentes

## 📚 API do Servidor

O plugin se comunica com estes endpoints:

- `POST /api/obsidian/sync` - Sincronizar vault
- `POST /api/obsidian/enviar-nota` - Enviar nota
- `POST /api/obsidian/tarefas` - Buscar tarefas pendentes
- `POST /api/obsidian/tarefa-concluida` - Notificar conclusão
- `POST /api/obsidian/lista-notas` - Enviar lista de notas

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja LICENSE para detalhes

## 🔗 Links Úteis

- [Documentação do Obsidian API](https://github.com/obsidianmd/obsidian-api)
- [Guia de Desenvolvimento de Plugins](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Servidor de Automação](http://localhost:3000)

---

**Desenvolvido com ❤️ para automatizar seu fluxo de trabalho no Obsidian**
