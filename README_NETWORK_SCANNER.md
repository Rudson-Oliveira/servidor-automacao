# 🤖 Network Server Scanner - Guia Completo

Script Python para raspagem de servidores SMB/Windows com autenticação NTLM.

---

## 📋 Pré-requisitos

### 1. Instalar Dependências

```bash
pip install pysmb requests
```

**Bibliotecas:**
- `pysmb` - Cliente SMB/CIFS para Python (suporta NTLM)
- `requests` - HTTP client para comunicação com API

---

## ⚙️ Configuração

### 1. Editar Credenciais no Script

Abra `network_server_scanner.py` e configure:

```python
# Servidor alvo
SERVER_IP = "192.168.50.11"  # IP do servidor
SERVER_NAME = "SERVIDOR-HOSPITALAR"  # Nome NetBIOS
SERVER_PORT = 139  # 139 (NetBIOS) ou 445 (SMB direto)

# Credenciais Windows (NTLM)
USERNAME = "seu_usuario"  # Usuário do domínio
PASSWORD = "sua_senha"  # Senha
DOMAIN = "DOMINIO"  # Domínio Windows (ou vazio para workgroup)
CLIENT_NAME = "COMET-SCANNER"  # Nome da máquina cliente

# API do sistema
API_BASE_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"
```

### 2. Descobrir Nome NetBIOS do Servidor

**Windows:**
```cmd
nbtstat -A 192.168.50.11
```

**Linux:**
```bash
nmblookup -A 192.168.50.11
```

---

## 🚀 Execução

### Modo Básico

```bash
python3 network_server_scanner.py
```

### Com Saída Detalhada

```bash
python3 network_server_scanner.py 2>&1 | tee raspagem_$(date +%Y%m%d_%H%M%S).log
```

---

## 📊 O Que o Script Faz

### 1. **Conexão SMB**
- Conecta ao servidor usando autenticação NTLM
- Suporta NTLMv2 (mais seguro)
- Trata erros de conexão automaticamente

### 2. **Listagem de Compartilhamentos**
- Lista todos os shares disponíveis
- Filtra shares de sistema (terminados em $)
- Exibe lista formatada

### 3. **Mapeamento Recursivo**
- Percorre toda a estrutura de pastas
- Profundidade máxima: 10 níveis (configurável)
- Trata permissões negadas graciosamente

### 4. **Extração de Metadados**
Para cada arquivo:
- ✅ Nome, caminho, extensão
- ✅ Tamanho, datas (criação, modificação, acesso)
- ✅ Hash MD5 (arquivos até 50MB)
- ✅ Categoria automática (documento, planilha, imagem, etc.)
- ✅ Indexação de conteúdo (arquivos texto até 10MB)
- ✅ Atributos (readonly, hidden, archive)

### 5. **Envio para API**
- Envia dados em lotes de 100 arquivos
- Retry automático (3 tentativas)
- Delay de 5s entre tentativas

### 6. **Relatório Final**
- Estatísticas completas
- Tempo de execução
- Arquivos processados
- Erros encontrados

---

## 📂 Estrutura de Dados Enviados

### Informações de Arquivo

```json
{
  "nome": "relatorio.pdf",
  "caminho_completo": "\\\\192.168.50.11\\financeiro\\relatorios\\relatorio.pdf",
  "caminho_relativo": "/relatorios/relatorio.pdf",
  "share": "financeiro",
  "extensao": ".pdf",
  "tipo_arquivo": "documento",
  "tamanho": 1048576,
  "data_criacao": "2025-01-15T10:30:00",
  "data_modificacao": "2025-11-20T14:45:00",
  "data_acesso": "2025-11-24T09:00:00",
  "hash": "5d41402abc4b2a76b9719d911017c592",
  "conteudo_indexado": "Relatório Financeiro 2025...",
  "is_readonly": false,
  "is_hidden": false,
  "is_archive": true
}
```

---

## 🎯 Categorias de Arquivos

O script categoriza automaticamente:

