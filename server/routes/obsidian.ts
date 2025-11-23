import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db';
import { obsidianOperations } from '../../drizzle/schema';

const router = Router();

// Schema de validação para configuração
const ConfigSchema = z.object({
  api_key: z.string().min(10),
  vault_path: z.string().min(1),
  porta: z.number().default(27123),
  usar_https: z.boolean().default(true)
});

// Schema para criação de arquivo
const CriarArquivoSchema = z.object({
  caminho: z.string().min(1),
  conteudo: z.string(),
  criar_pastas: z.boolean().default(true)
});

// Schema para múltiplos arquivos
const CriarMultiplosSchema = z.object({
  arquivos: z.array(z.object({
    caminho: z.string().min(1),
    conteudo: z.string()
  }))
});

// Armazenar configuração em memória (pode ser movido para banco depois)
let obsidianConfig: {
  api_key: string;
  vault_path: string;
  porta: number;
  usar_https: boolean;
  base_url: string;
} | null = null;

/**
 * POST /api/obsidian/configurar
 * Configura conexão com Obsidian Local REST API
 */
router.post('/configurar', async (req, res) => {
  try {
    const config = ConfigSchema.parse(req.body);
    
    const protocolo = config.usar_https ? 'https' : 'http';
    const base_url = `${protocolo}://127.0.0.1:${config.porta}`;
    
    obsidianConfig = {
      ...config,
      base_url
    };
    
    // Testar conexão
    try {
      const response = await fetch(`${base_url}/vault/`, {
        headers: {
          'Authorization': `Bearer ${config.api_key}`
        },
        // Ignorar erros de certificado SSL auto-assinado
        // @ts-ignore
        agent: new (await import('https')).Agent({ rejectUnauthorized: false })
      });
      
      if (response.ok) {
        const db = await getDb();
        if (db) {
          await db.insert(obsidianOperations).values({
            operacao: 'configurar',
            status: 'sucesso',
            detalhes: JSON.stringify({ base_url, vault_path: config.vault_path })
          });
        }
        
        res.json({
          sucesso: true,
          mensagem: 'Conexão com Obsidian configurada com sucesso',
          base_url
        });
      } else {
        throw new Error(`Falha na conexão: ${response.status} ${response.statusText}`);
      }
    } catch (erro: any) {
      const db = await getDb();
      if (db) {
        await db.insert(obsidianOperations).values({
          operacao: 'configurar',
          status: 'falha',
          erro: erro.message
        });
      }
      
      res.status(500).json({
        sucesso: false,
        erro: 'Não foi possível conectar ao Obsidian. Verifique se o plugin Local REST API está instalado e ativo.',
        detalhes: erro.message
      });
    }
  } catch (erro: any) {
    res.status(400).json({
      sucesso: false,
      erro: 'Dados de configuração inválidos',
      detalhes: erro.message
    });
  }
});

/**
 * GET /api/obsidian/validar-conexao
 * Valida se a conexão com Obsidian está funcionando
 */
router.get('/validar-conexao', async (req, res) => {
  if (!obsidianConfig) {
    return res.status(400).json({
      conectado: false,
      erro: 'Obsidian não configurado. Use POST /api/obsidian/configurar primeiro.'
    });
  }
  
  try {
    const https = await import('https');
    const response = await fetch(`${obsidianConfig.base_url}/vault/`, {
      headers: {
        'Authorization': `Bearer ${obsidianConfig.api_key}`
      },
      // @ts-ignore
      agent: new https.Agent({ rejectUnauthorized: false })
    });
    
    if (response.ok) {
      const arquivos = await response.json();
      
      res.json({
        conectado: true,
        vault_path: obsidianConfig.vault_path,
        total_arquivos: arquivos.files?.length || 0,
        base_url: obsidianConfig.base_url
      });
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } catch (erro: any) {
    res.status(500).json({
      conectado: false,
      erro: 'Falha na conexão com Obsidian',
      detalhes: erro.message
    });
  }
});

/**
 * POST /api/obsidian/criar-arquivo
 * Cria um arquivo no vault do Obsidian
 * Com sistema de retry automático (3 tentativas)
 */
router.post('/criar-arquivo', async (req, res) => {
  if (!obsidianConfig) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Obsidian não configurado. Use POST /api/obsidian/configurar primeiro.'
    });
  }
  
  try {
    const dados = CriarArquivoSchema.parse(req.body);
    const MAX_TENTATIVAS = 3;
    let ultimoErro: any = null;
    
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      try {
        const https = await import('https');
        const response = await fetch(`${obsidianConfig.base_url}/vault/${encodeURIComponent(dados.caminho)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${obsidianConfig.api_key}`,
            'Content-Type': 'text/markdown'
          },
          body: dados.conteudo,
          // @ts-ignore
          agent: new https.Agent({ rejectUnauthorized: false })
        });
        
        if (response.ok) {
          // Validar criação
          const validacao = await fetch(`${obsidianConfig.base_url}/vault/${encodeURIComponent(dados.caminho)}`, {
            headers: {
              'Authorization': `Bearer ${obsidianConfig.api_key}`
            },
            // @ts-ignore
            agent: new https.Agent({ rejectUnauthorized: false })
          });
          
          if (validacao.ok) {
            const db = await getDb();
            if (db) {
              await db.insert(obsidianOperations).values({
                operacao: 'criar_arquivo',
                caminhoArquivo: dados.caminho,
                status: 'sucesso',
                tentativas: tentativa
              });
            }
            
            return res.json({
              sucesso: true,
              mensagem: `Arquivo criado com sucesso: ${dados.caminho}`,
              caminho: dados.caminho,
              validado: true,
              tentativas: tentativa
            });
          }
        }
        
        ultimoErro = new Error(`Tentativa ${tentativa} falhou: ${response.status} ${response.statusText}`);
        
        // Aguardar 1 segundo antes de tentar novamente
        if (tentativa < MAX_TENTATIVAS) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (erro: any) {
        ultimoErro = erro;
        if (tentativa < MAX_TENTATIVAS) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    const db = await getDb();
    if (db) {
      await db.insert(obsidianOperations).values({
        operacao: 'criar_arquivo',
                caminhoArquivo: dados.caminho,
                status: 'falha',
        erro: ultimoErro?.message,
        tentativas: MAX_TENTATIVAS
      });
    }
    
    res.status(500).json({
      sucesso: false,
      erro: `Falha ao criar arquivo após ${MAX_TENTATIVAS} tentativas`,
      detalhes: ultimoErro?.message,
      caminho: dados.caminho
    });
  } catch (erro: any) {
    res.status(400).json({
      sucesso: false,
      erro: 'Dados inválidos',
      detalhes: erro.message
    });
  }
});

