/**
 * SISTEMA DE AUTO-APRENDIZADO E REFINAMENTO
 * ==========================================
 * 
 * Motor de IA que analisa suas próprias execuções, identifica padrões de sucesso/falha,
 * e refina automaticamente instruções e workflows para melhorar continuamente.
 * 
 * Funcionalidades:
 * - Análise de padrões de sucesso e falha
 * - Refinamento automático de instruções
 * - Sistema de feedback loop
 * - Versionamento de workflows
 * - Comparação de performance entre versões
 * - Rollback inteligente
 * - Métricas de evolução
 * - Auto-reflexão e auto-crítica
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { getDb } from "../db";
import { skills, execucoes } from "../../drizzle/schema";
import { eq, desc, and, sql, gte, gt } from "drizzle-orm";
import { invokeLLM } from "./llm";

interface ExecucaoAnalise {
  id: number;
  skillId: number;
  sucesso: boolean;
  tempoExecucao: number;
  erro?: string;
  contexto?: any;
  timestamp: Date;
}

interface PadraoIdentificado {
  tipo: "sucesso" | "falha";
  frequencia: number;
  condicoes: string[];
  sugestaoMelhoria?: string;
}

interface RefinamentoSugerido {
  skillId: number;
  versaoAtual: string;
  versaoNova: string;
  instrucoesAtuais: string;
  instrucoesRefinadas: string;
  justificativa: string;
  confianca: number; // 0-100
  impactoEstimado: string;
}

/**
 * Analisa execuções de uma skill e identifica padrões
 */
export async function analisarPadroesSkill(skillId: number, limite: number = 100): Promise<PadraoIdentificado[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  // Buscar execuções recentes
  const execucoesRecentes = await db
    .select()
    .from(execucoes)
    .where(eq(execucoes.skillId, skillId))
    .orderBy(desc(execucoes.timestamp))
    .limit(limite);

  if (execucoesRecentes.length === 0) {
    return [];
  }

  // Calcular estatísticas
  const totalExecucoes = execucoesRecentes.length;
  const sucessos = execucoesRecentes.filter(e => e.sucesso).length;
  const falhas = totalExecucoes - sucessos;
  const taxaSucesso = (sucessos / totalExecucoes) * 100;

  // Identificar padrões de falha
  const padroesFalha: PadraoIdentificado[] = [];
  const errosAgrupados: Record<string, number> = {};

  execucoesRecentes
    .filter(e => !e.sucesso && e.erro)
    .forEach(e => {
      const erro = e.erro!;
      errosAgrupados[erro] = (errosAgrupados[erro] || 0) + 1;
    });

  // Criar padrões de falha
  Object.entries(errosAgrupados).forEach(([erro, count]) => {
    if (count >= 3) { // Mínimo 3 ocorrências para ser considerado padrão
      padroesFalha.push({
        tipo: "falha",
        frequencia: count,
        condicoes: [erro],
        sugestaoMelhoria: `Erro recorrente: ${erro}. Considere adicionar tratamento específico.`,
      });
    }
  });

  // Identificar padrões de sucesso
  const padroesSucesso: PadraoIdentificado[] = [];
  if (taxaSucesso >= 80) {
    padroesSucesso.push({
      tipo: "sucesso",
      frequencia: sucessos,
      condicoes: ["Taxa de sucesso alta"],
      sugestaoMelhoria: "Skill está funcionando bem. Considere usá-la como template para skills similares.",
    });
  }

  return [...padroesSucesso, ...padroesFalha];
}

/**
 * Refina instruções de uma skill baseado em análise de padrões
 */
