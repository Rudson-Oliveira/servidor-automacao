/**
 * Módulo de Integração DeepSite (Hugging Face API)
 * 
 * Fornece análise inteligente de documentos usando modelos de IA:
 * - Extração de texto
 * - Análise de entidades (NER)
 * - Classificação de documentos
 * - Geração de resumos
 * - Detecção de idioma e sentimento
 * 
 * AUTONOMIA: Sistema com fallback local para contornar políticas de privacidade
 */

import { ENV } from "./env";

// ========================================
// CONFIGURAÇÃO
// ========================================

const HUGGINGFACE_API_KEY = "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";
const HUGGINGFACE_API_URL = "https://router.huggingface.co/models";

// Modelos recomendados para diferentes tarefas
const MODELS = {
  // Análise de texto em português
  textAnalysis: "neuralmind/bert-base-portuguese-cased",
  
  // Extração de entidades (NER)
  ner: "pierreguillou/bert-base-cased-pt-lenerbr",
  
  // Classificação de documentos
  classification: "neuralmind/bert-base-portuguese-cased",
  
  // Geração de resumos
  summarization: "facebook/bart-large-cnn",  // Inglês, mas funciona bem
  
  // Detecção de idioma
  languageDetection: "papluca/xlm-roberta-base-language-detection",
  
  // Análise de sentimento
  sentiment: "cardiffnlp/twitter-xlm-roberta-base-sentiment",
};

// ========================================
// TIPOS
// ========================================

export interface DeepSiteAnalysisResult {
  sucesso: boolean;
  modelo: string;
  tempoProcessamento: number;
  resultado: any;
  erro?: string;
  fallbackUsado?: boolean;
}

export interface DocumentAnalysis {
  resumo: string;
  palavrasChave: string[];
  entidades: {
    tipo: string;
    texto: string;
    confianca: number;
  }[];
  categoria: string;
  idioma: string;
  sentimento: {
    label: string;
    score: number;
  };
  importancia: number;  // 0-1
  alertas: {
    tipo: string;
    severidade: 'info' | 'aviso' | 'erro' | 'critico';
    titulo: string;
    mensagem: string;
  }[];
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Faz requisição para API do Hugging Face
 */
async function callHuggingFaceAPI(
  model: string,
  inputs: any,
  parameters?: any
): Promise<DeepSiteAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        parameters,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const resultado = await response.json();
    const tempoProcessamento = Date.now() - startTime;

