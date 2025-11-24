# 📦 Guia Completo de Instalação - Desktop Capture

## 🎯 Objetivo

Este guia vai te ajudar a configurar o **Desktop Capture** no seu computador Windows para que o Comet possa visualizar e analisar sua área de trabalho automaticamente.

---

## 📋 Pré-requisitos

✅ **Windows 10 ou 11**  
✅ **Python 3.8 ou superior** ([Download aqui](https://www.python.org/downloads/))  
✅ **Conexão com internet**  
✅ **Permissões de administrador** (para agendamento automático)

---

## 🚀 Instalação Rápida (3 passos)

### Passo 1: Baixar Arquivos

Baixe os seguintes arquivos para uma pasta no seu computador (ex: `C:\Comet\`):

1. `desktop_capture.py` - Script de captura
2. `desktop_scheduler.py` - Script de agendamento
3. `requirements_desktop_capture.txt` - Dependências
4. `instalar_desktop_capture.bat` - Instalador automático
5. `setup_scheduler.bat` - Configurador de agendamento

### Passo 2: Instalar Dependências

1. Abra a pasta onde você salvou os arquivos
2. **Clique com botão direito** em `instalar_desktop_capture.bat`
3. Selecione **"Executar como administrador"**
4. Aguarde a instalação das dependências

**Saída esperada:**

```
========================================
 INSTALADOR DESKTOP CAPTURE
 Comet Vision - Manus
========================================

[OK] Python encontrado:
Python 3.11.0

[OK] pip encontrado:
pip 23.0.1

========================================
 INSTALANDO DEPENDENCIAS...
========================================

Successfully installed Pillow-10.0.0 psutil-5.9.0 requests-2.31.0 schedule-1.2.0

========================================
 INSTALACAO CONCLUIDA COM SUCESSO!
========================================
```

### Passo 3: Configurar URL da API

1. Abra `desktop_capture.py` em um editor de texto (Bloco de Notas, VS Code, etc.)
2. Encontre a linha:
   ```python
   API_URL = "http://localhost:3000"
   ```
3. **Se o servidor estiver no mesmo computador**, deixe como está
4. **Se o servidor estiver em outro lugar**, substitua pela URL correta:
   ```python
   API_URL = "https://seu-servidor.manus.space"
   ```
5. Salve o arquivo

---

## ✅ Teste Manual

Antes de configurar o agendamento automático, vamos testar se tudo está funcionando:

1. Abra o **Prompt de Comando** (cmd)
2. Navegue até a pasta dos scripts:
   ```cmd
   cd C:\Comet
   ```
3. Execute o script de captura:
   ```cmd
   python desktop_capture.py
   ```

**Resultado esperado:**

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
   Imagem: C:\Users\Rudson\Desktop\comet_captures\screenshot_20250124_082530.png
   JSON: C:\Users\Rudson\Desktop\comet_captures\dados_20250124_082530.json

🌐 Enviando para API Manus...
✅ Dados enviados com sucesso!
   ID da captura: 1

======================================================================
✅ CAPTURA CONCLUÍDA COM SUCESSO!
======================================================================
```

Se você ver essa mensagem, **parabéns!** A captura manual está funcionando. 🎉

---

## ⏰ Configurar Agendamento Automático

Agora vamos configurar para capturar automaticamente a cada 30 minutos:

### Opção 1: Usar Task Scheduler (Recomendado)

1. **Clique com botão direito** em `setup_scheduler.bat`
2. Selecione **"Executar como administrador"**
3. Siga as instruções na tela
4. Quando perguntado, escolha **"S" (Sim)** para iniciar agora

**O que acontece:**

- Uma tarefa chamada `Comet_Desktop_Capture` é criada no Agendador de Tarefas do Windows
- A tarefa inicia automaticamente quando você faz login
- Capturas são feitas a cada 30 minutos
- Relatórios semanais são gerados toda segunda-feira às 09:00

### Opção 2: Executar Manualmente

Se preferir controlar quando o agendamento roda:

1. Abra o Prompt de Comando
2. Navegue até a pasta:
   ```cmd
   cd C:\Comet
   ```
3. Execute:
   ```cmd
   python desktop_scheduler.py
   ```
4. Deixe a janela aberta (minimizada)

**Para parar:** Feche a janela do Prompt de Comando ou pressione `Ctrl+C`

---

## 📊 Visualizar Capturas

Depois que algumas capturas forem feitas, você pode visualizá-las de 3 formas:

### 1. Localmente (no seu computador)

Abra a pasta:
```
C:\Users\[SEU_USUARIO]\Desktop\comet_captures\
```

Você verá:
- `screenshot_YYYYMMDD_HHMMSS.png` - Imagens capturadas
- `dados_YYYYMMDD_HHMMSS.json` - Dados dos programas e janelas
- `scheduler.log` - Log de execuções automáticas

### 2. Na Interface Web

Acesse no navegador:
```
http://localhost:3000/desktop-captures
```

Ou se o servidor estiver remoto:
```
https://seu-servidor.manus.space/desktop-captures
```

Você verá:
- **Grid de capturas** com preview de screenshots
- **Estatísticas** (total, analisadas, pendentes)
- **Botão "Detalhes"** para ver programas e janelas
- **Botão "Analisar"** para análise com Comet Vision

### 3. Relatórios Semanais

Toda segunda-feira às 09:00, um relatório é gerado automaticamente em:
```
C:\Users\[SEU_USUARIO]\Desktop\comet_relatorios\
```

O relatório mostra:
- **Top 10 programas mais usados** (com uso de memória)
- **Top 5 janelas mais abertas**
- **Período analisado**
- **Total de capturas**

---

## 🔧 Configurações Avançadas

### Alterar Intervalo de Captura

Edite `desktop_scheduler.py` e altere:

```python
INTERVALO_CAPTURA = 30  # Minutos (padrão: 30)
```

**Exemplos:**
- `15` - Capturar a cada 15 minutos
- `60` - Capturar a cada 1 hora
- `120` - Capturar a cada 2 horas

### Alterar Dia do Relatório Semanal

Edite `desktop_scheduler.py`:

```python
DIA_RELATORIO = 0  # 0=Segunda, 1=Terça, ..., 6=Domingo
HORA_RELATORIO = "09:00"  # Formato 24h
```

### Desabilitar Salvamento Local

Se quiser enviar apenas para a API (sem salvar no computador), edite `desktop_capture.py`:

```python
SAVE_LOCAL = False
```

### Configurar Comet Vision (Análise com IA)

Para habilitar análise visual com IA:

1. Obtenha uma chave de API do Comet Vision
2. Adicione as variáveis de ambiente no servidor:
   ```
   COMET_VISION_API_KEY=sua-chave-aqui
   COMET_VISION_API_URL=https://api.comet.vision/analyze
   ```
3. Reinicie o servidor

Agora o botão "Analisar" na interface web vai:
- **Detectar objetos** na tela
- **Extrair texto** (OCR)
- **Identificar elementos** de interface

---

## 🛠️ Gerenciar Agendamento

### Ver Status da Tarefa

1. Pressione `Win + R`
2. Digite: `taskschd.msc`
3. Pressione Enter
4. Procure por `Comet_Desktop_Capture` na lista

### Pausar Temporariamente

1. Abra o Agendador de Tarefas (passo acima)
2. Clique com botão direito em `Comet_Desktop_Capture`
3. Selecione **"Desabilitar"**

Para reativar, repita e selecione **"Habilitar"**

### Parar Execução Atual

1. Abra o Gerenciador de Tarefas (`Ctrl + Shift + Esc`)
2. Aba **"Detalhes"**
3. Procure por `python.exe` rodando `desktop_scheduler.py`
4. Clique com botão direito → **"Finalizar tarefa"**

### Remover Agendamento

1. Abra o Agendador de Tarefas
2. Clique com botão direito em `Comet_Desktop_Capture`
3. Selecione **"Excluir"**

---

## ❓ Solução de Problemas

### Erro: "Python não encontrado"

**Solução:**
1. Instale Python de: https://www.python.org/downloads/
2. **IMPORTANTE:** Marque a opção "Add Python to PATH" durante a instalação
3. Reinicie o computador
4. Tente novamente

### Erro: "API não está acessível"

**Possíveis causas:**

1. **Servidor não está rodando**
   - Verifique se o servidor Manus está ativo
   - Teste: `curl http://localhost:3000/api/status`

2. **URL incorreta**
   - Verifique `API_URL` em `desktop_capture.py`
   - Para local: `http://localhost:3000`
   - Para remoto: `https://seu-servidor.manus.space`

3. **Firewall bloqueando**
   - Adicione exceção no firewall do Windows
   - Permita conexões para Python

### Erro: "pywin32 não instalado"

**Isso é normal!** A detecção de janelas é opcional.

Se quiser instalar:
```cmd
pip install pywin32
```

### Screenshot vazio ou preto

**Causa:** Alguns aplicativos têm proteção DRM (Netflix, Prime Video, etc.)

**Solução:** Feche esses aplicativos antes da captura

### Tarefa não inicia automaticamente

1. Verifique se executou `setup_scheduler.bat` **como administrador**
2. Abra o Agendador de Tarefas e verifique se `Comet_Desktop_Capture` existe
3. Clique com botão direito → **"Executar"** para testar manualmente
4. Verifique o log: `C:\Users\[USUARIO]\Desktop\comet_captures\scheduler.log`

---

## 📚 Arquivos e Diretórios

```
C:\Comet\                                    (pasta de instalação)
├── desktop_capture.py                       (script de captura)
├── desktop_scheduler.py                     (script de agendamento)
├── requirements_desktop_capture.txt         (dependências)
├── instalar_desktop_capture.bat             (instalador)
└── setup_scheduler.bat                      (configurador)

C:\Users\[USUARIO]\Desktop\comet_captures\   (dados locais)
├── screenshot_20250124_082530.png           (screenshots)
├── dados_20250124_082530.json               (dados JSON)
└── scheduler.log                            (log de execuções)

C:\Users\[USUARIO]\Desktop\comet_relatorios\ (relatórios)
├── relatorio_semanal_20250127.txt           (relatório texto)
└── relatorio_semanal_20250127.json          (dados JSON)
```

---

## 🔒 Privacidade

⚠️ **IMPORTANTE:** Screenshots podem conter informações sensíveis!

**Boas práticas:**

✅ Feche janelas com senhas/dados bancários antes da captura  
✅ Revise capturas locais periodicamente  
✅ Delete capturas antigas que não precisa mais  
✅ Configure `SAVE_LOCAL = False` se não quiser salvar localmente  
✅ Use HTTPS para envio à API (nunca HTTP em produção)

---

## 📞 Suporte

Se tiver problemas:

1. Verifique o log: `comet_captures\scheduler.log`
2. Teste captura manual: `python desktop_capture.py`
3. Verifique se o servidor está acessível
4. Consulte a documentação completa: `README_DESKTOP_CAPTURE.md`

---

**Versão:** 2.0.0  
**Data:** 2025-01-24  
**Autor:** Sistema de Automação Manus + Comet Vision

---

## ✅ Checklist de Instalação

- [ ] Python 3.8+ instalado
- [ ] Dependências instaladas (`instalar_desktop_capture.bat`)
- [ ] URL da API configurada em `desktop_capture.py`
- [ ] Teste manual executado com sucesso
- [ ] Agendamento configurado (`setup_scheduler.bat`)
- [ ] Primeira captura automática realizada
- [ ] Interface web acessível
- [ ] Relatório semanal configurado (opcional)

**Tudo marcado?** Você está pronto! 🎉
