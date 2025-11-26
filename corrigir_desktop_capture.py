#!/usr/bin/env python3
"""
Corretor Automático - desktop_capture.py
Corrige o formato da API para tRPC
"""

import os
import shutil
from pathlib import Path

print("=" * 70)
print("🔧 CORRETOR AUTOMÁTICO - desktop_capture.py")
print("=" * 70)
print()

# Caminho do arquivo
arquivo = Path("C:/Comet/desktop_capture.py")

if not arquivo.exists():
    print(f"❌ Arquivo não encontrado: {arquivo}")
    print()
    input("Pressione ENTER para sair...")
    exit(1)

print(f"📂 Arquivo encontrado: {arquivo}")
print()

# Fazer backup
backup = Path("C:/Comet/desktop_capture.py.backup")
print("💾 Criando backup...", end=" ")
shutil.copy2(arquivo, backup)
print(f"✅")
print(f"   Backup salvo em: {backup}")
print()

# Ler arquivo
print("📖 Lendo arquivo...", end=" ")
with open(arquivo, "r", encoding="utf-8") as f:
    conteudo = f.read()
print("✅")
print()

# Aplicar correções
print("🔧 Aplicando correções...")
print()

alteracoes = 0

# Correção 1: Endpoint
if "/api/desktop/capturar" in conteudo:
    print("   1. Corrigindo endpoint...", end=" ")
    conteudo = conteudo.replace(
        'f"{API_URL}/api/desktop/capturar"',
        'f"{API_URL}/api/trpc/desktop.capturar"'
    )
    print("✅")
    alteracoes += 1
else:
    print("   1. Endpoint já está correto ✓")

# Correção 2: Formato JSON
if "json=payload," in conteudo:
    print("   2. Corrigindo formato JSON...", end=" ")
    conteudo = conteudo.replace(
        "json=payload,",
        'json={"json": payload},'
    )
    print("✅")
    alteracoes += 1
else:
    print("   2. Formato JSON já está correto ✓")

# Correção 3: URL da API
if 'API_URL = "http://localhost:3000"' in conteudo:
    print("   3. Configurando URL da API...", end=" ")
    conteudo = conteudo.replace(
        'API_URL = "http://localhost:3000"',
        'API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"'
    )
    print("✅")
    alteracoes += 1
else:
    print("   3. URL da API já está configurada ✓")

print()

# Salvar arquivo corrigido
if alteracoes > 0:
    print(f"💾 Salvando arquivo com {alteracoes} correções...", end=" ")
    with open(arquivo, "w", encoding="utf-8") as f:
        f.write(conteudo)
    print("✅")
else:
    print("ℹ️  Nenhuma correção necessária - arquivo já está atualizado!")

print()
print("=" * 70)
print("✅ CORREÇÃO CONCLUÍDA!")
print("=" * 70)
print()
print(f"📂 Arquivo corrigido: {arquivo}")
print(f"💾 Backup disponível: {backup}")
print()
print("🚀 PRÓXIMO PASSO:")
print("   cd C:\\Comet")
print("   python desktop_capture.py")
print()
print("=" * 70)
print()
input("Pressione ENTER para fechar...")