    return {
      sucesso: true,
      modelo: model,
      tempoProcessamento,
      resultado,
    };
  } catch (error) {
    console.error(`[DeepSite] Erro ao chamar modelo ${model}:`, error);
    
    return {
      sucesso: false,
      modelo: model,
      tempoProcessamento: Date.now() - startTime,
      resultado: null,
      erro: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fallback local quando API falha (AUTONOMIA)
 * Usa processamento simples baseado em regras
 */
function fallbackLocalAnalysis(texto: string): Partial<DocumentAnalysis> {
  console.log("[DeepSite] Usando fallback local (autonomia ativada)");
  
  // Análise básica local
  const palavras = texto.toLowerCase().split(/\s+/);
  const totalPalavras = palavras.length;
  
  // Palavras-chave simples (frequência)
  const frequencia: Record<string, number> = {};
  palavras.forEach(p => {
    if (p.length > 4) {  // Ignora palavras muito curtas
      frequencia[p] = (frequencia[p] || 0) + 1;
    }
  });
  
  const palavrasChave = Object.entries(frequencia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([palavra]) => palavra);
  
  // Resumo simples (primeiras 200 palavras)
  const resumo = palavras.slice(0, 200).join(' ') + '...';
  
  // Detecção de idioma simples
  const portuguesWords = ['o', 'a', 'de', 'para', 'com', 'em', 'por'];
  const portuguesCount = palavras.filter(p => portuguesWords.includes(p)).length;
  const idioma = portuguesCount > totalPalavras * 0.1 ? 'pt' : 'en';
  
  // Categoria básica por palavras-chave
  const categorias: Record<string, string[]> = {
    'contrato': ['contrato', 'cláusula', 'partes', 'acordo'],
    'relatório': ['relatório', 'análise', 'resultado', 'conclusão'],
    'prontuário': ['paciente', 'médico', 'diagnóstico', 'tratamento'],
    'financeiro': ['valor', 'pagamento', 'fatura', 'orçamento'],
  };
  
  let categoria = 'geral';
  for (const [cat, keywords] of Object.entries(categorias)) {
    if (keywords.some(kw => texto.toLowerCase().includes(kw))) {
      categoria = cat;
      break;
    }
  }
  
  return {
    resumo,
    palavrasChave,
    idioma,
    categoria,
    entidades: [],
    sentimento: { label: 'NEUTRAL', score: 0.5 },
    importancia: 0.5,
    alertas: [{
      tipo: 'fallback_usado',
      severidade: 'info',
      titulo: 'Análise Local Utilizada',
      mensagem: 'API DeepSite indisponível. Análise básica local foi aplicada.',
    }],
  };
}

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

/**
 * Analisa documento completo (função principal)
 * 
 * AUTONOMIA: Usa API se disponível, fallback local se não
 */
export async function analisarDocumento(
  texto: string,
  opcoes?: {
    forcarFallback?: boolean;
    incluirResumo?: boolean;
    incluirEntidades?: boolean;
    incluirSentimento?: boolean;
  }
): Promise<DocumentAnalysis> {
  const opts = {
    forcarFallback: false,
    incluirResumo: true,
    incluirEntidades: true,
    incluirSentimento: true,
    ...opcoes,
  };
  
  // Se forçar fallback (para testes ou autonomia total)
  if (opts.forcarFallback) {
    return fallbackLocalAnalysis(texto) as DocumentAnalysis;
  }
  
  try {
    // Análise paralela de diferentes aspectos
    const [
      resumoResult,
      nerResult,
      sentimentResult,
      languageResult,
    ] = await Promise.allSettled([
      opts.incluirResumo ? callHuggingFaceAPI(MODELS.summarization, texto, { max_length: 200 }) : Promise.resolve(null),
      opts.incluirEntidades ? callHuggingFaceAPI(MODELS.ner, texto) : Promise.resolve(null),
      opts.incluirSentimento ? callHuggingFaceAPI(MODELS.sentiment, texto) : Promise.resolve(null),
      callHuggingFaceAPI(MODELS.languageDetection, texto),
    ]);
    
    // Processar resultados
    const resumo = resumoResult.status === 'fulfilled' && resumoResult.value?.sucesso
      ? resumoResult.value.resultado[0]?.summary_text || ''
      : texto.substring(0, 500) + '...';
    
    const entidades = nerResult.status === 'fulfilled' && nerResult.value?.sucesso
      ? (nerResult.value.resultado || []).map((ent: any) => ({
          tipo: ent.entity_group || ent.entity,
          texto: ent.word,
          confianca: ent.score,
        }))
      : [];
    
    const sentimento = sentimentResult.status === 'fulfilled' && sentimentResult.value?.sucesso
      ? sentimentResult.value.resultado[0]
      : { label: 'NEUTRAL', score: 0.5 };
    
    const idioma = languageResult.status === 'fulfilled' && languageResult.value?.sucesso
      ? languageResult.value.resultado[0]?.label || 'pt'
      : 'pt';
    
    // Extrair palavras-chave das entidades ou fallback
    const palavrasChave = entidades.length > 0
      ? entidades.slice(0, 10).map((e: any) => e.texto)
      : texto.split(/\s+/).filter((p: string) => p.length > 4).slice(0, 10);
    
    // Classificação simples baseada em palavras-chave
    const categorias: Record<string, string[]> = {
      'contrato': ['contrato', 'cláusula', 'partes', 'acordo', 'assinatura'],
      'relatório': ['relatório', 'análise', 'resultado', 'conclusão', 'dados'],
      'prontuário': ['paciente', 'médico', 'diagnóstico', 'tratamento', 'exame'],
      'financeiro': ['valor', 'pagamento', 'fatura', 'orçamento', 'custo'],
      'jurídico': ['lei', 'processo', 'tribunal', 'advogado', 'sentença'],
    };
    
    let categoria = 'geral';
    for (const [cat, keywords] of Object.entries(categorias)) {
      if (keywords.some(kw => texto.toLowerCase().includes(kw))) {
        categoria = cat;
        break;
      }
    }
    
    // Calcular importância (0-1)
    let importancia = 0.5;
    const palavrasImportantes = ['urgente', 'crítico', 'importante', 'prioridade', 'confidencial'];
    if (palavrasImportantes.some(p => texto.toLowerCase().includes(p))) {
      importancia = 0.9;
    }
    
    // Gerar alertas
    const alertas: DocumentAnalysis['alertas'] = [];
    
    if (importancia > 0.8) {
      alertas.push({
        tipo: 'arquivo_importante',
        severidade: 'aviso',
        titulo: 'Documento Importante Detectado',
        mensagem: 'Este documento contém palavras-chave de alta prioridade.',
      });
    }
    
    // Detectar vencimentos (regex simples)
    const vencimentoRegex = /vencimento.*?(\d{1,2}\/\d{1,2}\/\d{2,4})/gi;
    const vencimentos = texto.match(vencimentoRegex);
    if (vencimentos && vencimentos.length > 0) {
      alertas.push({
        tipo: 'vencimento_detectado',
        severidade: 'aviso',
        titulo: 'Vencimento Detectado',
        mensagem: `Encontrado(s) ${vencimentos.length} vencimento(s) no documento.`,
      });
    }
    
    return {
      resumo,
      palavrasChave,
      entidades,
      categoria,
      idioma,
      sentimento,
      importancia,
      alertas,
    };
    
  } catch (error) {
    console.error("[DeepSite] Erro na análise, usando fallback:", error);
    
    // AUTONOMIA: Fallback automático em caso de erro
    const fallbackResult = fallbackLocalAnalysis(texto);
    return {
      ...fallbackResult,
      alertas: [
        ...(fallbackResult.alertas || []),
        {
          tipo: 'erro_api',
          severidade: 'erro',
          titulo: 'Erro na API DeepSite',
          mensagem: error instanceof Error ? error.message : 'Erro desconhecido. Fallback local ativado.',
        },
      ],
    } as DocumentAnalysis;
  }
}

/**
 * Extrai apenas entidades (NER)
 */
export async function extrairEntidades(texto: string) {
  const result = await callHuggingFaceAPI(MODELS.ner, texto);
  
  if (!result.sucesso) {
    return { entidades: [], erro: result.erro };
  }
  
  return {
    entidades: (result.resultado || []).map((ent: any) => ({
      tipo: ent.entity_group || ent.entity,
      texto: ent.word,
      confianca: ent.score,
    })),
  };
}

/**
 * Gera resumo automático
 */
export async function gerarResumo(texto: string, maxLength: number = 200) {
  const result = await callHuggingFaceAPI(MODELS.summarization, texto, { max_length: maxLength });
  
  if (!result.sucesso) {
    // Fallback: primeiras N palavras
    return {
      resumo: texto.split(/\s+/).slice(0, maxLength / 2).join(' ') + '...',
      fallback: true,
      erro: result.erro,
    };
  }
  
  return {
    resumo: result.resultado[0]?.summary_text || '',
    fallback: false,
  };
}

/**
 * Detecta idioma
 */
export async function detectarIdioma(texto: string) {
  const result = await callHuggingFaceAPI(MODELS.languageDetection, texto);
  
  if (!result.sucesso) {
    return { idioma: 'pt', confianca: 0.5, fallback: true };
  }
  
  return {
    idioma: result.resultado[0]?.label || 'pt',
    confianca: result.resultado[0]?.score || 0.5,
    fallback: false,
  };
}

/**
 * Analisa sentimento
 */
export async function analisarSentimento(texto: string) {
  const result = await callHuggingFaceAPI(MODELS.sentiment, texto);
  
  if (!result.sucesso) {
    return { sentimento: 'NEUTRAL', confianca: 0.5, fallback: true };
  }
  
  return {
    sentimento: result.resultado[0]?.label || 'NEUTRAL',
    confianca: result.resultado[0]?.score || 0.5,
    fallback: false,
  };
}

/**
 * Teste de conectividade com API
 */
export async function testarConexao(): Promise<{ sucesso: boolean; mensagem: string; tempoResposta?: number }> {
  const startTime = Date.now();
  
  try {
    const result = await callHuggingFaceAPI(
      MODELS.languageDetection,
      "Este é um teste de conexão com a API DeepSite."
    );
    
    return {
      sucesso: result.sucesso,
      mensagem: result.sucesso 
        ? "Conexão com DeepSite estabelecida com sucesso!"
        : `Erro: ${result.erro}`,
      tempoResposta: Date.now() - startTime,
    };
  } catch (error) {
    return {
      sucesso: false,
      mensagem: `Erro ao testar conexão: ${error instanceof Error ? error.message : String(error)}`,
      tempoResposta: Date.now() - startTime,
    };
  }
}