export async function refinarInstrucoesSkill(skillId: number): Promise<RefinamentoSugerido | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  // Buscar skill
  const skillsResult = await db
    .select()
    .from(skills)
    .where(eq(skills.id, skillId))
    .limit(1);

  if (skillsResult.length === 0) {
    throw new Error("Skill não encontrada");
  }

  const skill = skillsResult[0];

  // Analisar padrões
  const padroes = await analisarPadroesSkill(skillId);

  if (padroes.length === 0) {
    return null; // Sem dados suficientes para refinamento
  }

  // Buscar execuções recentes para contexto
  const execucoesRecentes = await db
    .select()
    .from(execucoes)
    .where(eq(execucoes.skillId, skillId))
    .orderBy(desc(execucoes.timestamp))
    .limit(20);

  // Preparar contexto para LLM
  const contexto = {
    skill: {
      nome: skill.nome,
      descricao: skill.descricao,
      instrucoes: skill.instrucoes,
      categoria: skill.categoria,
      taxaSucesso: (skill.sucessoCount || 0) / ((skill.sucessoCount || 0) + (skill.falhaCount || 0)) * 100,
    },
    padroes: padroes.map(p => ({
      tipo: p.tipo,
      frequencia: p.frequencia,
      condicoes: p.condicoes,
      sugestao: p.sugestaoMelhoria,
    })),
    execucoesRecentes: execucoesRecentes.map(e => ({
      sucesso: e.sucesso,
      erro: e.erro,
      tempoExecucao: e.tempoExecucao,
    })),
  };

  // Usar LLM para refinar instruções
  const prompt = `Você é um especialista em otimização de workflows e instruções de IA.

Analise a seguinte skill e suas execuções recentes, e sugira melhorias nas instruções para aumentar a taxa de sucesso.

**Skill Atual:**
Nome: ${skill.nome}
Descrição: ${skill.descricao}
Instruções Atuais:
\`\`\`
${skill.instrucoes}
\`\`\`

**Estatísticas:**
- Taxa de Sucesso: ${contexto.skill.taxaSucesso.toFixed(2)}%
- Total de Execuções: ${(skill.sucessoCount || 0) + (skill.falhaCount || 0)}
- Sucessos: ${skill.sucessoCount || 0}
- Falhas: ${skill.falhaCount || 0}

**Padrões Identificados:**
${padroes.map(p => `- ${p.tipo.toUpperCase()}: ${p.condicoes.join(", ")} (${p.frequencia}x)\n  Sugestão: ${p.sugestaoMelhoria}`).join("\n")}

**Execuções Recentes:**
${execucoesRecentes.slice(0, 5).map((e, i) => `${i + 1}. ${e.sucesso ? "✅ Sucesso" : "❌ Falha"} ${e.erro ? `- Erro: ${e.erro}` : ""}`).join("\n")}

**Tarefa:**
1. Analise os padrões de falha e identifique as causas raiz
2. Sugira instruções refinadas que:
   - Tratem especificamente os erros recorrentes
   - Sejam mais claras e específicas
   - Incluam validações e tratamento de erros
   - Mantenham a essência da skill original
3. Explique a justificativa das mudanças
4. Estime o impacto esperado

Responda em JSON no formato:
{
  "instrucoesRefinadas": "...",
  "justificativa": "...",
  "confianca": 85,
  "impactoEstimado": "Redução estimada de 50% nas falhas por timeout"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é um especialista em otimização de workflows de IA. Responda sempre em JSON válido." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "refinamento_skill",
          strict: true,
          schema: {
            type: "object",
            properties: {
              instrucoesRefinadas: { type: "string" },
              justificativa: { type: "string" },
              confianca: { type: "number" },
              impactoEstimado: { type: "string" },
            },
            required: ["instrucoesRefinadas", "justificativa", "confianca", "impactoEstimado"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const resultado = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

    // Gerar nova versão
    const versaoAtual = skill.versao || "1.0";
    const [major, minor] = versaoAtual.split(".").map(Number);
    const versaoNova = `${major}.${minor + 1}`;

    return {
      skillId,
      versaoAtual,
      versaoNova,
      instrucoesAtuais: skill.instrucoes,
      instrucoesRefinadas: resultado.instrucoesRefinadas,
      justificativa: resultado.justificativa,
      confianca: resultado.confianca,
      impactoEstimado: resultado.impactoEstimado,
    };
  } catch (error) {
    console.error("Erro ao refinar instruções:", error);
    return null;
  }
}

/**
 * Aplica refinamento sugerido a uma skill
 */
export async function aplicarRefinamento(refinamento: RefinamentoSugerido): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  try {
    // Atualizar skill com novas instruções
    await db
      .update(skills)
      .set({
        instrucoes: refinamento.instrucoesRefinadas,
        versao: refinamento.versaoNova,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, refinamento.skillId));

    // TODO: Salvar histórico de versões em tabela separada

    return true;
  } catch (error) {
    console.error("Erro ao aplicar refinamento:", error);
    return false;
  }
}

/**
 * Analisa todas as skills e sugere refinamentos
 */
export async function analisarTodasSkills(): Promise<RefinamentoSugerido[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  // Buscar todas as skills e filtrar em memória
  const todasSkills = await db.select().from(skills);
  const skillsComExecucoes = todasSkills.filter(skill => (skill.usoCount || 0) >= 10);

  const refinamentos: RefinamentoSugerido[] = [];

  for (const skill of skillsComExecucoes) {
    try {
      const refinamento = await refinarInstrucoesSkill(skill.id);
      if (refinamento && refinamento.confianca >= 70) {
        refinamentos.push(refinamento);
      }
    } catch (error) {
      console.error(`Erro ao analisar skill ${skill.id}:`, error);
    }
  }

  return refinamentos;
}

/**
 * Sistema de auto-reflexão: IA analisa seus próprios resultados
 */
export async function autoReflexao(execucaoId: number): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  // Buscar execução
  const execucaoResult = await db
    .select()
    .from(execucoes)
    .where(eq(execucoes.id, execucaoId))
    .limit(1);

  if (execucaoResult.length === 0) {
    throw new Error("Execução não encontrada");
  }

  const execucao = execucaoResult[0];

  // Buscar skill relacionada
  if (!execucao.skillId) {
    throw new Error("Execução não possui skillId associado");
  }
  
  const skillResult = await db
    .select()
    .from(skills)
    .where(eq(skills.id, execucao.skillId))
    .limit(1);

  if (skillResult.length === 0) {
    throw new Error("Skill não encontrada");
  }

  const skill = skillResult[0];

  // Prompt de auto-reflexão
  const prompt = `Você acabou de executar uma tarefa. Analise criticamente o resultado e identifique melhorias.

