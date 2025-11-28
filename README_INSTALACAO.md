# 📥 Guia de Instalação - Servidor de Automação

**Versão:** 1.0.0  
**Data:** 28 de Novembro de 2025  
**Autor:** Manus AI

---

## 🎯 Visão Geral

O **Servidor de Automação** oferece **3 formas diferentes de instalação** para atender diferentes necessidades e níveis técnicos. Este guia detalha cada método passo a passo, permitindo que você escolha a opção mais adequada para seu caso de uso.

### Comparação Rápida

| Característica | Instalador .EXE | Acesso Web | API REST |
|----------------|-----------------|------------|----------|
| **Facilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Velocidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Privacidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibilidade** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Requer Internet** | ❌ Não | ✅ Sim | ✅ Sim |
| **Requer Instalação** | ✅ Sim | ❌ Não | ❌ Não |
| **Público-Alvo** | Usuários finais | Todos | Desenvolvedores |

---

## 📦 Opção 1: Instalador Windows (.EXE)

### Descrição

O instalador Windows empacota todo o sistema em um único executável que roda localmente no seu computador. Esta é a opção **mais privada** e **não requer internet** após a instalação.

### Requisitos do Sistema

**Mínimos:**
- **Sistema Operacional:** Windows 10 (64-bit) ou superior
- **Processador:** Intel Core i3 ou equivalente
- **Memória RAM:** 4 GB
- **Espaço em Disco:** 500 MB livres
- **Resolução de Tela:** 1280x720 ou superior

**Recomendados:**
- **Sistema Operacional:** Windows 11 (64-bit)
- **Processador:** Intel Core i5 ou superior
- **Memória RAM:** 8 GB ou mais
- **Espaço em Disco:** 1 GB livres
- **Resolução de Tela:** 1920x1080 ou superior

### Passo a Passo

#### 1. Download do Instalador

Acesse a página de download e clique no botão **"Baixar Instalador (.exe)"**:

```
http://localhost:3000/download
```

Ou baixe diretamente via URL:

```
http://localhost:3000/api/download/installer-windows.exe
```

**Tamanho do arquivo:** ~150 MB  
**Tempo estimado de download:** 2-5 minutos (depende da conexão)

#### 2. Executar o Instalador

1. Localize o arquivo baixado (geralmente em `Downloads`)
2. **Clique duplo** no arquivo `servidor-automacao-setup.exe`
3. Se aparecer aviso do Windows Defender:
   - Clique em **"Mais informações"**
   - Clique em **"Executar assim mesmo"**
   - (Isso é normal para aplicações não assinadas digitalmente)

#### 3. Processo de Instalação

O instalador irá:

1. **Extrair arquivos** para `C:\Program Files\Servidor Automacao\`
2. **Configurar variáveis de ambiente**
3. **Criar atalhos** no Menu Iniciar e Área de Trabalho
4. **Iniciar o serviço** em segundo plano
5. **Abrir o navegador** automaticamente em `http://localhost:3000`

**Tempo estimado:** 2-3 minutos

#### 4. Primeiro Acesso

Após a instalação:

1. O navegador abrirá automaticamente
2. Você verá a tela inicial do sistema
3. Faça login ou crie uma conta
4. Pronto! O sistema está rodando localmente

### Verificação da Instalação

Para verificar se o sistema está rodando:

**Opção 1: Ícone na bandeja do sistema**
- Procure o ícone do Servidor de Automação na bandeja (próximo ao relógio)
- Clique com botão direito → **"Status"**
- Deve mostrar: ✅ **"Sistema rodando"**

**Opção 2: Gerenciador de Tarefas**
- Abra o Gerenciador de Tarefas (Ctrl+Shift+Esc)
- Procure por `servidor-automacao.exe`
- Se estiver na lista, o sistema está rodando

**Opção 3: Navegador**
- Abra `http://localhost:3000`
- Se carregar a interface, está funcionando

### Desinstalação

Para remover o sistema:

1. Painel de Controle → **Programas e Recursos**
2. Localize **"Servidor de Automação"**
3. Clique em **"Desinstalar"**
4. Siga as instruções na tela

Ou use o desinstalador:

```
C:\Program Files\Servidor Automacao\uninstall.exe
```

---

## 🌐 Opção 2: Acesso Web (Sem Instalação)

### Descrição

Acesse o sistema diretamente pelo navegador, sem precisar instalar nada. Esta é a opção **mais rápida** para começar a usar.

### Requisitos

- **Navegador:** Chrome 90+, Edge 90+, Firefox 88+, ou Safari 14+
- **Conexão com Internet:** Necessária
- **JavaScript:** Habilitado (padrão em todos os navegadores)

