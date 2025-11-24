# 🚀 Guia de Execução: Raspagem do Servidor Hospitalar

## 📋 Visão Geral

Este guia orienta a execução do script `network_server_scanner.py` para mapear **35+ departamentos** e **43.000+ arquivos** do servidor hospitalar **192.168.50.11**.

**Importante:** O script deve ser executado **no seu computador Windows** (não no sandbox), pois precisa acessar o servidor local da rede hospitalar.

---

## ✅ Pré-requisitos

### 1. Python Instalado

Verificar se Python está instalado:

```cmd
python --version
```

Se não estiver instalado, baixar de: https://www.python.org/downloads/

### 2. Dependências Python

Instalar bibliotecas necessárias:

```cmd
pip install pysmb requests
```

**Bibliotecas:**
- `pysmb` - Cliente SMB/CIFS para conectar em servidores Windows
- `requests` - HTTP client para enviar dados para API Manus

### 3. Acesso ao Servidor

Você precisa ter:
- ✅ Acesso de rede ao servidor 192.168.50.11
- ✅ Usuário e senha válidos do domínio
- ✅ Permissões de leitura nos compartilhamentos

---

## ⚙️ Configuração do Script

### Passo 1: Baixar o Script

O script já está disponível em:
```
C:\servidor-automacao\network_server_scanner.py
```

Se não estiver, copie do projeto Manus.

### Passo 2: Editar Credenciais

Abra o arquivo `network_server_scanner.py` em um editor de texto e configure suas credenciais:

```python
# Servidor alvo
SERVER_IP = "192.168.50.11"
SERVER_NAME = "SERVIDOR-HOSPITALAR"  # Nome NetBIOS do servidor
SERVER_PORT = 139  # Porta SMB (139 ou 445)

# Credenciais Windows (NTLM)
USERNAME = "seu_usuario"  # ⚠️ ALTERAR AQUI
PASSWORD = "sua_senha"    # ⚠️ ALTERAR AQUI
DOMAIN = "HOSPITAL"       # ⚠️ ALTERAR AQUI (nome do domínio)
CLIENT_NAME = "COMET-SCANNER"

# URL da API (já configurada)
API_BASE_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"
```

**Importante:**
- Substitua `seu_usuario` pelo seu usuário do domínio
- Substitua `sua_senha` pela sua senha
- Substitua `HOSPITAL` pelo nome do domínio Windows
- **NÃO compartilhe o arquivo com credenciais!**

### Passo 3: Descobrir Nome NetBIOS (se necessário)

Se não souber o nome NetBIOS do servidor, execute:

```cmd
nbtstat -A 192.168.50.11
```

Procure por uma linha como:
```
SERVIDOR-HOSPITALAR <00> UNIQUE
```

---

## 🚀 Execução

### Modo Básico

Abra o **Prompt de Comando** (cmd) ou **PowerShell** e execute:

```cmd
cd C:\servidor-automacao
python network_server_scanner.py
```

### Modo com Log Detalhado

Para salvar logs da execução:

```cmd
python network_server_scanner.py > raspagem_log.txt 2>&1
```

### Modo com Timestamp

Para criar log com data/hora:

```powershell
python network_server_scanner.py 2>&1 | Tee-Object -FilePath "raspagem_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
```

---

## 📊 O Que o Script Faz

### 1. Conexão SMB

```
🔌 Conectando ao servidor 192.168.50.11...
✅ Conectado com sucesso!
   Usuário: HOSPITAL\rudson
   Servidor: SERVIDOR-HOSPITALAR (192.168.50.11:139)
```

### 2. Listagem de Compartilhamentos

```
📂 Listando compartilhamentos...
   📁 almoxarifado
   📁 Auditoria
   📁 farmacia
   📁 financeiro
   📁 psicologia
   ...
✅ Total: 35 compartilhamentos
```

### 3. Mapeamento Recursivo

Para cada compartilhamento:

```
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
```

### 4. Extração de Metadados

Para cada arquivo, o script extrai:

- ✅ Nome, caminho, extensão
- ✅ Tamanho em bytes
- ✅ Datas (criação, modificação, acesso)
- ✅ Hash MD5 (arquivos até 50MB)
- ✅ Categoria automática (documento, planilha, imagem, etc.)
- ✅ Conteúdo indexado (arquivos texto até 10MB)
- ✅ Atributos (readonly, hidden, archive)

