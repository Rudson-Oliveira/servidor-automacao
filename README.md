# Servidor de Automação - Sistema de Comunicação

**Versão:** 1.0.0  
**Status:** ✅ Produção  
**Última Atualização:** 24/11/2025

---

## 📋 Visão Geral

O **Servidor de Automação** é um sistema completo de comunicação e automação que integra múltiplas IAs (Comet, Manus, Perplexity, DeepSITE, Obsidian) para executar tarefas automaticamente através de uma API REST robusta.

### **Principais Funcionalidades:**

O sistema oferece um conjunto abrangente de funcionalidades para automação de tarefas, incluindo criação automática de arquivos no Obsidian através de scripts gerados dinamicamente, pesquisa online em tempo real utilizando Perplexity AI com três modelos diferentes de performance, web scraping inteligente com cache em duas camadas e análise de conteúdo por IA, sistema anti-alucinação que detecta e previne informações fictícias, busca local de arquivos com total privacidade, e gerenciamento de skills através de uma base de conhecimento com 25 skills cadastradas.

### **Métricas de Qualidade:**

O projeto mantém altos padrões de qualidade com 93 testes unitários todos passando, cobertura de 100% dos módulos críticos, zero erros de TypeScript, zero erros de build, e performance validada com tempo de resposta médio de 0.006s.

---

## 🚀 Início Rápido

### **Pré-requisitos:**

Para executar o projeto, você precisa ter Node.js 22.13.0 ou superior, pnpm instalado globalmente, MySQL ou TiDB configurado, e as credenciais das APIs externas (Perplexity, Obsidian).

### **Instalação:**

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]
cd servidor-automacao

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute as migrações do banco
pnpm db:push

# Inicie o servidor de desenvolvimento
pnpm dev
```

### **Acesso:**

Após a inicialização, o servidor estará disponível em `http://localhost:3000`. A documentação da API pode ser acessada em `http://localhost:3000/api/docs`, e o painel de administração está em `http://localhost:3000/admin`.

---

## 📚 Documentação

### **Para Desenvolvedores:**

A documentação técnica inclui o arquivo `API_REFERENCE_COMET.md` com referência completa de todos os endpoints, `RELATORIO_AUDITORIA_COMPLETA_FINAL.md` contendo auditoria completa do sistema, e `drizzle/schema.ts` com o esquema completo do banco de dados.

### **Para o Comet (IA):**

Documentação específica para integração com IA inclui `SCRIPT_TREINAMENTO_COMET_OBSIDIAN.md` com 14 lições sobre integração Obsidian, `GUIA_OBSIDIAN_PARA_COMET_ATUALIZADO.md` contendo guia completo atualizado, e `CONFIRMACAO_OBSIDIAN_PARA_RUDSON.md` com confirmação oficial da integração.

### **Para Usuários:**

Guias de uso incluem `CODIGO_PRONTO_COPIAR_COLAR.md` com exemplos práticos, `GUIA_INTEGRACAO_RAPIDA.md` para início rápido, e `GUIA_PUBLICACAO_EXECUCAO.md` sobre como publicar e executar.

---

## 🔧 Arquitetura

### **Stack Tecnológico:**

O projeto utiliza React 19 com Tailwind CSS 4 no frontend, Express 4 com tRPC 11 no backend, MySQL/TiDB como banco de dados, Drizzle ORM para gerenciamento de dados, e Vitest para testes unitários.

### **Estrutura de Pastas:**

```
servidor-automacao/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── components/ # Componentes reutilizáveis
│   │   └── lib/        # Bibliotecas e utilitários
├── server/              # Backend Express + tRPC
│   ├── routers/        # Routers tRPC
│   ├── routes/         # Rotas REST tradicionais
│   ├── services/       # Serviços de negócio
│   └── _core/          # Núcleo do framework
├── drizzle/            # Esquema e migrações do banco
├── shared/             # Código compartilhado
└── docs/               # Documentação
```

### **Integrações:**

O sistema integra-se com Obsidian através de API Local REST na porta 27123, Perplexity AI usando três modelos de performance diferentes, DeepSITE para web scraping com cache e análise IA, sistema anti-alucinação com detecção automática, e busca local de arquivos com privacidade garantida.

---

## 📊 Skills Disponíveis

### **Categorias:**

As skills estão organizadas nas seguintes categorias: Produtividade (2 skills), Comunicação (3 skills), Planejamento (4 skills), Análise (3 skills), Gestão de Arquivos (4 skills), Pesquisa (1 skill), e outras categorias incluindo Automação, Desenvolvimento e Organização.

### **Skills Principais:**

**Skill 330001 - Criar Arquivo no Obsidian:**
- Categoria: Produtividade
- Autonomia: Alta
- Endpoint: `/api/trpc/obsidian.gerarScriptCriacao`
- Documentação: 13 seções completas
- Performance: ⭐⭐⭐ EXCELENTE (0.006s)

**Skill 330002 - Consultar Perplexity AI:**
- Categoria: Pesquisa
- Autonomia: Alta
- Endpoint: `/api/trpc/perplexity.consultar`
- Modelos: 3 disponíveis
- Performance: Validada

**Skill 330003 - Analisar Website:**
- Categoria: Análise
- Autonomia: Alta
- Endpoint: `/api/deepsite/scrape`
- Recursos: Cache + Análise IA
- Performance: Otimizada

---

## 🧪 Testes

### **Executar Testes:**

```bash
# Todos os testes
pnpm test

# Testes em modo watch
pnpm test:watch

# Cobertura de testes
pnpm test:coverage
```

### **Estatísticas:**

O projeto mantém 93 testes unitários com 100% de taxa de sucesso, tempo total de execução de 1.44 segundos, e tempo médio por teste de 0.015 segundos.

