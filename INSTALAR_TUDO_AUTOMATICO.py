#!/usr/bin/env python3
"""
INSTALADOR AUTOMÁTICO - DESKTOP CAPTURE
Executa TUDO automaticamente!
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

print("=" * 70)
print("🤖 INSTALADOR AUTOMÁTICO - DESKTOP CAPTURE")
print("   Comet Vision - Manus")
print("=" * 70)
print()

# ========================================
# PASSO 1: Verificar Python
# ========================================
print("📋 PASSO 1: Verificando Python...")
try:
    python_version = sys.version.split()[0]
    print(f"✅ Python {python_version} encontrado!")
except Exception as e:
    print(f"❌ Erro ao verificar Python: {e}")
    input("Pressione Enter para sair...")
    sys.exit(1)

print()

# ========================================
# PASSO 2: Criar pasta C:\Comet
# ========================================
print("📁 PASSO 2: Criando pasta C:\\Comet...")
comet_dir = Path("C:/Comet")

try:
    comet_dir.mkdir(parents=True, exist_ok=True)
    print(f"✅ Pasta criada: {comet_dir}")
except Exception as e:
    print(f"❌ Erro ao criar pasta: {e}")
    input("Pressione Enter para sair...")
    sys.exit(1)

print()

# ========================================
# PASSO 3: Copiar arquivos
# ========================================
print("📦 PASSO 3: Copiando arquivos para C:\\Comet...")

# Diretório atual (Downloads)
current_dir = Path(__file__).parent

# Arquivos necessários
arquivos = [
    "desktop_capture.py",
    "desktop_scheduler.py",
    "requirements_desktop_capture.txt",
    "instalar_desktop_capture.bat",
    "setup_scheduler.bat",
    "LEIA-ME.txt",
]

arquivos_copiados = 0
for arquivo in arquivos:
    origem = current_dir / arquivo
    destino = comet_dir / arquivo
    
    if origem.exists():
        try:
            shutil.copy2(origem, destino)
            print(f"   ✅ {arquivo}")
            arquivos_copiados += 1
        except Exception as e:
            print(f"   ⚠️ {arquivo} - Erro: {e}")
    else:
        print(f"   ⚠️ {arquivo} - Não encontrado")

print(f"\n✅ {arquivos_copiados}/{len(arquivos)} arquivos copiados!")
print()

# ========================================
# PASSO 4: Instalar dependências
# ========================================
print("📥 PASSO 4: Instalando dependências Python...")
print("   (Isso pode levar 1-2 minutos)")
print()

requirements_file = comet_dir / "requirements_desktop_capture.txt"

if requirements_file.exists():
    try:
        # Executar pip install
        resultado = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
            capture_output=True,
            text=True,
            check=True
        )
        
        print("✅ Dependências instaladas com sucesso!")
        print()
        print("   Pacotes instalados:")
        print("   - Pillow (screenshots)")
        print("   - psutil (processos)")
        print("   - requests (HTTP)")
        print("   - schedule (agendamento)")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências:")
        print(e.stderr)
        input("\nPressione Enter para continuar mesmo assim...")
else:
    print("⚠️ Arquivo requirements_desktop_capture.txt não encontrado")
    print("   Você precisará instalar manualmente:")
    print("   pip install Pillow psutil requests schedule")

print()

# ========================================
# PASSO 5: Configurar URL da API
# ========================================
print("🔧 PASSO 5: Configurando URL da API...")

desktop_capture_file = comet_dir / "desktop_capture.py"

if desktop_capture_file.exists():
    try:
        # Ler arquivo
        with open(desktop_capture_file, "r", encoding="utf-8") as f:
            conteudo = f.read()
        
        # Substituir URL
        url_antiga = 'API_URL = "http://localhost:3000"'
        url_nova = 'API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"'
        
        if url_antiga in conteudo:
            conteudo = conteudo.replace(url_antiga, url_nova)
            
            # Salvar arquivo
            with open(desktop_capture_file, "w", encoding="utf-8") as f:
                f.write(conteudo)
            
            print("✅ URL da API configurada automaticamente!")
            print(f"   URL: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer")
        else:
            print("⚠️ URL já estava configurada ou formato diferente")
    
    except Exception as e:
        print(f"⚠️ Erro ao configurar URL: {e}")
        print("   Você precisará editar manualmente desktop_capture.py")
else:
    print("⚠️ Arquivo desktop_capture.py não encontrado")

print()

# ========================================
# PASSO 6: Teste rápido
# ========================================
print("🧪 PASSO 6: Testando importações...")

try:
    import PIL
    print("   ✅ Pillow (screenshots)")
except ImportError:
    print("   ❌ Pillow não instalado")

try:
    import psutil
    print("   ✅ psutil (processos)")
except ImportError:
    print("   ❌ psutil não instalado")

try:
    import requests
    print("   ✅ requests (HTTP)")
except ImportError:
    print("   ❌ requests não instalado")

try:
    import schedule
    print("   ✅ schedule (agendamento)")
except ImportError:
    print("   ❌ schedule não instalado")

print()

# ========================================
# CONCLUSÃO
# ========================================
print("=" * 70)
print("✅ INSTALAÇÃO CONCLUÍDA!")
print("=" * 70)
print()
print("📂 Arquivos instalados em: C:\\Comet\\")
print()
print("🚀 PRÓXIMOS PASSOS:")
print()
print("1. TESTAR CAPTURA MANUAL:")
print("   - Abra o Prompt de Comando (cmd)")
print("   - Digite: cd C:\\Comet")
print("   - Digite: python desktop_capture.py")
print("   - Deve aparecer: 'Dados enviados com sucesso!'")
print()
print("2. CONFIGURAR AGENDAMENTO AUTOMÁTICO (OPCIONAL):")
print("   - Vá para C:\\Comet\\")
print("   - Clique com botão direito em: setup_scheduler.bat")
print("   - Selecione: 'Executar como administrador'")
print()
print("3. VISUALIZAR CAPTURAS:")
print("   - Acesse: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/desktop-captures")
print()
print("=" * 70)
print()

# Perguntar se quer testar agora
resposta = input("Deseja executar o teste de captura AGORA? (S/N): ").strip().upper()

if resposta == "S":
    print()
    print("🚀 Executando teste de captura...")
    print()
    
    try:
        # Mudar para diretório C:\Comet
        os.chdir(comet_dir)
        
        # Executar desktop_capture.py
        resultado = subprocess.run(
            [sys.executable, "desktop_capture.py"],
            capture_output=False,
            text=True
        )
        
        print()
        if resultado.returncode == 0:
            print("✅ Teste concluído! Verifique a saída acima.")
        else:
            print("⚠️ Teste finalizado com avisos. Verifique a saída acima.")
    
    except Exception as e:
        print(f"❌ Erro ao executar teste: {e}")

print()
print("Pressione Enter para finalizar...")
input()