| Categoria | Extensões |
|-----------|-----------|
| **documento** | .doc, .docx, .pdf, .txt, .odt, .rtf |
| **planilha** | .xls, .xlsx, .ods, .csv |
| **apresentacao** | .ppt, .pptx, .odp |
| **imagem** | .jpg, .png, .gif, .bmp, .svg |
| **video** | .mp4, .avi, .mkv, .mov |
| **audio** | .mp3, .wav, .ogg, .flac |
| **compactado** | .zip, .rar, .7z, .tar, .gz |
| **executavel** | .exe, .msi, .bat, .sh |
| **codigo** | .py, .js, .java, .c, .cpp, .php |
| **banco_dados** | .db, .sqlite, .mdb, .sql |
| **email** | .msg, .eml, .pst |

---

## ⚙️ Configurações Avançadas

### Ajustar Profundidade Máxima

```python
MAX_DEPTH = 10  # Número de níveis de subpastas
```

### Ajustar Tamanho Máximo para Indexação

```python
MAX_FILE_SIZE_INDEX = 10 * 1024 * 1024  # 10MB
```

### Ajustar Tamanho do Lote

```python
BATCH_SIZE = 100  # Arquivos por lote enviado à API
```

### Adicionar Extensões Indexáveis

```python
INDEXABLE_EXTENSIONS = [
    '.txt', '.md', '.csv', '.json', '.xml',
    # Adicione mais extensões aqui
]
```

---

## 🐛 Troubleshooting

### Erro: "Connection refused"

**Causa:** Porta SMB bloqueada ou servidor offline

**Solução:**
1. Verificar se servidor está online: `ping 192.168.50.11`
2. Testar porta 139: `telnet 192.168.50.11 139`
3. Testar porta 445: `telnet 192.168.50.11 445`
4. Tentar trocar `SERVER_PORT` entre 139 e 445

### Erro: "Authentication failed"

**Causa:** Credenciais inválidas ou domínio errado

**Solução:**
1. Verificar usuário e senha
2. Confirmar nome do domínio
3. Tentar deixar `DOMAIN = ""` para workgroup
4. Verificar se conta não está bloqueada

### Erro: "Access denied" em pastas

**Causa:** Permissões insuficientes

**Solução:**
1. Usar conta com permissões de leitura
2. Verificar ACLs das pastas no servidor
3. Script registra e continua automaticamente

### Erro: "Name resolution failed"

**Causa:** Nome NetBIOS não resolvido

**Solução:**
1. Usar IP em vez de nome
2. Adicionar entrada no `/etc/hosts` (Linux) ou `C:\Windows\System32\drivers\etc\hosts` (Windows)
3. Verificar DNS/WINS

---

## 📊 Exemplo de Saída

```
======================================================================
🤖 MENTOR E LEITOR DE ENDPOINTS - Network Server Scanner
======================================================================
📅 Data/Hora: 24/11/2025 10:30:00
🎯 Servidor alvo: 192.168.50.11 (SERVIDOR-HOSPITALAR)
👤 Usuário: DOMINIO\usuario
======================================================================

🔌 Conectando ao servidor 192.168.50.11...
✅ Conectado com sucesso!
   Usuário: DOMINIO\usuario
   Servidor: SERVIDOR-HOSPITALAR (192.168.50.11:139)

📂 Listando compartilhamentos...
   📁 almoxarifado
   📁 Auditoria
   📁 farmacia
   📁 financeiro
   📁 psicologia
   ...

✅ Total: 35 compartilhamentos

======================================================================
📂 Mapeando compartilhamento: psicologia
======================================================================
📁 pacientes/
  📁 2025/
    📄 paciente_001.pdf (245.3 KB)
    📄 paciente_002.pdf (189.7 KB)
  📁 2024/
    📄 relatorio_anual.docx (1.2 MB)
...

✅ Compartilhamento 'psicologia': 1247 arquivos encontrados

📤 Enviando lote de 100 arquivos...
✅ Lote enviado com sucesso!

======================================================================
📊 RELATÓRIO FINAL DA RASPAGEM
======================================================================
Servidor: 192.168.50.11 (SERVIDOR-HOSPITALAR)
Tempo total: 1847.3 segundos
Departamentos mapeados: 35
Arquivos encontrados: 43582
Arquivos novos: 43582
Arquivos atualizados: 0
Erros encontrados: 12
======================================================================

👋 Desconectado do servidor
```

---

## 🔒 Segurança

### Boas Práticas

1. **Não commitar credenciais**
   - Usar variáveis de ambiente
   - Criar arquivo `.env` (não versionado)

