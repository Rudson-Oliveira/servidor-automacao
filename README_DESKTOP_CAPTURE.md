# 🖥️ Desktop Capture - Visualização de Área de Trabalho para Comet

## 📋 Visão Geral

O **Desktop Capture** permite que o Comet visualize e analise a área de trabalho do Windows em tempo real, capturando:

✅ **Screenshots** da tela completa  
✅ **Programas abertos** (processos em execução)  
✅ **Janelas ativas** (títulos e aplicações)  
✅ **Uso de recursos** (memória e CPU por programa)  
✅ **Análise visual** com Comet Vision (IA)  

---

## 🚀 Como Usar

### 1. Instalar Dependências

No seu computador Windows, execute:

```bash
pip install -r requirements_desktop_capture.txt
```

**Dependências:**
- `Pillow` - Captura de screenshots
- `psutil` - Informações de processos
- `requests` - Comunicação com API
- `pywin32` - Detecção de janelas (Windows only)

### 2. Configurar URL da API

Edite o arquivo `desktop_capture.py`:

```python
# Para uso local (servidor rodando no mesmo computador)
API_URL = "http://localhost:3000"

# Para uso remoto (servidor publicado)
API_URL = "https://seu-servidor.manus.space"
```

### 3. Executar Captura

```bash
python desktop_capture.py
```

**Saída esperada:**

```
======================================================================
🖥️  COMET VISION - CAPTURA DE ÁREA DE TRABALHO
======================================================================

📸 Capturando screenshot...
✅ Screenshot capturado: 1920x1080

📋 Listando programas abertos...
✅ 47 programas detectados

🪟 Detectando janelas ativas...
✅ 12 janelas ativas detectadas

💾 Salvando dados localmente...
✅ Dados salvos localmente:
   Imagem: C:\Users\Rudson\Desktop\comet_captures\screenshot_20250124_081530.png
   JSON: C:\Users\Rudson\Desktop\comet_captures\dados_20250124_081530.json

🌐 Enviando para API Manus...
✅ Dados enviados com sucesso!
   ID da captura: 1

======================================================================
✅ CAPTURA CONCLUÍDA COM SUCESSO!
======================================================================

📊 RESUMO:
   Screenshot: 1920x1080 pixels
   Programas detectados: 47
   Janelas ativas: 12

🔝 TOP 5 PROGRAMAS (por uso de memória):
   1. chrome.exe - 1024 MB
   2. Code.exe - 512 MB
   3. python.exe - 256 MB
   4. explorer.exe - 128 MB
   5. Obsidian.exe - 96 MB

🪟 JANELAS ABERTAS:
   1. Visual Studio Code - Servidor de Automação (Code.exe)
   2. Google Chrome - Manus (chrome.exe)
   3. Obsidian - Vault Principal (Obsidian.exe)
   ...
```

---

## 📊 Dados Capturados

### Screenshot

- **Formato:** PNG
- **Resolução:** Nativa do monitor
- **Armazenamento:** S3 (via API) + Local (opcional)
- **URL:** Retornada pela API após upload

### Programas

Para cada programa em execução:

```json
{
  "pid": 1234,
  "nome": "chrome.exe",
  "usuario": "DESKTOP\\Rudson",
  "memoria_mb": 1024.5,
  "cpu_percent": 15.2
}
```

### Janelas

Para cada janela aberta:

```json
{
  "titulo": "Google Chrome - Manus",
  "processo": "chrome.exe",
  "pid": 1234
}
```

---

## 🔌 Endpoints da API

### POST `/api/trpc/desktop.capturar`

Recebe captura completa (screenshot + programas + janelas)

**Request:**

```json
{
  "timestamp": "2025-01-24T08:15:30.000Z",
  "screenshot_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "resolucao": {
    "largura": 1920,
    "altura": 1080
  },
  "programas": [...],
  "janelas": [...],
  "total_programas": 47,
  "total_janelas": 12
}
```

**Response:**

```json
{
  "sucesso": true,
  "id": 1,
  "screenshotUrl": "https://s3.amazonaws.com/...",
  "mensagem": "Captura recebida com sucesso"
}
```

### GET `/api/trpc/desktop.listar`

Lista capturas recentes

**Parâmetros:**
- `limite` (opcional, padrão: 20)

**Response:**

```json
[
  {
    "id": 1,
    "timestamp": "2025-01-24T08:15:30.000Z",
    "screenshotUrl": "https://...",
    "resolucaoLargura": 1920,
    "resolucaoAltura": 1080,
    "totalProgramas": 47,
    "totalJanelas": 12,
    "analisado": 0
  }
]
```

### GET `/api/trpc/desktop.buscarPorId`

Busca captura específica com programas e janelas

**Parâmetros:**
- `id` (obrigatório)

**Response:**

```json
{
  "id": 1,
  "timestamp": "2025-01-24T08:15:30.000Z",
  "screenshotUrl": "https://...",
  "programas": [...],
  "janelas": [...],
  "analiseTexto": null
}
```

