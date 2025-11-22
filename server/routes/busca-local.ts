import express from 'express';
import { z } from 'zod';

const router = express.Router();

/**
 * Endpoint para gerar script de busca local
 * 
 * Este endpoint gera um script que o usuário pode executar no seu CPU
 * para buscar arquivos e pastas localmente, contornando limitações de acesso remoto.
 */

const buscaLocalSchema = z.object({
  query: z.string().min(1),
  tipo: z.enum(['pasta', 'arquivo', 'ambos']).default('ambos'),
  caminhoPai: z.string().optional(),
  lerConteudo: z.boolean().default(false),
});

/**
 * POST /api/busca-local/gerar-script
 * Gera script Python ou PowerShell para busca local
 */
router.post('/gerar-script', (req, res) => {
  try {
    const validacao = buscaLocalSchema.safeParse(req.body);
    
    if (!validacao.success) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados inválidos',
        detalhes: validacao.error.issues,
      });
    }
    
    const { query, tipo, caminhoPai, lerConteudo } = validacao.data;
    
    // Gerar script Python
    const scriptPython = gerarScriptPython(query, tipo, caminhoPai, lerConteudo);
    
    // Gerar script PowerShell
    const scriptPowerShell = gerarScriptPowerShell(query, tipo, caminhoPai, lerConteudo);
    
    return res.json({
      sucesso: true,
      dados: {
        query,
        tipo,
        scripts: {
          python: {
            codigo: scriptPython,
            arquivo: `busca_${query.replace(/[^a-z0-9]/gi, '_')}.py`,
            instrucoes: [
              '1. Salve o código em um arquivo .py',
              '2. Execute: python busca_XXX.py',
              '3. Copie o resultado JSON',
              '4. Cole no endpoint /api/busca-local/processar-resultado',
            ],
          },
          powershell: {
            codigo: scriptPowerShell,
            arquivo: `busca_${query.replace(/[^a-z0-9]/gi, '_')}.ps1`,
            instrucoes: [
              '1. Salve o código em um arquivo .ps1',
              '2. Execute: powershell -ExecutionPolicy Bypass -File busca_XXX.ps1',
              '3. Copie o resultado JSON',
              '4. Cole no endpoint /api/busca-local/processar-resultado',
            ],
          },
        },
      },
    });
  } catch (error: any) {
    console.error('[Busca Local] Erro ao gerar script:', error);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro ao gerar script',
      mensagem: error.message,
    });
  }
});

/**
 * POST /api/busca-local/processar-resultado
 * Processa resultado da busca local executada pelo usuário
 */
router.post('/processar-resultado', (req, res) => {
  try {
    const { resultado } = req.body;
    
    if (!resultado) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Resultado não fornecido',
      });
    }
    
    // Validar e processar resultado
    const resultadoProcessado = {
      sucesso: true,
      dados: resultado,
      timestamp: new Date().toISOString(),
    };
    
    return res.json(resultadoProcessado);
  } catch (error: any) {
    console.error('[Busca Local] Erro ao processar resultado:', error);
    return res.status(500).json({
      sucesso: false,
      erro: 'Erro ao processar resultado',
      mensagem: error.message,
    });
  }
});