### Passo a Passo

#### 1. Acessar o Sistema

Abra seu navegador e acesse:

```
https://seu-dominio.com
```

Ou, se estiver rodando localmente:

```
http://localhost:3000
```

#### 2. Criar Conta ou Fazer Login

1. Clique em **"Criar Conta"** (primeira vez)
2. Preencha seus dados:
   - Nome completo
   - Email
   - Senha (mínimo 8 caracteres)
3. Clique em **"Cadastrar"**
4. Confirme seu email (se solicitado)

**Ou faça login** se já tiver conta:

1. Clique em **"Entrar"**
2. Digite email e senha
3. Clique em **"Acessar"**

#### 3. Explorar o Sistema

Após o login, você terá acesso a:

- **Dashboard Principal** - Visão geral do sistema
- **WhatsApp Automation** - Envio automatizado de mensagens
- **Desktop Control** - Controle remoto do computador
- **Obsidian Integration** - Gerenciamento de notas
- **AI Governance** - Configuração de IAs
- **E muito mais...**

### Vantagens do Acesso Web

✅ **Sem instalação** - Comece a usar imediatamente  
✅ **Multiplataforma** - Funciona em Windows, Mac, Linux  
✅ **Sempre atualizado** - Sem necessidade de atualizar manualmente  
✅ **Acesso remoto** - Use de qualquer lugar com internet  
✅ **Sincronização automática** - Dados salvos na nuvem  

### Desvantagens

❌ **Requer internet** - Não funciona offline  
❌ **Menos privado** - Dados trafegam pela internet  
❌ **Dependente do servidor** - Se o servidor cair, você não acessa  

---

## 💻 Opção 3: API REST (Para Desenvolvedores)

### Descrição

Integre o Servidor de Automação com seus próprios sistemas através da API REST. Esta é a opção **mais flexível** para desenvolvedores.

### Requisitos

- **Conhecimento técnico:** Programação básica (qualquer linguagem)
- **Ferramenta de API:** Postman, Insomnia, cURL, ou biblioteca HTTP
- **API Key:** Obtida após cadastro no sistema

### Endpoints Principais

A API oferece **150+ endpoints** organizados em categorias:

#### 1. Autenticação

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "sua-senha"
}
```

**Resposta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Seu Nome",
    "email": "seu@email.com"
  }
}
```

#### 2. WhatsApp Automation

```http
POST /api/trpc/whatsapp.send
Authorization: Bearer {seu-token}
Content-Type: application/json

{
  "sessionId": 1,
  "number": "5511999999999",
  "message": "Olá! Esta é uma mensagem automática."
}
```

#### 3. Desktop Control

```http
POST /api/trpc/desktop.execute
Authorization: Bearer {seu-token}
Content-Type: application/json

{
  "command": "screenshot",
  "params": {
    "fullscreen": true
  }
}
```

#### 4. Obsidian Integration

```http
GET /api/trpc/obsidian.listNotes
Authorization: Bearer {seu-token}

{
  "vaultId": 1,
  "limit": 50
}
```

### Documentação Completa

Acesse a documentação interativa da API:

```
http://localhost:3000/api/docs
```

Ou consulte os arquivos de documentação:

- **API_REFERENCE_COMET.md** - Referência completa de endpoints
- **COMET_KNOWLEDGE_BASE_FINAL.md** - Base de conhecimento para IAs
- **GUIA_INTEGRACAO_RAPIDA.md** - Guia de integração rápida

### Exemplo de Integração (Python)

```python
import requests

# Configuração
API_URL = "http://localhost:3000/api"
API_KEY = "sua-api-key-aqui"

# Headers
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Enviar mensagem WhatsApp
response = requests.post(
    f"{API_URL}/trpc/whatsapp.send",
    headers=headers,
    json={
        "sessionId": 1,
        "number": "5511999999999",
        "message": "Olá do Python!"
    }
)

print(response.json())
```

### Exemplo de Integração (JavaScript/Node.js)

```javascript
const axios = require('axios');

// Configuração
const API_URL = 'http://localhost:3000/api';
const API_KEY = 'sua-api-key-aqui';

// Enviar mensagem WhatsApp
async function sendWhatsApp() {
  try {
    const response = await axios.post(
      `${API_URL}/trpc/whatsapp.send`,
      {
        sessionId: 1,
        number: '5511999999999',
        message: 'Olá do Node.js!'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
}

sendWhatsApp();
```

### Rate Limiting

A API possui limites de requisições para evitar sobrecarga:

| Plano | Requisições/Minuto | Requisições/Dia |
|-------|-------------------|-----------------|
| **Free** | 60 | 10.000 |
| **Pro** | 300 | 100.000 |
| **Enterprise** | Ilimitado | Ilimitado |

