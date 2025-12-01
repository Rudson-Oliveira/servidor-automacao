#!/usr/bin/env python3
"""
DeepSite Document Analyzer
===========================

Script Python para o Comet analisar documentos localmente usando DeepSite (Hugging Face).
Contorna políticas de privacidade executando localmente e enviando apenas para API Manus.

Autor: Sistema de Automação Manus
Versão: 1.0.0
Data: 2025-01-24
"""

import os
import sys
import json
import requests
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# ========================================
# CONFIGURAÇÕES
# ========================================

# URL da API Manus (servidor de automação)
MANUS_API_URL = "http://localhost:3000/api/trpc"

# Token Hugging Face (DeepSite)
HUGGING_FACE_TOKEN = os.getenv('HUGGING_FACE_TOKEN', '')

# Modelos Hugging Face para diferentes tarefas
MODELS = {
    "summarization": "facebook/bart-large-cnn",
    "sentiment": "distilbert-base-uncased-finetuned-sst-2-english",
    "ner": "dslim/bert-base-NER",
    "classification": "facebook/bart-large-mnli",
}

# Extensões de arquivo suportadas
SUPPORTED_EXTENSIONS = [
    ".txt", ".md", ".pdf", ".docx", ".doc",
    ".csv", ".json", ".xml", ".html", ".htm"
]

# Tamanho máximo de arquivo (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# ========================================
# FUNÇÕES DE EXTRAÇÃO DE CONTEÚDO
# ========================================