function gerarScriptPython(query: string, tipo: string, caminhoPai?: string, lerConteudo?: boolean): string {
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Busca Local - Gerado automaticamente
Query: ${query}
Tipo: ${tipo}
Caminho Pai: ${caminhoPai || 'Todos os drives'}
Ler Conteúdo: ${lerConteudo ? 'Sim' : 'Não'}
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime

def buscar_arquivos(query, tipo='ambos', caminho_pai=None, ler_conteudo=False):
    """Busca arquivos e pastas no sistema"""
    resultados = []
    
    # Determinar drives para buscar
    if caminho_pai:
        caminhos_busca = [caminho_pai]
    else:
        # Windows: buscar em todos os drives
        if sys.platform == 'win32':
            import string
            caminhos_busca = [f"{d}:\\\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\\\")]
        else:
            caminhos_busca = ['/']
    
    print(f"🔍 Buscando '{query}' em {len(caminhos_busca)} locais...", file=sys.stderr)
    
    for caminho_raiz in caminhos_busca:
        try:
            for root, dirs, files in os.walk(caminho_raiz):
                # Buscar pastas
                if tipo in ['pasta', 'ambos']:
                    for dir_name in dirs:
                        if query.lower() in dir_name.lower():
                            caminho_completo = os.path.join(root, dir_name)
                            try:
                                stat_info = os.stat(caminho_completo)
                                resultados.append({
                                    'tipo': 'pasta',
                                    'nome': dir_name,
                                    'caminho': caminho_completo,
                                    'tamanho': None,
                                    'data_modificacao': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                                })
                                print(f"✅ Pasta encontrada: {caminho_completo}", file=sys.stderr)
                            except Exception as e:
                                print(f"⚠️ Erro ao acessar {caminho_completo}: {e}", file=sys.stderr)
                
                # Buscar arquivos
                if tipo in ['arquivo', 'ambos']:
                    for file_name in files:
                        if query.lower() in file_name.lower():
                            caminho_completo = os.path.join(root, file_name)
                            try:
                                stat_info = os.stat(caminho_completo)
                                resultado = {
                                    'tipo': 'arquivo',
                                    'nome': file_name,
                                    'caminho': caminho_completo,
                                    'tamanho': stat_info.st_size,
                                    'data_modificacao': datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                                }
                                
                                # Ler conteúdo se solicitado
                                if ler_conteudo and stat_info.st_size < 1024 * 1024:  # < 1MB
                                    try:
                                        with open(caminho_completo, 'r', encoding='utf-8') as f:
                                            resultado['conteudo'] = f.read()
                                    except:
                                        resultado['conteudo'] = '[Não foi possível ler o conteúdo]'
                                
                                resultados.append(resultado)
                                print(f"✅ Arquivo encontrado: {caminho_completo}", file=sys.stderr)
                            except Exception as e:
                                print(f"⚠️ Erro ao acessar {caminho_completo}: {e}", file=sys.stderr)
        except PermissionError:
            print(f"⚠️ Sem permissão para acessar: {caminho_raiz}", file=sys.stderr)
        except Exception as e:
            print(f"⚠️ Erro ao buscar em {caminho_raiz}: {e}", file=sys.stderr)
    
    return resultados

if __name__ == '__main__':
    print("=" * 60, file=sys.stderr)
    print("🔍 BUSCA LOCAL DE ARQUIVOS", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    resultados = buscar_arquivos(
        query='${query}',
        tipo='${tipo}',
        caminho_pai=${caminhoPai ? `'${caminhoPai}'` : 'None'},
        ler_conteudo=${lerConteudo ? 'True' : 'False'}
    )
    
    print(f"\\n✅ Busca concluída! {len(resultados)} resultado(s) encontrado(s)", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    
    # Imprimir resultado JSON no stdout
    print(json.dumps({
        'sucesso': True,
        'query': '${query}',
        'total': len(resultados),
        'resultados': resultados,
        'timestamp': datetime.now().isoformat()
    }, ensure_ascii=False, indent=2))
`;
}

function gerarScriptPowerShell(query: string, tipo: string, caminhoPai?: string, lerConteudo?: boolean): string {
  return `# Script de Busca Local - Gerado automaticamente
# Query: ${query}
# Tipo: ${tipo}
# Caminho Pai: ${caminhoPai || 'Todos os drives'}
# Ler Conteúdo: ${lerConteudo ? 'Sim' : 'Não'}

$ErrorActionPreference = "SilentlyContinue"

function Buscar-Arquivos {
    param(
        [string]$Query,
        [string]$Tipo = 'ambos',
        [string]$CaminhoPai = $null,
        [bool]$LerConteudo = $false
    )
    
    $resultados = @()
    
    # Determinar drives para buscar
    if ($CaminhoPai) {
        $caminhosBusca = @($CaminhoPai)
    } else {
        $caminhosBusca = Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root
    }
    
    Write-Host "🔍 Buscando '$Query' em $($caminhosBusca.Count) locais..." -ForegroundColor Cyan
    
    foreach ($caminhoRaiz in $caminhosBusca) {
        try {
            # Buscar pastas
            if ($Tipo -in @('pasta', 'ambos')) {
                Get-ChildItem -Path $caminhoRaiz -Recurse -Directory -Filter "*$Query*" | ForEach-Object {
                    $resultados += @{
                        tipo = 'pasta'
                        nome = $_.Name
                        caminho = $_.FullName
                        tamanho = $null
                        data_modificacao = $_.LastWriteTime.ToString('o')
                    }
                    Write-Host "✅ Pasta encontrada: $($_.FullName)" -ForegroundColor Green
                }
            }
            
            # Buscar arquivos
            if ($Tipo -in @('arquivo', 'ambos')) {
                Get-ChildItem -Path $caminhoRaiz -Recurse -File -Filter "*$Query*" | ForEach-Object {
                    $resultado = @{
                        tipo = 'arquivo'
                        nome = $_.Name
                        caminho = $_.FullName
                        tamanho = $_.Length
                        data_modificacao = $_.LastWriteTime.ToString('o')
                    }
                    
                    # Ler conteúdo se solicitado
                    if ($LerConteudo -and $_.Length -lt 1MB) {
                        try {
                            $resultado.conteudo = Get-Content -Path $_.FullName -Raw -Encoding UTF8
                        } catch {
                            $resultado.conteudo = '[Não foi possível ler o conteúdo]'
                        }
                    }
                    
                    $resultados += $resultado
                    Write-Host "✅ Arquivo encontrado: $($_.FullName)" -ForegroundColor Green
                }
            }
        } catch {
            Write-Host "⚠️ Erro ao buscar em $caminhoRaiz : $_" -ForegroundColor Yellow
        }
    }
    
    return $resultados
}

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🔍 BUSCA LOCAL DE ARQUIVOS" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$resultados = Buscar-Arquivos -Query '${query}' -Tipo '${tipo}' -CaminhoPai ${caminhoPai ? `'${caminhoPai}'` : '$null'} -LerConteudo $${lerConteudo ? 'true' : 'false'}

Write-Host "\\n✅ Busca concluída! $($resultados.Count) resultado(s) encontrado(s)" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan

# Converter para JSON e imprimir
$resultado = @{
    sucesso = $true
    query = '${query}'
    total = $resultados.Count
    resultados = $resultados
    timestamp = (Get-Date).ToString('o')
}

$resultado | ConvertTo-Json -Depth 10
`;
}

export default router;