Se exceder o limite, você receberá:

```json
{
  "error": "Rate limit exceeded",
  "message": "Você excedeu o limite de 60 requisições por minuto.",
  "retryAfter": 45
}
```

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente

Se você instalou via .EXE, pode configurar variáveis de ambiente:

**Localização do arquivo de configuração:**
```
C:\Program Files\Servidor Automacao\.env
```

**Variáveis principais:**

```env
# Porta do servidor (padrão: 3000)
PORT=3000

# Banco de dados
DATABASE_URL=mysql://user:password@localhost:3306/servidor_automacao

# APIs externas
PERPLEXITY_API_KEY=sua-chave-aqui
OBSIDIAN_API_KEY=sua-chave-aqui

# Segurança
JWT_SECRET=seu-segredo-jwt-aqui
```

### Firewall

Se você não conseguir acessar o sistema, pode ser necessário liberar a porta no firewall:

**Windows Firewall:**

1. Painel de Controle → **Windows Defender Firewall**
2. **Configurações avançadas**
3. **Regras de Entrada** → **Nova Regra**
4. Tipo: **Porta**
5. Protocolo: **TCP**
6. Porta: **3000**
7. Ação: **Permitir conexão**
8. Nome: **Servidor de Automação**

---

## 🆘 Solução de Problemas

### Problema: Instalador não abre

**Possíveis causas:**
- Windows Defender bloqueou o arquivo
- Arquivo corrompido no download
- Falta de permissões de administrador

**Soluções:**

1. **Desabilitar temporariamente o antivírus**
   - Windows Defender → Proteção contra vírus e ameaças
   - Desativar proteção em tempo real
   - Executar o instalador
   - Reativar proteção

2. **Executar como administrador**
   - Clique direito no instalador
   - **"Executar como administrador"**

3. **Baixar novamente**
   - Delete o arquivo baixado
   - Limpe o cache do navegador
   - Baixe novamente

### Problema: Sistema não inicia após instalação

**Verificações:**

1. **Porta 3000 está ocupada?**
   ```cmd
   netstat -ano | findstr :3000
   ```
   Se houver resultado, outra aplicação está usando a porta.

2. **Serviço está rodando?**
   - Gerenciador de Tarefas → Processos
   - Procure por `servidor-automacao.exe`

3. **Logs de erro**
   - Abra o arquivo de log:
   ```
   C:\Program Files\Servidor Automacao\logs\error.log
   ```

### Problema: Não consigo fazer login

**Soluções:**

1. **Esqueci a senha**
   - Clique em "Esqueci minha senha"
   - Digite seu email
   - Siga as instruções no email

2. **Conta não existe**
   - Clique em "Criar Conta"
   - Cadastre-se novamente

3. **Erro de autenticação**
   - Limpe o cache do navegador
   - Tente em uma janela anônima
   - Verifique se o sistema está atualizado

### Problema: API retorna erro 401 (Unauthorized)

**Causas comuns:**

1. **Token expirado**
   - Faça login novamente para obter novo token

2. **API Key inválida**
   - Verifique se copiou corretamente
   - Gere uma nova API Key no sistema

3. **Header incorreto**
   - Use: `Authorization: Bearer {token}`
   - Não use: `Authorization: {token}`

---

## 📞 Suporte

### Canais de Suporte

- **Email:** suporte@servidor-automacao.com
- **Discord:** https://discord.gg/servidor-automacao
- **GitHub Issues:** https://github.com/seu-usuario/servidor-automacao/issues
- **Documentação:** http://localhost:3000/docs

### Horário de Atendimento

- **Segunda a Sexta:** 9h às 18h (horário de Brasília)
- **Tempo de resposta:** Até 24 horas úteis

### Antes de Entrar em Contato

Por favor, tenha em mãos:

1. **Versão do sistema** (ex: 1.0.0)
2. **Sistema operacional** (ex: Windows 11 64-bit)
3. **Descrição do problema** (o mais detalhada possível)
4. **Logs de erro** (se houver)
5. **Screenshots** (se aplicável)

---

## 🎉 Próximos Passos

Após a instalação bem-sucedida:

1. **Leia o Guia de Uso Rápido:** `GUIA_USO_RAPIDO.md`
2. **Explore os tutoriais:** http://localhost:3000/tutoriais
3. **Configure suas integrações:** WhatsApp, Obsidian, Desktop
4. **Crie sua primeira automação**
5. **Junte-se à comunidade:** Discord, GitHub

---

**Desenvolvido com ❤️ por Manus AI**  
**Versão:** 1.0.0 | **Data:** 28/11/2025