/**
 * POST /api/obsidian/criar-multiplos
 * Cria múltiplos arquivos em batch
 */
router.post('/criar-multiplos', async (req, res) => {
  if (!obsidianConfig) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Obsidian não configurado. Use POST /api/obsidian/configurar primeiro.'
    });
  }
  
  try {
    const dados = CriarMultiplosSchema.parse(req.body);
    const resultados = [];
    
    for (const arquivo of dados.arquivos) {
      try {
        const https = await import('https');
        const response = await fetch(`${obsidianConfig.base_url}/vault/${encodeURIComponent(arquivo.caminho)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${obsidianConfig.api_key}`,
            'Content-Type': 'text/markdown'
          },
          body: arquivo.conteudo,
          // @ts-ignore
          agent: new https.Agent({ rejectUnauthorized: false })
        });
        
        if (response.ok) {
          resultados.push({
            caminho: arquivo.caminho,
            sucesso: true
          });
          
          const db = await getDb();
          if (db) {
            await db.insert(obsidianOperations).values({
              operacao: 'criar_arquivo_batch',
                caminhoArquivo: arquivo.caminho,
              status: 'sucesso'
            });
          }
        } else {
          resultados.push({
            caminho: arquivo.caminho,
            sucesso: false,
            erro: `${response.status} ${response.statusText}`
          });
        }
      } catch (erro: any) {
        resultados.push({
          caminho: arquivo.caminho,
          sucesso: false,
          erro: erro.message
        });
      }
    }
    
    const sucessos = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;
    
    res.json({
      sucesso: falhas === 0,
      total: dados.arquivos.length,
      sucessos,
      falhas,
      resultados
    });
  } catch (erro: any) {
    res.status(400).json({
      sucesso: false,
      erro: 'Dados inválidos',
      detalhes: erro.message
    });
  }
});

/**
 * GET /api/obsidian/listar
 * Lista arquivos no vault
 */
router.get('/listar', async (req, res) => {
  if (!obsidianConfig) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Obsidian não configurado.'
    });
  }
  
  try {
    const { pasta } = req.query;
    const https = await import('https');
    
    let url = `${obsidianConfig.base_url}/vault/`;
    if (pasta) {
      url += `${encodeURIComponent(pasta as string)}/`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${obsidianConfig.api_key}`
      },
      // @ts-ignore
      agent: new https.Agent({ rejectUnauthorized: false })
    });
    
    if (response.ok) {
      const dados = await response.json();
      res.json({
        sucesso: true,
        arquivos: dados.files || [],
        total: dados.files?.length || 0
      });
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } catch (erro: any) {
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao listar arquivos',
      detalhes: erro.message
    });
  }
});

/**
 * DELETE /api/obsidian/deletar-arquivo
 * Deleta um arquivo do vault
 */
router.delete('/deletar-arquivo', async (req, res) => {
  if (!obsidianConfig) {
    return res.status(400).json({
      sucesso: false,
      erro: 'Obsidian não configurado.'
    });
  }
  
  try {
    const { caminho } = req.body;
    
    if (!caminho) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Caminho do arquivo é obrigatório'
      });
    }
    
    const https = await import('https');
    const response = await fetch(`${obsidianConfig.base_url}/vault/${encodeURIComponent(caminho)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${obsidianConfig.api_key}`
      },
      // @ts-ignore
      agent: new https.Agent({ rejectUnauthorized: false })
    });
    
    if (response.ok) {
      const db = await getDb();
      if (db) {
        await db.insert(obsidianOperations).values({
          operacao: 'deletar_arquivo',
                caminhoArquivo: caminho,
          status: 'sucesso'
        });
      }
      
      res.json({
        sucesso: true,
        mensagem: `Arquivo deletado: ${caminho}`
      });
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } catch (erro: any) {
    res.status(500).json({
      sucesso: false,
      erro: 'Falha ao deletar arquivo',
      detalhes: erro.message
    });
  }
});

export { router as obsidianRouter };
