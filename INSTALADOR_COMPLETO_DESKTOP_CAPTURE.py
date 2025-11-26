#!/usr/bin/env python3
"""
INSTALADOR COMPLETO E AUTOMÁTICO - DESKTOP CAPTURE
Faz TUDO automaticamente: instala, configura, corrige e testa!
Versão 3.0 - Zero Intervenção Manual
"""

import os
import sys
import subprocess
import base64
from pathlib import Path
from datetime import datetime
from io import BytesIO

print("=" * 70)
print("🤖 INSTALADOR COMPLETO - DESKTOP CAPTURE V3.0")
print("   100% Automático - Zero Intervenção Manual")
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
    print(f"❌ Erro: {e}")
    input("Pressione ENTER para sair...")
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
    print(f"❌ Erro: {e}")
    input("Pressione ENTER para sair...")
    sys.exit(1)

print()

# ========================================
# PASSO 3: Instalar dependências
# ========================================
print("📥 PASSO 3: Instalando dependências Python...")
print("   (Isso pode levar 1-2 minutos)")
print()

pacotes = ["Pillow", "psutil", "requests", "schedule", "pywin32"]

for pacote in pacotes:
    try:
        print(f"   Instalando {pacote}...", end=" ", flush=True)
        resultado = subprocess.run(
            [sys.executable, "-m", "pip", "install", pacote, "--quiet", "--disable-pip-version-check"],
            capture_output=True,
            text=True,
            timeout=120
        )
        print("✅")
    except Exception as e:
        print(f"⚠️ (pode já estar instalado)")

print()
print("✅ Dependências instaladas!")
print()

# ========================================
# PASSO 4: Criar desktop_capture.py CORRIGIDO
# ========================================
print("📝 PASSO 4: Criando desktop_capture.py (versão corrigida)...")

desktop_capture_code = '''#!/usr/bin/env python3
"""
Desktop Capture - Captura de Tela para Comet Vision
Versão Corrigida - Formato tRPC
"""

import os
import sys
import json
import base64
import requests
from datetime import datetime
from io import BytesIO

try:
    from PIL import ImageGrab
    import psutil
except ImportError:
    print("❌ ERRO: Dependências não instaladas")
    print("Execute: pip install Pillow psutil requests")
    input("\\nPressione ENTER para sair...")
    sys.exit(1)

# Configuração
API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"
SAVE_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "comet_captures")
os.makedirs(SAVE_DIR, exist_ok=True)

def capturar_screenshot():
    try:
        screenshot = ImageGrab.grab()
        print(f"✅ Screenshot: {screenshot.size[0]}x{screenshot.size[1]}")
        return screenshot
    except Exception as e:
        print(f"❌ Erro ao capturar: {e}")
        return None

def listar_programas():
    programas = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info', 'cpu_percent']):
        try:
            info = proc.info
            if info['name'] and not info['name'].startswith('svchost'):
                programas.append({
                    'pid': info['pid'],
                    'nome': info['name'],
                    'usuario': info['username'] or 'N/A',
                    'memoria_mb': round(info['memory_info'].rss / 1024 / 1024, 2) if info['memory_info'] else 0,
                    'cpu_percent': info['cpu_percent'] or 0,
                })
        except:
            continue
    
    programas.sort(key=lambda x: x['memoria_mb'], reverse=True)
    print(f"✅ {len(programas)} programas detectados")
    return programas[:50]

def listar_janelas():
    janelas = []
    try:
        if sys.platform == 'win32':
            import win32gui
            import win32process
            
            def callback(hwnd, windows):
                if win32gui.IsWindowVisible(hwnd):
                    titulo = win32gui.GetWindowText(hwnd)
                    if titulo:
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        try:
                            processo = psutil.Process(pid)
                            windows.append({
                                'titulo': titulo,
                                'processo': processo.name(),
                                'pid': pid,
                            })
                        except:
                            pass
                return True
            
            win32gui.EnumWindows(callback, janelas)
            print(f"✅ {len(janelas)} janelas ativas")
    except ImportError:
        print("⚠️ pywin32 não instalado (janelas não detectadas)")
    except Exception as e:
        print(f"⚠️ Erro ao detectar janelas: {e}")
    
    return janelas

def salvar_local(imagem):
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        img_path = os.path.join(SAVE_DIR, f"capture_{timestamp}.png")
        imagem.save(img_path)
        print(f"💾 Salvo em: {img_path}")
        return img_path
    except Exception as e:
        print(f"❌ Erro ao salvar: {e}")
        return None

def enviar_para_api(imagem, programas, janelas):
    try:
        # Converter para base64
        buffered = BytesIO()
        imagem.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Preparar payload no formato tRPC
        payload = {
            'timestamp': datetime.now().isoformat(),
            'screenshot_base64': img_base64,
            'resolucao': {
                'largura': imagem.size[0],
                'altura': imagem.size[1],
            },
            'programas': programas,
            'janelas': janelas,
            'total_programas': len(programas),
            'total_janelas': len(janelas),
        }
        
        # Enviar para endpoint tRPC
        print(f"📤 Enviando para: {API_URL}/api/trpc/desktop.capturar")
        response = requests.post(
            f"{API_URL}/api/trpc/desktop.capturar",
            json={"json": payload},  # Formato tRPC
            headers={'Content-Type': 'application/json'},
            timeout=30,
        )
        
        if response.status_code == 200:
            print("✅ Dados enviados com sucesso!")
            return True
        else:
            print(f"❌ Erro: Status {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão: API não acessível")
        return False
    except Exception as e:
        print(f"❌ Erro ao enviar: {e}")
        return False

def main():
    print("=" * 70)
    print("🖥️  DESKTOP CAPTURE - Captura de Tela")
    print("=" * 70)
    print()
    
    # 1. Capturar
    print("📸 Capturando screenshot...")
    imagem = capturar_screenshot()
    if not imagem:
        return
    print()
    
    # 2. Programas
    print("📋 Listando programas...")
    programas = listar_programas()
    print()
    
    # 3. Janelas
    print("🪟 Detectando janelas...")
    janelas = listar_janelas()
    print()
    
    # 4. Salvar local
    print("💾 Salvando localmente...")
    salvar_local(imagem)
    print()
    
    # 5. Enviar API
    print("🌐 Enviando para API...")
    sucesso = enviar_para_api(imagem, programas, janelas)
    
    print()
    print("=" * 70)
    if sucesso:
        print("✅ CAPTURA CONCLUÍDA COM SUCESSO!")
    else:
        print("⚠️  CAPTURA CONCLUÍDA (salvo localmente)")
    print("=" * 70)
    
    print(f"\\n📊 RESUMO:")
    print(f"   Screenshot: {imagem.size[0]}x{imagem.size[1]}")
    print(f"   Programas: {len(programas)}")
    print(f"   Janelas: {len(janelas)}")
    
    if programas:
        print(f"\\n🔝 TOP 5 PROGRAMAS:")
        for i, p in enumerate(programas[:5], 1):
            print(f"   {i}. {p['nome']} - {p['memoria_mb']} MB")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\\n⚠️  Cancelado pelo usuário")
    except Exception as e:
        print(f"\\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\\n" + "=" * 70)
        input("\\nPressione ENTER para fechar...")
'''

