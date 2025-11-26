/**
 * Módulo de Validação Segura de Scripts Python
 * 
 * OBJETIVO: Prevenir execução de código malicioso através de:
 * - Whitelist de comandos permitidos
 * - Blacklist de comandos perigosos
 * - Sanitização de inputs
 * - Timeout para scripts longos
 * - Sandbox de execução isolada
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// ========================================
// CONFIGURAÇÕES DE SEGURANÇA
// ========================================

/**
 * Comandos Python PERMITIDOS (whitelist)
 */
const COMANDOS_PERMITIDOS = [
  // Bibliotecas padrão seguras
  "import os",
  "import sys",
  "import json",
  "import requests",
  "import time",
  "import datetime",
  "import pathlib",
  "from pathlib import Path",
  
  // Bibliotecas de análise de dados
  "import pandas",
  "import numpy",
  "import PIL",
  "from PIL import Image",
  
  // Bibliotecas de automação
  "import psutil",
  "import pywin32",
  "import win32gui",
  "import win32process",
  
  // Bibliotecas de rede seguras
  "import socket",
  "import urllib",
  
  // Funções seguras
  "print(",
  "open(",
  "json.dumps(",
  "json.loads(",
  "requests.get(",
  "requests.post(",
  "os.path.exists(",
  "os.listdir(",
  "Path(",
];

/**
 * Comandos Python PROIBIDOS (blacklist)
 */
const COMANDOS_PROIBIDOS = [
  // Execução de código arbitrário
  "eval(",
  "exec(",
  "compile(",
  "__import__(",
  
  // Manipulação de sistema
  "os.system(",
  "subprocess.call(",
  "subprocess.run(",
  "subprocess.Popen(",
  "os.popen(",
  "os.spawn",
  
  // Manipulação de arquivos perigosa
  "os.remove(",
  "os.rmdir(",
  "os.unlink(",
  "shutil.rmtree(",
  "os.chmod(",
  
  // Rede não autorizada
  "socket.bind(",
  "socket.listen(",
  "socket.accept(",
  
  // Imports perigosos
  "import subprocess",
  "from subprocess",
  "import shutil",
  "import pickle",
  
  // Acesso a variáveis de ambiente sensíveis
  "os.environ['PASSWORD",
  "os.environ['SECRET",
  "os.environ['TOKEN",
  "os.environ['KEY",
];

/**
 * Padrões regex de código suspeito
 */
