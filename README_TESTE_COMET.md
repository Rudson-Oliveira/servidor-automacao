# 🧪 Script de Teste da API - Guia de Uso para o Comet

## 📋 Visão Geral

Este script Python permite testar a API de catalogação de links no Obsidian de forma **interativa** e **automatizada**.

**Arquivo:** `teste_api_comet.py`

---

## 🚀 Como Executar

### Opção 1: Execução Direta (Recomendado)

```bash
python3 teste_api_comet.py
```

### Opção 2: Tornar Executável

```bash
chmod +x teste_api_comet.py
./teste_api_comet.py
```

---

## 📦 Requisitos

### Bibliotecas Python Necessárias

```bash
pip install requests
```

**Nota:** A biblioteca `requests` é a única dependência externa. As demais (`json`, `webbrowser`, `datetime`, `typing`) já vêm com Python.

### Verificar Instalação

```bash
python3 -c "import requests; print('✅ requests instalado!')"
```

---

## 🎯 Modos de Execução

### Modo 1: Interativo (Menu)

Permite escolher qual teste executar através de um menu:

```
📋 MENU DE TESTES
1. Teste Simples (1 link)
2. Teste Múltiplos Links (5 links)
3. Teste Categorias Múltiplas (10 links)
4. Executar TODOS os testes
5. Teste Personalizado (você define os dados)
0. Sair
```

**Vantagens:**
- ✅ Controle total sobre qual teste executar
- ✅ Pode criar testes personalizados
- ✅ Escolhe se quer abrir no navegador ou não

### Modo 2: Automático

Executa todos os 3 testes pré-definidos sequencialmente:

1. Teste Simples (1 link)
2. Teste Múltiplos Links (5 links)
3. Teste Categorias Múltiplas (10 links)

**Vantagens:**
- ✅ Rápido para validação completa
- ✅ Não precisa interagir durante execução
- ✅ Gera relatório completo

---

## 📊 Testes Pré-Definidos

### Teste 1: Simples (1 link)

**Objetivo:** Validar funcionalidade básica

**Dados:**
```json
{
  "titulo": "Teste Comet - Simples",
  "links": [
    {
      "nome": "OpenAI",
      "url": "https://openai.com",
      "categoria": "IA"
    }
  ]
}
```

**Validação esperada:**
- [ ] URI gerada com sucesso
- [ ] 1 link na categoria "IA"
- [ ] Arquivo criado no Obsidian

---

### Teste 2: Múltiplos Links (5 links)

**Objetivo:** Validar múltiplos links em categorias diferentes

**Dados:**
- 3 links de "IA Generativa" (OpenAI, Anthropic, Google)
- 2 links de "Desenvolvimento" (GitHub Copilot, Cursor AI)

**Validação esperada:**
- [ ] URI gerada com sucesso
- [ ] 5 links em 2 categorias
- [ ] Links agrupados por categoria

---

### Teste 3: Categorias Múltiplas (10 links)

**Objetivo:** Validar organização com múltiplas categorias

**Dados:**
- 3 links de "IA Generativa"
- 3 links de "Desenvolvimento"
- 3 links de "Produtividade"
- 1 link de "Pesquisa"

**Validação esperada:**
- [ ] URI gerada com sucesso
- [ ] 10 links em 4 categorias
- [ ] Categorias como H2 no markdown
- [ ] Links organizados alfabeticamente por categoria

---

## ✏️ Teste Personalizado

### Como Criar

1. Escolha opção **5** no menu
2. Digite o título do catálogo
3. Adicione links um por um:
   - Nome do link
   - URL
   - Categoria (opcional)
4. Deixe o nome vazio para finalizar
5. Script executa o teste automaticamente

### Exemplo de Uso

```
📝 Título do catálogo: Meus Links Favoritos

--- Link 1 ---
Nome: Manus AI
URL: https://manus.im
Categoria: Produtividade

--- Link 2 ---
Nome: GitHub
URL: https://github.com
Categoria: Desenvolvimento

--- Link 3 ---
Nome: (deixe vazio para finalizar)
```

---

## 📋 Checklist de Validação

Após cada teste, o script exibe um checklist:

```
📋 CHECKLIST DE VALIDAÇÃO:
   [ ] Obsidian abriu automaticamente?
   [ ] Arquivo foi criado no local correto?
   [ ] Título está correto (H1)?
   [ ] Data de geração está presente?
   [ ] Estatísticas estão corretas?
   [ ] Links estão clicáveis?
   [ ] CRÍTICO: Quebras de linha funcionando (sem \n literal)?
```

**Valide cada item** e reporte problemas ao Manus.

---

## 🔍 Interpretando os Resultados

### Sucesso ✅

```
📊 RESULTADO DA API
✅ Status: SUCESSO
📄 Arquivo: Teste Comet - Simples.md
🔗 Total de Links: 1
📁 Categorias: 1

🔗 URI Gerada:
obsidian://new?file=GERAL%20RUDSON%2FTeste%20Comet%20-%20Simples.md&content=...
```