2. **Usar conta com permissões mínimas**
   - Apenas leitura
   - Sem permissões administrativas

3. **Monitorar logs**
   - Registrar todas as operações
   - Alertar em caso de erros

4. **Criptografar dados sensíveis**
   - Usar HTTPS para API
   - Não expor conteúdo indexado publicamente

---

## 🚀 Próximos Passos

Após executar o scanner:

1. **Verificar dados no banco**
   - Acessar interface web
   - Conferir departamentos mapeados

2. **Gerar catálogo Obsidian**
   - Usar endpoint `/api/obsidian/catalogar-servidor`
   - Visualizar no Obsidian

3. **Agendar execução periódica**
   - Cron job (Linux)
   - Task Scheduler (Windows)
   - Exemplo: diário às 2h da manhã

4. **Configurar alertas**
   - Arquivos modificados
   - Novos arquivos importantes
   - Erros de acesso

---

## 📞 Suporte

**Problemas ou dúvidas:**
- Verificar logs de execução
- Consultar seção Troubleshooting
- Reportar ao Manus com detalhes do erro

---

## 📝 Changelog

### v1.0.0 (24/11/2025)
- ✅ Conexão SMB com autenticação NTLM
- ✅ Mapeamento recursivo de estrutura
- ✅ Extração completa de metadados
- ✅ Categorização automática de arquivos
- ✅ Indexação de conteúdo textual
- ✅ Cálculo de hash MD5
- ✅ Envio em lotes para API
- ✅ Sistema de retry automático
- ✅ Tratamento de erros robusto
- ✅ Relatório estatístico completo


---

## 🤖 Integração com DeepSite

Após mapear os arquivos do servidor, você pode analisá-los inteligentemente usando **DeepSite** (Hugging Face).

### Script de Análise

**Arquivo:** `deepsite_document_analyzer.py`

**Função:** Analisar conteúdo de documentos usando IA (resumo, sentimento, entidades)

**Instalação:**
```bash
pip install -r requirements_deepsite.txt
```

**Uso:**
```bash
# Analisar arquivo único
python deepsite_document_analyzer.py "\\192.168.50.11\Contratos\Fornecedor_2025.pdf" --arquivo-id 12345

# Analisar pasta inteira
python deepsite_document_analyzer.py "\\192.168.50.11\Contratos" --pasta --recursivo
```

**Resultado:**
- ✅ Resumo automático do documento
- ✅ Análise de sentimento (positivo/negativo)
- ✅ Extração de entidades (datas, valores, organizações)
- ✅ Categorização inteligente
- ✅ Busca semântica por conteúdo

### Documentação DeepSite

- **GUIA_AUTONOMIA_DEEPSITE_COMET.md** - Guia completo de uso do DeepSite
- **CONTORNO_POLITICAS_PRIVACIDADE.md** - Como contornar políticas restritivas
- **requirements_deepsite.txt** - Dependências Python

### Endpoints REST

**Análise Individual:**
```http
POST /api/deepsite/analisar-arquivo
{
  "arquivoId": 12345,
  "forcarReanalise": false
}
```

**Análise em Lote:**
```http
POST /api/deepsite/analisar-lote
{
  "arquivoIds": [123, 456, 789],
  "forcarReanalise": false
}
```

**Busca Inteligente:**
```http
POST /api/deepsite/buscar-inteligente
{
  "termo": "contrato fornecedor medicamentos",
  "departamentoId": 5,
  "limite": 20
}
```

---

## 📚 Documentação Completa

### Scripts Python
- **network_server_scanner.py** - Raspagem de servidores SMB/Windows
- **deepsite_document_analyzer.py** - Análise inteligente de documentos

### Guias
- **README_NETWORK_SCANNER.md** - Este arquivo
- **GUIA_AUTONOMIA_DEEPSITE_COMET.md** - Guia de autonomia DeepSite
- **CONTORNO_POLITICAS_PRIVACIDADE.md** - Sistema de contorno de políticas
- **API_REFERENCE_COMET.md** - Referência completa de APIs
- **PROTOCOLO_OBRIGATORIO_COMET.md** - Protocolo de segurança

### Dependências
- **requirements_deepsite.txt** - Dependências Python para DeepSite
  - PyPDF2 (processamento de PDF)
  - python-docx (processamento de DOCX)
  - requests (HTTP client)