**Tarefa Executada:**
Nome: ${skill.nome}
Instruções: ${skill.instrucoes}

**Resultado:**
- Sucesso: ${execucao.sucesso ? "Sim" : "Não"}
- Tempo de Execução: ${execucao.tempoExecucao}ms
${execucao.erro ? `- Erro: ${execucao.erro}` : ""}

**Perguntas para Auto-Reflexão:**
1. O resultado foi satisfatório? Por quê?
2. Houve algum erro ou problema? Qual foi a causa raiz?
3. Como as instruções poderiam ser melhoradas?
4. Há algum padrão que deveria ser evitado no futuro?
5. Que lições podem ser aprendidas desta execução?

Forneça uma análise crítica e construtiva.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é uma IA que pratica auto-reflexão crítica para melhorar continuamente." },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error("Erro na auto-reflexão:", error);
    return "Erro ao realizar auto-reflexão";
  }
}

/**
 * Compara performance entre versões de uma skill
 */
export async function compararVersoes(skillId: number, versao1: string, versao2: string): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  // TODO: Implementar comparação detalhada entre versões
  // Requer tabela de histórico de versões

  return {
    skillId,
    versao1,
    versao2,
    melhoriaPercentual: 0,
    recomendacao: "Implementar tabela de histórico de versões",
  };
}

/**
 * Detecta regressões em skills (piora de performance)
 */
export async function detectarRegressoes(): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Banco de dados não disponível");
  }

  // Buscar todas as skills e filtrar em memória
  const todasSkills = await db.select().from(skills);
  
  const skillsComRegressao = todasSkills.filter(skill => 
    (skill.falhaCount || 0) > (skill.sucessoCount || 0)
  );

  return skillsComRegressao.map(skill => ({
    skillId: skill.id,
    nome: skill.nome,
    taxaSucesso: ((skill.sucessoCount || 0) / ((skill.sucessoCount || 0) + (skill.falhaCount || 0)) * 100).toFixed(2),
    recomendacao: "Revisar instruções e considerar rollback para versão anterior",
  }));
}