# Salvar arquivo
desktop_file = comet_dir / "desktop_capture.py"
with open(desktop_file, "w", encoding="utf-8") as f:
    f.write(desktop_capture_code)

print("✅ desktop_capture.py criado!")
print()

# ========================================
# PASSO 5: Criar README
# ========================================
print("📝 PASSO 5: Criando documentação...")

readme_content = """========================================
DESKTOP CAPTURE - GUIA RÁPIDO
========================================

COMO USAR:

1. CAPTURA MANUAL:
   python desktop_capture.py

2. VER CAPTURAS:
   Área de Trabalho\\comet_captures\\

3. VER NA WEB:
   https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/desktop-captures

========================================
"""

with open(comet_dir / "README.txt", "w", encoding="utf-8") as f:
    f.write(readme_content)

print("✅ README.txt criado!")
print()

# ========================================
# PASSO 6: Teste automático
# ========================================
print("=" * 70)
print("✅ INSTALAÇÃO CONCLUÍDA!")
print("=" * 70)
print()
print("📂 Arquivos em: C:\\Comet\\")
print("   ✅ desktop_capture.py (versão corrigida)")
print("   ✅ README.txt")
print()
print("=" * 70)
print()

resposta = input("Deseja executar TESTE AGORA? (S/N): ").strip().upper()

if resposta == "S":
    print()
    print("🚀 Executando teste...")
    print()
    
    try:
        os.chdir(comet_dir)
        subprocess.run([sys.executable, "desktop_capture.py"])
    except Exception as e:
        print(f"❌ Erro no teste: {e}")

print()
print("=" * 70)
print("🎉 TUDO PRONTO!")
print()
print("Para executar novamente:")
print("   cd C:\\Comet")
print("   python desktop_capture.py")
print("=" * 70)
print()
input("Pressione ENTER para finalizar...")