### 5. Envio para API

```
📤 Enviando lote de 100 arquivos...
✅ Lote enviado com sucesso!
📤 Enviando lote de 100 arquivos...
✅ Lote enviado com sucesso!
...
```

### 6. Relatório Final

```
======================================================================
📊 RELATÓRIO FINAL DA RASPAGEM
======================================================================
Servidor: 192.168.50.11 (SERVIDOR-HOSPITALAR)
Tempo total: 1847.3 segundos (~30 minutos)
Departamentos mapeados: 35
Arquivos encontrados: 43582
Arquivos novos: 43582
Arquivos atualizados: 0
Erros encontrados: 12
======================================================================
```

---

## ⏱️ Tempo Estimado

| Quantidade de Arquivos | Tempo Estimado |
|------------------------|----------------|
| 1.000 arquivos | ~2 minutos |
| 10.000 arquivos | ~15 minutos |
| 43.000 arquivos | **~30-40 minutos** |

**Fatores que afetam o tempo:**
- Velocidade da rede
- Tamanho dos arquivos
- Profundidade da estrutura de pastas
- Carga do servidor

---

## 🐛 Troubleshooting

### Erro: "Connection refused"

**Causa:** Porta SMB bloqueada ou servidor offline

**Solução:**
```cmd
# Verificar se servidor está online
ping 192.168.50.11

# Testar porta 139
telnet 192.168.50.11 139

# Testar porta 445
telnet 192.168.50.11 445

# Se uma porta funcionar, altere SERVER_PORT no script
```

### Erro: "Authentication failed"

**Causa:** Credenciais inválidas

**Solução:**
1. Verificar usuário e senha no script
2. Confirmar nome do domínio
3. Tentar deixar `DOMAIN = ""` para workgroup
4. Verificar se conta não está bloqueada

### Erro: "Access denied" em pastas

**Causa:** Permissões insuficientes

**Solução:**
1. Usar conta com permissões de leitura
2. Verificar ACLs das pastas no servidor
3. Script registra e continua automaticamente

### Erro: "ModuleNotFoundError: No module named 'smb'"

**Causa:** Biblioteca pysmb não instalada

**Solução:**
```cmd
pip install pysmb requests
```

### Erro: "API connection failed"

**Causa:** Servidor Manus offline ou URL incorreta

**Solução:**
1. Verificar se servidor Manus está rodando
2. Testar URL no navegador: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer
3. Verificar conexão com internet

---

## 📊 Verificar Resultados

### No Banco de Dados

Após a execução, os dados estarão salvos em:

1. **Tabela `servidores`**
   - Registro do servidor 192.168.50.11
   - Status, versão, estatísticas

2. **Tabela `departamentos`**
   - 35+ departamentos mapeados
   - Quantidade de arquivos por departamento
   - Tamanho total, datas

3. **Tabela `arquivos_mapeados`**
   - 43.000+ arquivos catalogados
   - Metadados completos
   - Conteúdo indexado

4. **Tabela `logs_raspagem`**
   - Histórico de execuções
   - Erros encontrados
   - Tempo de processamento

### Via Interface Web

Acesse: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer

Você verá:
- Dashboard com estatísticas
- Lista de departamentos
- Busca de arquivos
- Logs de raspagem

---

## 🔄 Raspagem Incremental

O script suporta **raspagem incremental**:

- ✅ Arquivos novos são adicionados
- ✅ Arquivos modificados são atualizados
- ✅ Arquivos deletados são marcados
- ✅ Arquivos não modificados são ignorados

Para executar raspagem incremental, basta rodar o script novamente:

```cmd
python network_server_scanner.py
```

O script compara:
- Hash MD5 dos arquivos
- Data de modificação
- Tamanho

---

## 📅 Agendar Execução Automática

### Windows Task Scheduler

1. Abrir **Agendador de Tarefas** (Task Scheduler)
2. Criar nova tarefa básica
3. Configurar:
   - **Nome:** Raspagem Servidor Hospitalar
   - **Gatilho:** Diariamente às 2h da manhã
   - **Ação:** Iniciar programa
   - **Programa:** `C:\Python\python.exe`
   - **Argumentos:** `C:\servidor-automacao\network_server_scanner.py`
   - **Iniciar em:** `C:\servidor-automacao`