const PADROES_SUSPEITOS = [
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /__import__\s*\(/gi,
  /os\.system\s*\(/gi,
  /subprocess\./gi,
  /rm\s+-rf/gi,
  /del\s+\/[fs]/gi,
  /format\s+c:/gi,
];

/**
 * Timeout máximo para execução (segundos)
 */
const TIMEOUT_MAXIMO = 60;

/**
 * Tamanho máximo de script (bytes)
 */
const TAMANHO_MAXIMO = 100 * 1024; // 100KB

// ========================================
// TIPOS
// ========================================

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
  avisos: string[];
  scoreSeguranca: number; // 0-100
}

export interface ResultadoExecucao {
  sucesso: boolean;
  stdout: string;
  stderr: string;
  codigo: number | null;
  tempoExecucao: number;
  erro?: string;
}

// ========================================
// FUNÇÕES DE VALIDAÇÃO
// ========================================

/**
 * Valida script Python antes de executar
 */
export function validarScriptPython(codigo: string): ResultadoValidacao {
  const erros: string[] = [];
  const avisos: string[] = [];
  let scoreSeguranca = 100;

  // 1. Verificar tamanho
  if (codigo.length > TAMANHO_MAXIMO) {
    erros.push(`Script muito grande (${codigo.length} bytes). Máximo: ${TAMANHO_MAXIMO} bytes`);
    scoreSeguranca -= 50;
  }

  // 2. Remover comentários antes de validar
  const linhasSemComentarios = codigo
    .split("\n")
    .map(linha => {
      const indexComentario = linha.indexOf("#");
      return indexComentario >= 0 ? linha.substring(0, indexComentario) : linha;
    })
    .join("\n");

  // 3. Verificar comandos proibidos (sem comentários)
  for (const proibido of COMANDOS_PROIBIDOS) {
    if (linhasSemComentarios.includes(proibido)) {
      erros.push(`Comando proibido detectado: ${proibido}`);
      scoreSeguranca -= 20;
    }
  }

  // 4. Verificar padrões suspeitos com regex (sem comentários)
  for (const padrao of PADROES_SUSPEITOS) {
    if (padrao.test(linhasSemComentarios)) {
      erros.push(`Padrão suspeito detectado: ${padrao.source}`);
      scoreSeguranca -= 15;
    }
  }

  // 4. Verificar se usa apenas comandos permitidos (aviso, não erro)
  const linhas = codigo.split("\n");
  for (const linha of linhas) {
    const linhaTrimmed = linha.trim();
    
    // Ignorar comentários e linhas vazias
    if (linhaTrimmed.startsWith("#") || linhaTrimmed === "") {
      continue;
    }
    
    // Verificar se linha contém algum comando permitido
    const temComandoPermitido = COMANDOS_PERMITIDOS.some(cmd => 
      linhaTrimmed.startsWith(cmd) || linhaTrimmed.includes(cmd)
    );
    
    if (!temComandoPermitido && linhaTrimmed.length > 0) {
      avisos.push(`Linha não reconhecida na whitelist: ${linhaTrimmed.substring(0, 50)}...`);
      scoreSeguranca -= 2;
    }
  }

  // 5. Garantir score mínimo de 0
  scoreSeguranca = Math.max(0, scoreSeguranca);

  return {
    valido: erros.length === 0 && scoreSeguranca >= 50,
    erros,
    avisos,
    scoreSeguranca,
  };
}

/**
 * Sanitiza input do usuário antes de passar para script
 */
export function sanitizarInput(input: string): string {
  // Remove caracteres perigosos
  return input
    .replace(/[;&|`$()]/g, "") // Shell injection
    .replace(/\.\./g, "") // Path traversal
    .replace(/[<>]/g, "") // Redirecionamento
    .trim();
}

/**
 * Executa script Python em sandbox isolado com timeout
 */
export async function executarScriptPythonSeguro(
  codigo: string,
  args: string[] = [],
  timeout: number = TIMEOUT_MAXIMO
): Promise<ResultadoExecucao> {
  const inicio = Date.now();

  try {
    // 1. Validar script
    const validacao = validarScriptPython(codigo);
    if (!validacao.valido) {
      return {
        sucesso: false,
        stdout: "",
        stderr: validacao.erros.join("\n"),
        codigo: -1,
        tempoExecucao: Date.now() - inicio,
        erro: "Script rejeitado pela validação de segurança",
      };
    }

    // 2. Criar arquivo temporário com hash único
    const hash = crypto.randomBytes(16).toString("hex");
    const tempDir = "/tmp/python-sandbox";
    const tempFile = path.join(tempDir, `script_${hash}.py`);

    // Criar diretório se não existir
    await fs.mkdir(tempDir, { recursive: true });

    // Escrever script no arquivo temporário
    await fs.writeFile(tempFile, codigo, "utf8");

    // 3. Executar com spawn (mais seguro que exec)
    const resultado = await new Promise<ResultadoExecucao>((resolve) => {
      const processo = spawn("python3", [tempFile, ...args], {
        timeout: timeout * 1000,
        cwd: tempDir,
        env: {
          // Ambiente isolado sem variáveis sensíveis
          PATH: process.env.PATH,
          PYTHONPATH: "",
        },
      });

      let stdout = "";
      let stderr = "";

      processo.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      processo.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      processo.on("close", (codigo) => {
        resolve({
          sucesso: codigo === 0,
          stdout,
          stderr,
          codigo,
          tempoExecucao: Date.now() - inicio,
        });
      });

      processo.on("error", (erro) => {
        resolve({
          sucesso: false,
          stdout,
          stderr,
          codigo: -1,
          tempoExecucao: Date.now() - inicio,
          erro: erro.message,
        });
      });
    });

    // 4. Limpar arquivo temporário
    try {
      await fs.unlink(tempFile);
    } catch (e) {
      // Ignorar erro de limpeza
    }

    return resultado;
  } catch (erro) {
    return {
      sucesso: false,
      stdout: "",
      stderr: "",
      codigo: -1,
      tempoExecucao: Date.now() - inicio,
      erro: erro instanceof Error ? erro.message : String(erro),
    };
  }
}

/**
 * Valida caminho de arquivo para evitar path traversal
 */
export function validarCaminhoArquivo(caminho: string): boolean {
  const caminhoNormalizado = path.normalize(caminho);
  
  // Não permitir path traversal
  if (caminhoNormalizado.includes("..")) {
    return false;
  }
  
  // Não permitir caminhos absolutos fora de /tmp ou /home/ubuntu
  if (path.isAbsolute(caminhoNormalizado)) {
    const permitido = 
      caminhoNormalizado.startsWith("/tmp/") ||
      caminhoNormalizado.startsWith("/home/ubuntu/");
    
    return permitido;
  }
  
  return true;
}

/**
 * Gera relatório de segurança do script
 */
export function gerarRelatorioSeguranca(codigo: string): string {
  const validacao = validarScriptPython(codigo);
  
  let relatorio = "=== RELATÓRIO DE SEGURANÇA ===\n\n";
  relatorio += `Score de Segurança: ${validacao.scoreSeguranca}/100\n`;
  relatorio += `Status: ${validacao.valido ? "✅ APROVADO" : "❌ REJEITADO"}\n\n`;
  
  if (validacao.erros.length > 0) {
    relatorio += "ERROS CRÍTICOS:\n";
    validacao.erros.forEach((erro, i) => {
      relatorio += `${i + 1}. ${erro}\n`;
    });
    relatorio += "\n";
  }
  
  if (validacao.avisos.length > 0) {
    relatorio += "AVISOS:\n";
    validacao.avisos.forEach((aviso, i) => {
      relatorio += `${i + 1}. ${aviso}\n`;
    });
    relatorio += "\n";
  }
  
  relatorio += "RECOMENDAÇÕES:\n";
  if (validacao.scoreSeguranca < 50) {
    relatorio += "- Script contém código potencialmente perigoso\n";
    relatorio += "- NÃO execute este script sem revisão manual\n";
  } else if (validacao.scoreSeguranca < 80) {
    relatorio += "- Script aprovado com ressalvas\n";
    relatorio += "- Revise os avisos antes de executar\n";
  } else {
    relatorio += "- Script seguro para execução\n";
    relatorio += "- Nenhum problema crítico detectado\n";
  }
  
  return relatorio;
}