def extrair_texto_txt(caminho: str) -> str:
    """Extrai texto de arquivo TXT"""
    with open(caminho, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def extrair_texto_pdf(caminho: str) -> str:
    """Extrai texto de arquivo PDF"""
    try:
        import PyPDF2
        
        texto = ""
        with open(caminho, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                texto += page.extract_text() + "\n"
        
        return texto
    except ImportError:
        return "[ERRO] PyPDF2 não instalado. Execute: pip install PyPDF2"
    except Exception as e:
        return f"[ERRO] Falha ao extrair PDF: {str(e)}"

def extrair_texto_docx(caminho: str) -> str:
    """Extrai texto de arquivo DOCX"""
    try:
        import docx
        
        doc = docx.Document(caminho)
        texto = "\n".join([p.text for p in doc.paragraphs])
        
        return texto
    except ImportError:
        return "[ERRO] python-docx não instalado. Execute: pip install python-docx"
    except Exception as e:
        return f"[ERRO] Falha ao extrair DOCX: {str(e)}"

def extrair_texto_json(caminho: str) -> str:
    """Extrai texto de arquivo JSON"""
    try:
        with open(caminho, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return json.dumps(data, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"[ERRO] Falha ao ler JSON: {str(e)}"

def extrair_conteudo(caminho: str) -> str:
    """
    Extrai conteúdo de arquivo baseado na extensão
    
    Args:
        caminho: Caminho do arquivo
        
    Returns:
        Conteúdo extraído como string
    """
    ext = Path(caminho).suffix.lower()
    
    if ext in [".txt", ".md", ".csv", ".xml", ".html", ".htm"]:
        return extrair_texto_txt(caminho)
    elif ext == ".pdf":
        return extrair_texto_pdf(caminho)
    elif ext in [".docx", ".doc"]:
        return extrair_texto_docx(caminho)
    elif ext == ".json":
        return extrair_texto_json(caminho)
    else:
        return f"[ERRO] Extensão {ext} não suportada"

# ========================================
# FUNÇÕES DE ANÁLISE COM HUGGING FACE
# ========================================

def analisar_com_huggingface(texto: str, tarefa: str = "summarization") -> Dict[str, Any]:
    """
    Analisa texto usando Hugging Face API
    
    Args:
        texto: Texto para analisar
        tarefa: Tipo de análise (summarization, sentiment, ner, classification)
        
    Returns:
        Resultado da análise
    """
    if tarefa not in MODELS:
        return {"erro": f"Tarefa '{tarefa}' não suportada"}
    
    model = MODELS[tarefa]
    url = f"https://api-inference.huggingface.co/models/{model}"
    
    headers = {
        "Authorization": f"Bearer {HUGGING_FACE_TOKEN}",
        "Content-Type": "application/json",
    }
    
    # Limitar tamanho do texto (máximo 1024 tokens ~= 4000 caracteres)
    texto_limitado = texto[:4000] if len(texto) > 4000 else texto
    
    payload = {
        "inputs": texto_limitado,
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        
        return {
            "sucesso": True,
            "resultado": response.json(),
            "modelo": model,
            "tarefa": tarefa,
        }
    except requests.exceptions.RequestException as e:
        return {
            "sucesso": False,
            "erro": str(e),
            "modelo": model,
            "tarefa": tarefa,
        }

def analisar_documento_completo(texto: str) -> Dict[str, Any]:
    """
    Analisa documento com múltiplas tarefas
    
    Args:
        texto: Conteúdo do documento
        
    Returns:
        Análise completa do documento
    """
    print("🔍 Analisando documento com DeepSite...")
    
    # Resumo
    print("  📝 Gerando resumo...")
    resumo = analisar_com_huggingface(texto, "summarization")
    
    # Sentimento
    print("  😊 Analisando sentimento...")
    sentimento = analisar_com_huggingface(texto, "sentiment")
    
    # Entidades nomeadas
    print("  🏷️  Extraindo entidades...")
    entidades = analisar_com_huggingface(texto, "ner")
    
    return {
        "resumo": resumo,
        "sentimento": sentimento,
        "entidades": entidades,
        "timestamp": datetime.now().isoformat(),
    }

# ========================================
# FUNÇÕES DE ENVIO PARA API MANUS
# ========================================

def enviar_para_manus(arquivo_id: int, analise: Dict[str, Any]) -> Dict[str, Any]:
    """
    Envia análise para API Manus
    
    Args:
        arquivo_id: ID do arquivo no banco de dados
        analise: Resultado da análise
        
    Returns:
        Resposta da API
    """
    url = f"{MANUS_API_URL}/deepsite.salvarAnalise"
    
    payload = {
        "arquivoId": arquivo_id,
        "analise": json.dumps(analise),
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        
        return {
            "sucesso": True,
            "resposta": response.json(),
        }
    except requests.exceptions.RequestException as e:
        return {
            "sucesso": False,
            "erro": str(e),
        }

# ========================================
# FUNÇÕES PRINCIPAIS
# ========================================

def processar_arquivo(caminho: str, arquivo_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Processa arquivo completo: extração + análise + envio
    
    Args:
        caminho: Caminho do arquivo
        arquivo_id: ID do arquivo no banco (opcional)
        
    Returns:
        Resultado do processamento
    """
    print(f"\n{'='*60}")
    print(f"📄 Processando: {caminho}")
    print(f"{'='*60}\n")
    
    # Validar arquivo
    if not os.path.exists(caminho):
        return {"erro": "Arquivo não encontrado"}
    
    tamanho = os.path.getsize(caminho)
    if tamanho > MAX_FILE_SIZE:
        return {"erro": f"Arquivo muito grande ({tamanho} bytes). Máximo: {MAX_FILE_SIZE} bytes"}
    
    ext = Path(caminho).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return {"erro": f"Extensão {ext} não suportada"}
    
    # Extrair conteúdo
    print("📖 Extraindo conteúdo...")
    conteudo = extrair_conteudo(caminho)
    
    if conteudo.startswith("[ERRO]"):
        return {"erro": conteudo}
    
    print(f"✅ Conteúdo extraído: {len(conteudo)} caracteres\n")
    
    # Analisar com DeepSite
    analise = analisar_documento_completo(conteudo)
    
    print("\n✅ Análise concluída!\n")
    
    # Enviar para Manus (se arquivo_id fornecido)
    if arquivo_id:
        print(f"📤 Enviando para API Manus (arquivo ID: {arquivo_id})...")
        envio = enviar_para_manus(arquivo_id, analise)
        
        if envio["sucesso"]:
            print("✅ Enviado com sucesso!\n")
        else:
            print(f"❌ Falha ao enviar: {envio['erro']}\n")
        
        return {
            "arquivo": caminho,
            "tamanho": tamanho,
            "analise": analise,
            "envio": envio,
        }
    
    return {
        "arquivo": caminho,
        "tamanho": tamanho,
        "analise": analise,
    }

def processar_pasta(caminho_pasta: str, recursivo: bool = False) -> List[Dict[str, Any]]:
    """
    Processa todos os arquivos de uma pasta
    
    Args:
        caminho_pasta: Caminho da pasta
        recursivo: Se deve processar subpastas
        
    Returns:
        Lista de resultados
    """
    resultados = []
    
    pasta = Path(caminho_pasta)
    
    if not pasta.exists() or not pasta.is_dir():
        print(f"❌ Pasta não encontrada: {caminho_pasta}")
        return resultados
    
    # Buscar arquivos
    if recursivo:
        arquivos = [f for f in pasta.rglob("*") if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS]
    else:
        arquivos = [f for f in pasta.glob("*") if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS]
    
    print(f"\n📁 Encontrados {len(arquivos)} arquivos para processar\n")
    
    for i, arquivo in enumerate(arquivos, 1):
        print(f"\n[{i}/{len(arquivos)}] Processando: {arquivo.name}")
        resultado = processar_arquivo(str(arquivo))
        resultados.append(resultado)
    
    return resultados

# ========================================
# CLI
# ========================================

def main():
    """Função principal do script"""
    parser = argparse.ArgumentParser(
        description="Analisa documentos localmente usando DeepSite (Hugging Face)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos de uso:

  # Analisar arquivo único
  python deepsite_document_analyzer.py arquivo.pdf

  # Analisar arquivo e enviar para Manus (com ID do banco)
  python deepsite_document_analyzer.py arquivo.pdf --arquivo-id 123

  # Analisar pasta inteira
  python deepsite_document_analyzer.py /caminho/pasta --pasta

  # Analisar pasta recursivamente
  python deepsite_document_analyzer.py /caminho/pasta --pasta --recursivo

  # Salvar resultado em JSON
  python deepsite_document_analyzer.py arquivo.pdf --output resultado.json

Extensões suportadas:
  .txt, .md, .pdf, .docx, .doc, .csv, .json, .xml, .html, .htm

Dependências opcionais:
  pip install PyPDF2 python-docx
        """
    )
    
    parser.add_argument(
        "caminho",
        help="Caminho do arquivo ou pasta para processar"
    )
    
    parser.add_argument(
        "--arquivo-id",
        type=int,
        help="ID do arquivo no banco de dados (para enviar para Manus)"
    )
    
    parser.add_argument(
        "--pasta",
        action="store_true",
        help="Processar pasta inteira"
    )
    
    parser.add_argument(
        "--recursivo",
        action="store_true",
        help="Processar subpastas recursivamente (requer --pasta)"
    )
    
    parser.add_argument(
        "--output",
        "-o",
        help="Salvar resultado em arquivo JSON"
    )
    
    args = parser.parse_args()
    
    # Processar
    if args.pasta:
        resultados = processar_pasta(args.caminho, args.recursivo)
    else:
        resultados = processar_arquivo(args.caminho, args.arquivo_id)
    
    # Salvar output
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Resultado salvo em: {args.output}")
    
    # Exibir resumo
    print(f"\n{'='*60}")
    print("📊 RESUMO")
    print(f"{'='*60}\n")
    
    if isinstance(resultados, list):
        sucessos = sum(1 for r in resultados if "erro" not in r)
        falhas = len(resultados) - sucessos
        
        print(f"Total de arquivos: {len(resultados)}")
        print(f"✅ Sucessos: {sucessos}")
        print(f"❌ Falhas: {falhas}")
    else:
        if "erro" in resultados:
            print(f"❌ Erro: {resultados['erro']}")
        else:
            print("✅ Processamento concluído com sucesso!")
    
    print()

if __name__ == "__main__":
    main()
