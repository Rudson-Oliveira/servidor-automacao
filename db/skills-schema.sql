-- Tabela de Skills (Habilidades) para Base de Conhecimento
CREATE TABLE IF NOT EXISTS skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL UNIQUE,
    descricao TEXT,
    instrucoes TEXT NOT NULL,
    exemplo TEXT,
    tags VARCHAR(500),
    categoria VARCHAR(100),
    autonomia_nivel ENUM('baixa', 'media', 'alta', 'total') DEFAULT 'media',
    uso_count INT DEFAULT 0,
    sucesso_count INT DEFAULT 0,
    falha_count INT DEFAULT 0,
    ultima_execucao TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_categoria (categoria),
    INDEX idx_tags (tags(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir skill de varredura de área de trabalho
INSERT INTO skills (
    nome,
    descricao,
    instrucoes,
    exemplo,
    tags,
    categoria,
    autonomia_nivel
) VALUES (
    'Varrer Área de Trabalho',
    'Lista documentos e arquivos da área de trabalho do Windows com informações detalhadas e links públicos de acesso',
    '## INSTRUÇÕES DE EXECUÇÃO

### Objetivo:
Listar documentos da área de trabalho do Windows com links públicos de acesso.

### Passos:
1. Acessar área de trabalho do Windows (Desktop)
2. Varrer todos os arquivos e pastas
3. Selecionar os N primeiros itens (conforme solicitado)
4. Para cada item, coletar:
   - Nome completo
   - Tipo de arquivo/pasta
   - Tamanho (em KB/MB)
   - Data de modificação
5. Gerar links públicos:
   - Se for arquivo: fazer upload para Google Drive/Dropbox
   - Se for pasta: listar conteúdo
   - Gerar link de compartilhamento público
6. Formatar resultado em tabela

### Formato de Saída:
```
| # | Nome | Tipo | Link Público | Tamanho | Data |
|---|------|------|--------------|---------|------|
| 1 | arquivo.pdf | PDF | https://... | 2.5 MB | 22/11/2025 |
```

### Autonomia:
- Executar sem pedir confirmações
- Resolver problemas automaticamente
- Tentar métodos alternativos se falhar
- Continuar até completar todos os itens

### Tratamento de Erros:
- Se arquivo não acessível: pular e continuar
- Se upload falhar: tentar serviço alternativo
- Se pasta vazia: informar no relatório
- Documentar todos os erros encontrados',
    
    'Exemplo de uso:
    
Usuário: "Liste 15 documentos da minha área de trabalho com links públicos"

Comet:
1. Acessa Desktop
2. Lista arquivos
3. Faz upload para Google Drive
4. Gera links públicos
5. Retorna tabela formatada

Resultado: Tabela com 15 documentos e links públicos funcionais',
    
    'automacao,arquivos,desktop,windows,varredura,listagem,links,compartilhamento',
    'Automação de Arquivos',
    'total'
);

-- Inserir skill de correção de erros
INSERT INTO skills (
    nome,
    descricao,
    instrucoes,
    tags,
    categoria,
    autonomia_nivel
) VALUES (
    'Corrigir Erro Automaticamente',
    'Identifica tipo de erro e gera solução alternativa automaticamente',
    '## INSTRUÇÕES DE CORREÇÃO DE ERROS

### Objetivo:
Identificar erro e gerar solução alternativa automaticamente.

### Tipos de Erro Reconhecidos:
1. Política de Segurança
2. CORS
3. Timeout
4. Rate Limit
5. Permissão Negada

### Processo:
1. Analisar mensagem de erro
2. Identificar tipo
3. Gerar solução específica
4. Criar código alternativo se necessário
5. Testar solução
6. Reportar resultado

### Autonomia Total:
- Não pedir confirmação
- Implementar solução imediatamente
- Documentar o que foi feito',
    
    'erro,correcao,solucao,automatico,debugging',
    'Correção Automática',
    'total'
);

-- Inserir skill de execução de tarefas
INSERT INTO skills (
    nome,
    descricao,
    instrucoes,
    tags,
    categoria,
    autonomia_nivel
) VALUES (
    'Executar Tarefa no Navegador',
    'Executa tarefa no navegador ativo (Comet, Abacus, Fellou, Genspark, Manus) com detecção automática',
    '## INSTRUÇÕES DE EXECUÇÃO DE TAREFA

### Objetivo:
Executar tarefa no navegador ativo automaticamente.

### Navegadores Suportados:
- Comet
- Abacus
- Fellou
- Genspark
- Manus

### Processo:
1. Detectar navegador ativo
2. Usar APENAS esse navegador (economia de custos)
3. Executar tarefa
4. Se erro de política: ativar Plano B
5. Plano B: usar API alternativa
6. Reportar resultado com métricas

### Métricas:
- Navegador usado
- Plano B ativado? (sim/não)
- Tempo de execução
- Custo estimado
- Taxa de sucesso',
    
    'navegador,execucao,tarefa,automatico,deteccao',
    'Execução de Tarefas',
    'total'
);
