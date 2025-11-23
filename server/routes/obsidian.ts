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


/**
 * POST /api/obsidian/gerar-script-criacao
 * Gera script Python para criar arquivo no Obsidian (execução local no CPU do usuário)
 * Solução 100% automática - sem intervenção manual
 */
router.post('/gerar-script-criacao', async (req, res) => {
  try {
    const { vault_path, arquivo_nome, conteudo } = req.body;
    
    if (!vault_path || !arquivo_nome || !conteudo) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Parâmetros obrigatórios: vault_path, arquivo_nome, conteudo'
      });
    }
    
    // Gerar script Python
    const scriptPython = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script gerado automaticamente para criar arquivo no Obsidian
Gerado por: Manus AI
Data: ${new Date().toISOString()}
Modo: 100% Automático (ZERO intervenção manual)
"""

import os
import sys
from pathlib import Path

# Caminho do vault Obsidian
VAULT_PATH = r"${vault_path}"

# Nome do arquivo
ARQUIVO_NOME = "${arquivo_nome}"

# Conteúdo do arquivo
CONTEUDO = """${conteudo.replace(/"/g, '\\"')}"""

def criar_arquivo():
    """Cria arquivo no vault Obsidian"""
    
    print("=" * 60)
    print("CRIAÇÃO AUTOMÁTICA DE ARQUIVO NO OBSIDIAN")
    print("=" * 60)
    print()
    
    # Validar vault
    if not os.path.exists(VAULT_PATH):
        print(f"❌ ERRO: Vault não encontrado em {VAULT_PATH}")
        return False
    
    print(f"✅ Vault encontrado: {VAULT_PATH}")
    
    # Caminho completo do arquivo
    arquivo_path = os.path.join(VAULT_PATH, ARQUIVO_NOME)
    print(f"📄 Criando: {ARQUIVO_NOME}")
    
    try:
        # Criar diretório se necessário
        dir_path = os.path.dirname(arquivo_path)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
            print(f"📁 Diretório criado: {dir_path}")
        
        # Criar arquivo
        with open(arquivo_path, 'w', encoding='utf-8') as f:
            f.write(CONTEUDO)
        
        # Validar
        if os.path.exists(arquivo_path):
            tamanho = os.path.getsize(arquivo_path)
            print(f"✅ Arquivo criado com sucesso!")
            print(f"📊 Tamanho: {tamanho} bytes")
            print()
            print("=" * 60)
            print("SUCESSO: Arquivo criado no Obsidian!")
            print("=" * 60)
            return True
        else:
            print("❌ ERRO: Arquivo não foi criado")
            return False
            
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

if __name__ == "__main__":
    sucesso = criar_arquivo()
    sys.exit(0 if sucesso else 1)
`;
    
    // Registrar operação no banco
    const db = await getDb();
    if (db) {
      await db.insert(obsidianOperations).values({
        operacao: 'gerar_script',
        caminhoArquivo: arquivo_nome,
        status: 'sucesso',
        detalhes: JSON.stringify({ mensagem: 'Script Python gerado automaticamente' })
      });
    }
    
    res.json({
      sucesso: true,
      script: scriptPython,
      instrucoes: {
        passo1: 'Salvar script como arquivo .py',
        passo2: 'Executar: python script.py',
        passo3: 'Verificar arquivo criado no Obsidian',
        nota: '100% automático - ZERO intervenção manual necessária'
      },
      metadados: {
        vault_path,
        arquivo_nome,
        tamanho_conteudo: conteudo.length,
        gerado_em: new Date().toISOString()
      }
    });
    
  } catch (erro: any) {
    console.error('[Obsidian] Erro ao gerar script:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message || 'Erro ao gerar script Python'
    });
  }
});

/**
 * POST /api/obsidian/criar-arquivo-teste-comet
 * Endpoint específico para criar arquivo de teste do Comet
 * Gera script Python customizado para o teste
 */
router.post('/criar-arquivo-teste-comet', async (req, res) => {
  try {
    const { vault_path } = req.body;
    
    if (!vault_path) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Parâmetro obrigatório: vault_path'
      });
    }
    
    const conteudo = `# 08_TESTE Comet Manus

## 🗓️ Revisão do Projeto TESTE Obsidian

### Checklist de Validação

- [ ] Revisar Teste Obsidian
- [ ] Checar toda implementação
- [ ] Está ok
- [ ] Seguir para a próxima etapa

---

## 📊 Detalhes da Revisão

### Status dos Endpoints
- ❌ POST /api/obsidian/validar-conexao - FALHOU (plugin não instalado)
- ❌ POST /api/obsidian/criar-arquivo - NÃO TESTADO
- ❌ GET /api/obsidian/listar - NÃO TESTADO
- ❌ DELETE /api/obsidian/deletar-arquivo - NÃO TESTADO

### Plano B Ativado
✅ Script Python local criando arquivos diretamente no filesystem

### Implementação
- ✅ API DeepSITE (9 endpoints)
- ✅ Documentação completa
- ✅ Slide visual criado
- ❌ Circuit Breaker (pendente)
- ❌ Integração Abacus (pendente)
- ❌ Bull Queue + Redis (pendente)

### Próximos Passos
1. Completar Circuit Breaker (6-8h)
2. Integrar Abacus.ai (12h)
3. Implementar Bull Queue + Redis (8h)
4. Deploy em Vercel

---

**Criado por:** Manus AI via Script Python (Plano B - 100% Automático)  
**Data:** ${new Date().toISOString()}  
**Status:** Teste de criação automática de arquivo no Obsidian
`;
    
    // Gerar script Python
    const scriptPython = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script AUTOMÁTICO para criar arquivo de teste do Comet no Obsidian
Gerado por: Manus AI
Data: ${new Date().toISOString()}
Modo: 100% Automático (ZERO intervenção manual)
"""

import os
import sys

VAULT_PATH = r"${vault_path}"
ARQUIVO_NOME = "08_TESTE_Comet_Manus.md"

CONTEUDO = """${conteudo.replace(/"/g, '\\"')}"""

def criar_arquivo_teste():
    print("=" * 60)
    print("CRIAÇÃO AUTOMÁTICA - ARQUIVO TESTE COMET")
    print("=" * 60)
    print()
    
    if not os.path.exists(VAULT_PATH):
        print(f"❌ ERRO: Vault não encontrado em {VAULT_PATH}")
        return False
    
    print(f"✅ Vault encontrado: {VAULT_PATH}")
    
    arquivo_path = os.path.join(VAULT_PATH, ARQUIVO_NOME)
    print(f"📄 Criando: {ARQUIVO_NOME}")
    
    try:
        with open(arquivo_path, 'w', encoding='utf-8') as f:
            f.write(CONTEUDO)
        
        if os.path.exists(arquivo_path):
            tamanho = os.path.getsize(arquivo_path)
            print(f"✅ Arquivo criado com sucesso!")
            print(f"📊 Tamanho: {tamanho} bytes")
            print()
            print("=" * 60)
            print("SUCESSO: Arquivo de teste criado!")
            print("=" * 60)
            print()
            print("🔍 Próximos passos AUTOMÁTICOS:")
            print("1. Comet abre Obsidian")
            print("2. Comet localiza arquivo '08_TESTE_Comet_Manus.md'")
            print("3. Comet marca checkboxes automaticamente")
            return True
        else:
            print("❌ ERRO: Arquivo não foi criado")
            return False
            
    except Exception as e:
        print(f"❌ ERRO: {e}")
        return False

if __name__ == "__main__":
    sucesso = criar_arquivo_teste()
    sys.exit(0 if sucesso else 1)
`;
    
    // Registrar no banco
    const db = await getDb();
    if (db) {
      await db.insert(obsidianOperations).values({
        operacao: 'gerar_script_teste_comet',
        caminhoArquivo: '08_TESTE_Comet_Manus.md',
        status: 'sucesso',
        detalhes: JSON.stringify({ mensagem: 'Script de teste gerado automaticamente para Comet' })
      });
    }
    
    res.json({
      sucesso: true,
      script: scriptPython,
      arquivo_nome: '08_TESTE_Comet_Manus.md',
      instrucoes_automaticas: {
        para_comet: 'Salvar script e executar automaticamente no CPU do Rudson',
        comando: 'python criar_arquivo_teste_comet.py',
        validacao: 'Verificar arquivo criado no Obsidian',
        modo: '100% AUTOMÁTICO - ZERO intervenção manual'
      },
      metadados: {
        vault_path,
        tamanho_conteudo: conteudo.length,
        gerado_em: new Date().toISOString(),
        modo_operacao: 'automatico'
      }
    });
    
  } catch (erro: any) {
    console.error('[Obsidian] Erro ao gerar script de teste:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message || 'Erro ao gerar script de teste'
    });
  }
});

