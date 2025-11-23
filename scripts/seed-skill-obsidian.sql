-- Skill: Criar Arquivo no Obsidian
-- Permite ao Comet criar arquivos automaticamente no vault do Obsidian do usuário

INSERT INTO skills (
  nome,
  descricao,
  instrucoes,
  exemplo,
  tags,
  categoria,
  autonomia_nivel,
  uso_count,
  sucesso_count,
  falha_count
) VALUES (
  'Criar Arquivo no Obsidian',
  'Cria arquivos markdown automaticamente no vault do Obsidian usando a API Local REST. Ideal para criar notas, checklists, OKRs e documentos estruturados.',
  '# Como Usar Esta Skill

## 1. Endpoint Principal
POST /api/trpc/obsidian.gerarScriptCriacao

## 2. Parâmetros Obrigatórios
- **nomeArquivo**: Nome do arquivo (ex: "minhas-notas.md")
- **conteudo**: Conteúdo markdown do arquivo
- **apiKey**: Chave da API Local REST do Obsidian (fornecida pelo usuário)

## 3. Parâmetros Opcionais
- **caminho**: Caminho relativo no vault (ex: "projetos/2025")
- **porta**: Porta da API (padrão: 27123)
- **usarHttps**: Usar HTTPS (padrão: false)

## 4. Fluxo de Execução
1. Solicitar ao endpoint a geração do script
2. Receber script Python e PowerShell
3. Informar ao usuário para executar o script no CPU local
4. Script cria arquivo automaticamente no Obsidian

## 5. Exemplo de Requisição
```json
{
  "nomeArquivo": "08_TESTE_Comet_Manus.md",
  "conteudo": "# Minha Nota\\n\\nConteúdo aqui",
  "caminho": "",
  "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383",
  "porta": 27123,
  "usarHttps": false
}
```

## 6. Resposta
O endpoint retorna:
- **scripts.python**: Script Python pronto para executar
- **scripts.powershell**: Script PowerShell alternativo
- **instrucoes**: Instruções de execução por plataforma
- **observacoes**: Avisos importantes

## 7. Tipos de Arquivos Suportados
- Notas markdown (.md)
- Checklists
- OKRs (Objectives and Key Results)
- Documentos estruturados
- Daily notes
- Templates

## 8. Estrutura de Conteúdo Recomendada

### Para Checklists:
```markdown
# Título da Checklist

- [ ] Tarefa 1
- [ ] Tarefa 2
- [x] Tarefa concluída
```

### Para OKRs:
```markdown
# OKR Q1 2025

## Objective 1: Aumentar produtividade
- **KR1**: Automatizar 80% das tarefas repetitivas
- **KR2**: Reduzir tempo de execução em 50%
- **KR3**: Implementar 10 novas skills

## Objective 2: Melhorar integração
- **KR1**: Conectar 5 sistemas diferentes
- **KR2**: Taxa de sucesso > 95%
```

### Para Daily Notes:
```markdown
# {{data}}

## 🎯 Objetivos do Dia
- [ ] Objetivo 1
- [ ] Objetivo 2

## 📝 Notas
- Nota importante aqui

## ✅ Realizações
- [ ] Realização 1
```

## 9. Tratamento de Erros
- Verificar se Obsidian está aberto
- Confirmar que plugin Local REST API está ativo
- Validar API key
- Verificar conectividade na porta especificada

## 10. Endpoint de Teste Rápido
POST /api/trpc/obsidian.criarArquivoTesteComet

Parâmetros:
- **apiKey**: Chave da API
- **porta** (opcional): Porta da API
- **usarHttps** (opcional): Usar HTTPS

Cria automaticamente um arquivo de teste "08_TESTE_Comet_Manus.md" com checklist pré-configurada.

## 11. Boas Práticas
- Sempre usar nomes descritivos para arquivos
- Incluir data/hora em arquivos temporários
- Usar estrutura de pastas organizada (caminho)
- Validar conteúdo antes de criar arquivo
- Testar com arquivo de teste primeiro

## 12. Limitações
- Requer execução local do script (não pode ser executado remotamente)
- Obsidian deve estar aberto e rodando
- Plugin Local REST API deve estar ativo
- Certificado SSL auto-assinado (ignora verificação)

## 13. Segurança
- API key é sensível - não compartilhar
- Scripts são gerados dinamicamente
- Execução 100% local no CPU do usuário
- Nenhum dado é enviado para servidores externos',
  '{
  "cenario": "Criar checklist diária no Obsidian",
  "requisicao": {
    "endpoint": "/api/trpc/obsidian.gerarScriptCriacao",
    "metodo": "POST",
    "body": {
      "nomeArquivo": "2025-01-23-checklist.md",
      "conteudo": "# Checklist - 23/01/2025\\n\\n## 🎯 Tarefas do Dia\\n- [ ] Revisar emails\\n- [ ] Reunião com equipe\\n- [ ] Atualizar documentação\\n\\n## 📝 Notas\\n- Lembrar de confirmar reunião\\n\\n## ✅ Concluído\\n- [x] Planejar dia",
      "caminho": "daily-notes",
      "apiKey": "9158ad0eb1c3be5ba7ac1b743c4404e9ebc25464ef88f9bec0bc07528e0b2383"
    }
  },
  "resposta_esperada": {
    "sucesso": true,
    "arquivoFinal": "daily-notes/2025-01-23-checklist.md",
    "scripts": {
      "python": "#!/usr/bin/env python3\\n...",
      "powershell": "# Script PowerShell..."
    },
    "instrucoes": {
      "windows": ["1. Salve o script...", "2. Execute..."],
      "linux_mac": ["1. Salve o script...", "2. Execute..."]
    }
  },
  "proximos_passos": [
    "1. Salvar script Python como criar_arquivo.py",
    "2. Executar: python criar_arquivo.py",
    "3. Verificar arquivo criado no Obsidian",
    "4. Confirmar sucesso da operação"
  ]
}',
  'obsidian,markdown,notas,checklist,okr,automacao,vault,api,local-rest-api',
  'Produtividade',
  'alta',
  0,
  0,
  0
);