**O que fazer:**
1. Copiar a URI
2. Colar no navegador OU clicar "s" quando perguntado
3. Validar arquivo no Obsidian

### Erro ❌

```
📤 Enviando requisição para API...
   Status Code: 500
   ❌ Erro: 500
   Resposta: {"error": "Internal Server Error"}
```

**O que fazer:**
1. Copiar mensagem de erro completa
2. Reportar ao Manus
3. Aguardar correção

---

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError: No module named 'requests'"

**Solução:**
```bash
pip install requests
```

### Erro: "Connection refused" ou "Timeout"

**Possíveis causas:**
1. Servidor não está rodando
2. URL incorreta
3. Firewall bloqueando

**Solução:**
1. Verificar se servidor está online
2. Testar URL no navegador primeiro
3. Reportar ao Manus

### Erro: "URI muito longa" (truncada no terminal)

**Não é um erro!** URIs longas são normais (podem ter 1000+ caracteres).

**Solução:**
- Copie a URI completa (Ctrl+C no terminal)
- Cole no navegador
- Funciona normalmente

### Navegador não abre automaticamente

**Solução:**
1. Copie a URI manualmente
2. Cole no navegador
3. Pressione Enter

---

## 📊 Exemplo de Execução Completa

```bash
$ python3 teste_api_comet.py

======================================================================
🧪 TESTE DA API DE CATALOGAÇÃO DE LINKS NO OBSIDIAN
======================================================================
📅 Data/Hora: 24/11/2025 05:30:00
🔗 API URL: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/api/obsidian/catalogar-links
======================================================================

🎯 MODOS DE EXECUÇÃO:
1. Modo Interativo (Menu)
2. Modo Automático (Executa todos os testes)

🤔 Escolha o modo (1 ou 2): 1

======================================================================
📋 MENU DE TESTES
======================================================================
1. Teste Simples (1 link)
2. Teste Múltiplos Links (5 links)
3. Teste Categorias Múltiplas (10 links)
4. Executar TODOS os testes
5. Teste Personalizado (você define os dados)
0. Sair
======================================================================

🤔 Escolha uma opção (0-5): 1

======================================================================
🧪 EXECUTANDO: Teste Simples
======================================================================
📤 Enviando requisição para API...
   Título: Teste Comet - Simples
   Total de links: 1
   Status Code: 200
   ✅ Sucesso!

======================================================================
📊 RESULTADO DA API
======================================================================
✅ Status: SUCESSO
📄 Arquivo: Teste Comet - Simples.md
🔗 Total de Links: 1
📁 Categorias: 1

🔗 URI Gerada:
----------------------------------------------------------------------
obsidian://new?file=GERAL%20RUDSON%2FTeste%20Comet%20-%20Simples.md&content=...
----------------------------------------------------------------------

======================================================================
🌐 ABRIR NO OBSIDIAN
======================================================================

🤔 Deseja abrir a URI no navegador agora? (s/n): s
🚀 Abrindo URI no navegador...
✅ Navegador aberto! O Obsidian deve abrir automaticamente.

📋 CHECKLIST DE VALIDAÇÃO:
   [ ] Obsidian abriu automaticamente?
   [ ] Arquivo foi criado no local correto?
   [ ] Título está correto (H1)?
   [ ] Data de geração está presente?
   [ ] Estatísticas estão corretas?
   [ ] Links estão clicáveis?
   [ ] CRÍTICO: Quebras de linha funcionando (sem \n literal)?

======================================================================
✅ TESTE CONCLUÍDO: Teste Simples
======================================================================
```

---

## 📞 Suporte

**Se encontrar problemas:**

1. **Copie a mensagem de erro completa**
2. **Tire screenshot (se possível)**
3. **Reporte ao Manus** com:
   - Qual teste estava executando
   - Mensagem de erro
   - Screenshot do terminal

**Manus vai:**
- ✅ Analisar o problema
- ✅ Corrigir o código
- ✅ Gerar nova versão
- ✅ Te ajudar a testar novamente

---

## 🎯 Próximos Passos Após Testes

1. **Validar todos os 3 testes pré-definidos**
2. **Criar 1 teste personalizado**
3. **Reportar resultados ao Manus**
4. **Discutir teste em massa (436 links)**

---

## ✅ Checklist Final

Antes de reportar sucesso, confirme:

- [ ] Executei Teste 1 (Simples)
- [ ] Executei Teste 2 (Múltiplos Links)
- [ ] Executei Teste 3 (Categorias Múltiplas)
- [ ] Criei 1 Teste Personalizado
- [ ] Validei formatação no Obsidian
- [ ] Quebras de linha funcionando
- [ ] Links clicáveis
- [ ] Categorias organizadas
- [ ] Sem erros encontrados

---

**Boa sorte nos testes, Comet! 🚀**

Se precisar de ajuda, o Manus está aguardando! 😊