### Script PowerShell Agendado

Criar arquivo `agendar_raspagem.ps1`:

```powershell
$action = New-ScheduledTaskAction -Execute "python.exe" -Argument "C:\servidor-automacao\network_server_scanner.py" -WorkingDirectory "C:\servidor-automacao"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "RaspagemServidorHospitalar" -Action $action -Trigger $trigger -Settings $settings -Description "Raspagem diária do servidor hospitalar"
```

Executar como Administrador:
```powershell
.\agendar_raspagem.ps1
```

---

## 🎯 Próximos Passos Após Raspagem

### 1. Validar Dados no Banco

```sql
-- Total de arquivos mapeados
SELECT COUNT(*) FROM arquivos_mapeados;

-- Arquivos por departamento
SELECT d.nome, COUNT(a.id) as total_arquivos
FROM departamentos d
LEFT JOIN arquivos_mapeados a ON a.departamento_id = d.id
GROUP BY d.id
ORDER BY total_arquivos DESC;

-- Arquivos mais recentes
SELECT nome_arquivo, data_modificacao
FROM arquivos_mapeados
ORDER BY data_modificacao DESC
LIMIT 10;
```

### 2. Executar Análise DeepSite

Escolher um departamento para análise (ex: Contratos):

```cmd
python deepsite_document_analyzer.py "\\192.168.50.11\Contratos" --pasta --recursivo
```

### 3. Gerar Catálogo Obsidian

Usar endpoint REST:

```http
POST /api/obsidian/catalogar-servidor
{
  "servidorId": 1,
  "departamentoId": 5,
  "titulo": "Catálogo de Contratos 2025"
}
```

### 4. Configurar Alertas

Criar alertas para:
- Contratos vencendo em 30 dias
- Documentos importantes modificados
- Novos arquivos em pastas críticas

---

## 📞 Suporte

### Problemas Comuns

1. **Script trava/congela**
   - Verificar logs
   - Verificar conectividade de rede
   - Reiniciar script

2. **Muitos erros "Access denied"**
   - Verificar permissões da conta
   - Usar conta com mais privilégios
   - Ignorar pastas problemáticas

3. **API não recebe dados**
   - Verificar URL da API
   - Verificar firewall
   - Verificar logs do servidor Manus

### Logs

Logs são salvos em:
- Console (saída padrão)
- Arquivo (se redirecionado)
- Banco de dados (tabela `logs_raspagem`)

### Contato

- **Documentação:** README_NETWORK_SCANNER.md
- **Guia DeepSite:** GUIA_AUTONOMIA_DEEPSITE_COMET.md
- **API Reference:** API_REFERENCE_COMET.md

---

## 🔒 Segurança

### Boas Práticas

1. **Não versionar credenciais**
   - Adicionar `network_server_scanner.py` ao `.gitignore`
   - Usar variáveis de ambiente

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

## 📝 Checklist de Execução

Antes de executar:

- [ ] Python instalado e funcionando
- [ ] Dependências instaladas (`pip install pysmb requests`)
- [ ] Credenciais configuradas no script
- [ ] Acesso ao servidor 192.168.50.11 validado
- [ ] Servidor Manus online e acessível
- [ ] Espaço em disco suficiente (banco de dados)

Durante execução:

- [ ] Monitorar logs no console
- [ ] Verificar conexão com servidor
- [ ] Validar envio de dados para API
- [ ] Aguardar conclusão completa

Após execução:

- [ ] Verificar relatório final
- [ ] Validar dados no banco de dados
- [ ] Conferir quantidade de arquivos mapeados
- [ ] Revisar erros encontrados
- [ ] Planejar próxima raspagem incremental

---

## 🎉 Conclusão

Após executar este script com sucesso, você terá:

✅ **35+ departamentos mapeados** no banco de dados  
✅ **43.000+ arquivos catalogados** com metadados completos  
✅ **Base de dados pronta** para análise DeepSite  
✅ **Sistema de busca inteligente** funcionando  
✅ **Catálogos Obsidian** prontos para gerar  

**Tempo total estimado:** 30-40 minutos

**Próximo passo:** Analisar documentos com DeepSite e gerar catálogos inteligentes no Obsidian!

---

**Versão:** 1.0.0  
**Data:** 2025-01-24  
**Autor:** Sistema de Automação Manus + Comet + DeepSite