### **Módulos Testados:**

Os testes cobrem URL Validator com 21 testes, Obsidian Router com 15 testes, Perplexity Router com 13 testes, Buscar Arquivos com 8 testes, Anti-Alucinação com 11 testes, Cache Manager com 18 testes, Auth Logout com 1 teste, Status com 2 testes, e Skills Create com 4 testes.

---

## 🔐 Segurança

### **Autenticação:**

O sistema utiliza Manus OAuth para autenticação de usuários, session cookies com JWT para manutenção de sessão, e proteção de rotas através de `protectedProcedure`.

### **Anti-Alucinação:**

O sistema de segurança inclui detecção automática de arquivos fictícios, blacklist de dados conhecidos, score de confiabilidade de 0 a 100, e logs de auditoria automáticos.

### **Privacidade:**

A privacidade é garantida através de busca local executada no CPU do usuário, nenhum dado enviado para servidores externos, e scripts gerados dinamicamente sem armazenamento.

---

## 📈 Performance

### **Métricas Validadas:**

**Obsidian:**
- Tempo de resposta: 0.006s
- Taxa de sucesso: 100%
- Classificação: ⭐⭐⭐ EXCELENTE

**Perplexity:**
- Testes passando: 13/13
- Taxa de sucesso: 100%

**DeepSITE:**
- Cache: 2 camadas (memória + DB)
- Validação: 21/21 testes
- Taxa de sucesso: 100%

**Anti-Alucinação:**
- Detecção: 11/11 testes
- Taxa de sucesso: 100%

---

## 🛠️ Desenvolvimento

### **Scripts Disponíveis:**

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento
pnpm build            # Build para produção
pnpm start            # Inicia servidor de produção

# Banco de Dados
pnpm db:push          # Aplica mudanças no schema
pnpm db:studio        # Abre Drizzle Studio
pnpm db:seed          # Popula banco com dados de teste

# Testes
pnpm test             # Executa todos os testes
pnpm test:watch       # Testes em modo watch
pnpm test:coverage    # Gera relatório de cobertura

# Qualidade de Código
pnpm lint             # Verifica linting
pnpm type-check       # Verifica tipos TypeScript
```

### **Convenções de Código:**

O projeto segue TypeScript strict mode, ESLint com configuração padrão, Prettier para formatação, e nomenclatura camelCase para variáveis e funções.

---

## 🐛 Troubleshooting

### **Problema: Obsidian não conecta**

**Solução:**
1. Verifique se o Obsidian está aberto
2. Confirme que o plugin "Local REST API" está ativo
3. Valide a API key
4. Teste a conexão: `POST /api/obsidian/validar-conexao`

### **Problema: Perplexity retorna erro 401**

**Solução:**
1. Verifique se a API key está correta
2. Confirme que a key não expirou
3. Teste a conexão: `POST /api/trpc/perplexity.testarConexao`

### **Problema: DeepSITE não faz scraping**

**Solução:**
1. Valide a URL primeiro: `POST /api/deepsite/validate-url`
2. Verifique rate limiting: `GET /api/deepsite/rate-limit/status`
3. Limpe o cache se necessário: `DELETE /api/deepsite/cache/clear`

---

## 📞 Suporte

### **Documentação Completa:**

Para informações detalhadas, consulte `API_REFERENCE_COMET.md` para referência completa da API, `RELATORIO_AUDITORIA_COMPLETA_FINAL.md` para auditoria do sistema, e `SCRIPT_TREINAMENTO_COMET_OBSIDIAN.md` para treinamento do Comet.

### **Issues:**

Para reportar bugs ou solicitar features, abra uma issue no repositório do GitHub.

### **Contato:**

Para suporte direto, entre em contato através do email do projeto.

---

## 📝 Changelog

### **Versão 1.0.0 (24/11/2025)**

**Adicionado:**
- ✅ Integração completa com Obsidian (8 endpoints)
- ✅ Integração com Perplexity AI (2 endpoints)
- ✅ Sistema DeepSITE de web scraping (9 endpoints)
- ✅ Sistema anti-alucinação com detecção automática
- ✅ Busca local de arquivos com privacidade
- ✅ 25 skills cadastradas no banco
- ✅ 93 testes unitários (100% passando)
- ✅ Documentação completa para Comet
- ✅ API Reference completa

**Corrigido:**
- ✅ Documentação incorreta sobre API do Obsidian
- ✅ Validação de URLs no DeepSITE
- ✅ Cache em 2 camadas para performance

**Melhorado:**
- ✅ Performance do Obsidian (0.006s)
- ✅ Cobertura de testes (100% módulos críticos)
- ✅ Documentação para desenvolvedores
- ✅ Tratamento de erros

---

## 🎯 Roadmap

### **Curto Prazo (1-2 dias):**
- [ ] Treinar Comet com novos documentos
- [ ] Validar integração Perplexity com Comet
- [ ] Testar DeepSITE com Comet

### **Médio Prazo (1 semana):**
- [ ] Implementar sistema de chamadas de voz (Twilio)
- [ ] Dashboard de comunicações
- [ ] Notificações multi-canal (WhatsApp, SMS, Email)

### **Longo Prazo (1 mês):**
- [ ] Roadmap V2 Hospitalar
- [ ] Expansão de skills (50+ total)
- [ ] Automação avançada com workflows

---

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

---

## 🙏 Agradecimentos

Agradecimentos especiais à equipe Manus pela plataforma de desenvolvimento, ao Rudson pela visão e requisitos do projeto, e à comunidade open-source pelas bibliotecas utilizadas.

---

**Desenvolvido com ❤️ por Manus AI**

**Versão:** 1.0.0  
**Data:** 24/11/2025  
**Status:** ✅ Produção