### POST `/api/trpc/desktop.analisar`

Analisa captura com Comet Vision

**Request:**

```json
{
  "id": 1,
  "prompt": "Identifique todos os programas de desenvolvimento abertos"
}
```

**Response:**

```json
{
  "sucesso": true,
  "analise": "Análise da captura #1:\n\nResolução: 1920x1080\nProgramas detectados: 47\nJanelas abertas: 12\n\nAnálise visual: ..."
}
```

### GET `/api/trpc/desktop.estatisticas`

Estatísticas gerais de capturas

**Response:**

```json
{
  "totalCapturas": 10,
  "analisadas": 7,
  "pendentes": 3,
  "top5Programas": [
    { "nome": "chrome.exe", "count": 10 },
    { "nome": "Code.exe", "count": 8 },
    ...
  ]
}
```

### DELETE `/api/trpc/desktop.deletar`

Deleta captura e dados relacionados

**Request:**

```json
{
  "id": 1
}
```

---

## 💾 Armazenamento Local

Por padrão, o script salva dados localmente em:

```
C:\Users\[SEU_USUARIO]\Desktop\comet_captures\
```

**Arquivos gerados:**

- `screenshot_YYYYMMDD_HHMMSS.png` - Imagem capturada
- `dados_YYYYMMDD_HHMMSS.json` - Dados completos (programas + janelas)

**Desabilitar salvamento local:**

```python
SAVE_LOCAL = False
```

---

## 🤖 Integração com Comet

### Uso Básico

1. **Capturar área de trabalho:**
   ```
   Comet: "Capture minha área de trabalho"
   ```

2. **Analisar captura:**
   ```
   Comet: "Analise a última captura e me diga quais programas estão abertos"
   ```

3. **Buscar informações:**
   ```
   Comet: "Quais programas estão usando mais memória?"
   ```

### Casos de Uso

**1. Monitoramento de Produtividade**

```
Comet: "Capture minha tela a cada hora e me mostre um relatório de quais programas usei mais"
```

**2. Detecção de Problemas**

```
Comet: "Capture minha tela e identifique se há algum programa travado ou usando muita memória"
```

**3. Documentação Automática**

```
Comet: "Capture minha tela e crie uma documentação do meu fluxo de trabalho atual"
```

**4. Análise Visual**

```
Comet: "Analise a captura e me diga se há alguma janela de erro visível"
```

---

## 🔒 Privacidade e Segurança

### Dados Sensíveis

⚠️ **ATENÇÃO:** Screenshots podem conter informações sensíveis:
- Senhas visíveis em campos
- Documentos confidenciais
- Conversas privadas
- Dados bancários

### Boas Práticas

✅ **Revisar antes de capturar** - Feche janelas sensíveis  
✅ **Armazenamento local** - Dados salvos apenas no seu computador  
✅ **Criptografia** - Screenshots enviados via HTTPS  
✅ **Controle de acesso** - API protegida por autenticação  
✅ **Deletar após uso** - Remova capturas antigas  

### Desabilitar Envio para API

Para salvar apenas localmente (sem enviar para API):

```python
def main():
    # ... código de captura ...
    
    # Comentar linha de envio para API
    # enviar_para_api(imagem, programas, janelas)
```

---

## 🛠️ Troubleshooting

### Erro: "Bibliotecas necessárias não instaladas"

```bash
pip install pillow psutil requests
```

### Erro: "API não está acessível"

1. Verificar se servidor está rodando:
   ```bash
   curl http://localhost:3000/api/status
   ```

2. Verificar URL no script:
   ```python
   API_URL = "http://localhost:3000"  # Correto para local
   ```

### Erro: "pywin32 não instalado"

Detecção de janelas não funcionará, mas captura de screenshot e programas sim.

Para instalar:

```bash
pip install pywin32
```

### Screenshot vazio ou preto

- **Causa:** Proteção de DRM em alguns aplicativos
- **Solução:** Feche aplicativos com proteção de conteúdo (Netflix, Prime Video, etc.)

---

## 📈 Próximas Melhorias

- [ ] Captura de múltiplos monitores
- [ ] Gravação de vídeo da tela
- [ ] OCR (extração de texto) automático
- [ ] Detecção de objetos na tela (IA)
- [ ] Comparação entre capturas (diff visual)
- [ ] Agendamento automático de capturas
- [ ] Notificações de eventos específicos
- [ ] Integração com Obsidian (salvar capturas como notas)

---

## 📚 Referências

- [Pillow Documentation](https://pillow.readthedocs.io/)
- [psutil Documentation](https://psutil.readthedocs.io/)
- [pywin32 Documentation](https://github.com/mhammond/pywin32)

---

**Versão:** 1.0.0  
**Data:** 2025-01-24  
**Autor:** Sistema de Automação Manus + Comet Vision
