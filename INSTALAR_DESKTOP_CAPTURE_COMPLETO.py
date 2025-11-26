#!/usr/bin/env python3
"""
INSTALADOR COMPLETO - DESKTOP CAPTURE
Cria TODOS os arquivos automaticamente!
Não precisa baixar nada antes!
"""

import os
import sys
import subprocess
from pathlib import Path

print("=" * 70)
print("🤖 INSTALADOR COMPLETO - DESKTOP CAPTURE")
print("   Comet Vision - Manus")
print("   Versão 2.0 - Instalação Automática Total")
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
# PASSO 3: Instalar dependências
# ========================================
print("📥 PASSO 3: Instalando dependências Python...")
print("   (Isso pode levar 1-2 minutos)")
print()

pacotes = ["Pillow", "psutil", "requests", "schedule"]

for pacote in pacotes:
    try:
        print(f"   Instalando {pacote}...", end=" ")
        resultado = subprocess.run(
            [sys.executable, "-m", "pip", "install", pacote, "--quiet"],
            capture_output=True,
            text=True,
            check=True
        )
        print("✅")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro: {e.stderr}")

print()
print("✅ Dependências instaladas!")
print()

# ========================================
# PASSO 4: Criar arquivos
# ========================================
print("📝 PASSO 4: Criando arquivos...")
print()

# Arquivo 1: desktop_capture.py
print("   Criando desktop_capture.py...", end=" ")
desktop_capture_content = '''#!/usr/bin/env python3
"""
Desktop Capture - Captura de Tela e Programas
Envia dados para API Manus
"""

import os
import sys
import base64
import hashlib
import platform
from datetime import datetime
from io import BytesIO

try:
    from PIL import ImageGrab
    import psutil
    import requests
except ImportError as e:
    print(f"❌ Erro: Dependência não instalada: {e}")
    print("Execute: pip install Pillow psutil requests")
    sys.exit(1)

# Configuração
API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"
SAVE_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "comet_captures")

# Criar diretório de capturas
os.makedirs(SAVE_DIR, exist_ok=True)

def capturar_screenshot():
    """Captura screenshot da tela"""
    try:
        screenshot = ImageGrab.grab()
        return screenshot
    except Exception as e:
        print(f"❌ Erro ao capturar screenshot: {e}")
        return None

def listar_programas():
    """Lista programas em execução"""
    programas = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_percent', 'cpu_percent']):
        try:
            programas.append({
                "nome": proc.info['name'],
                "pid": proc.info['pid'],
                "memoria": round(proc.info['memory_percent'], 2),
                "cpu": round(proc.info['cpu_percent'], 2)
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return programas

def listar_janelas():
    """Lista janelas ativas (Windows)"""
    janelas = []
    if platform.system() == "Windows":
        try:
            import win32gui
            def callback(hwnd, extra):
                if win32gui.IsWindowVisible(hwnd):
                    titulo = win32gui.GetWindowText(hwnd)
                    if titulo:
                        janelas.append({"titulo": titulo, "hwnd": hwnd})
            win32gui.EnumWindows(callback, None)
        except ImportError:
            print("⚠️ pywin32 não instalado. Janelas não serão listadas.")
    return janelas

def enviar_para_api(screenshot, programas, janelas):
    """Envia dados para API"""
    try:
        # Converter screenshot para base64
        buffered = BytesIO()
        screenshot.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        # Preparar dados
        dados = {
            "screenshot_base64": img_base64,
            "largura": screenshot.width,
            "altura": screenshot.height,
            "programas": programas[:50],  # Limitar a 50
            "janelas": janelas[:20],  # Limitar a 20
            "timestamp": datetime.now().isoformat()
        }
        
        # Enviar para API
        response = requests.post(
            f"{API_URL}/api/trpc/desktop.capturar",
            json=dados,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Dados enviados com sucesso!")
            return True
        else:
            print(f"⚠️ API retornou status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao enviar para API: {e}")
        return False

def main():
    print("=" * 70)
    print("🖥️  DESKTOP CAPTURE - Captura de Tela")
    print("=" * 70)
    print()
    
    # 1. Capturar screenshot
    print("📸 Capturando screenshot...", end=" ")
    screenshot = capturar_screenshot()
    if screenshot:
        print(f"✅ {screenshot.width}x{screenshot.height}")
        
        # Salvar localmente
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(SAVE_DIR, f"capture_{timestamp}.png")
        screenshot.save(filename)
        print(f"💾 Salvo em: {filename}")
    else:
        print("❌ Falha")
        return
    
    # 2. Listar programas
    print("\\n📋 Listando programas...", end=" ")
    programas = listar_programas()
    print(f"✅ {len(programas)} programas detectados")
    
    # 3. Listar janelas
    print("🪟 Listando janelas...", end=" ")
    janelas = listar_janelas()
    print(f"✅ {len(janelas)} janelas ativas")
    
    # 4. Enviar para API
    print("\\n📤 Enviando para API Manus...")
    sucesso = enviar_para_api(screenshot, programas, janelas)
    
    print()
    print("=" * 70)
    if sucesso:
        print("✅ CAPTURA CONCLUÍDA COM SUCESSO!")
    else:
        print("⚠️  CAPTURA CONCLUÍDA (salvo localmente)")
    print("=" * 70)

if __name__ == "__main__":
    main()
'''

with open(comet_dir / "desktop_capture.py", "w", encoding="utf-8") as f:
    f.write(desktop_capture_content)
print("✅")

# Arquivo 2: requirements.txt
print("   Criando requirements.txt...", end=" ")
with open(comet_dir / "requirements.txt", "w", encoding="utf-8") as f:
    f.write("Pillow>=10.0.0\\npsutil>=5.9.0\\nrequests>=2.31.0\\nschedule>=1.2.0\\n")
print("✅")

# Arquivo 3: README.txt
print("   Criando README.txt...", end=" ")
readme_content = """========================================
DESKTOP CAPTURE - GUIA RÁPIDO
========================================

COMO USAR:

1. CAPTURA MANUAL:
   python desktop_capture.py

2. VER CAPTURAS:
   - Vá para: Área de Trabalho\\comet_captures\\
   - OU acesse: https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/desktop-captures

3. AGENDAMENTO AUTOMÁTICO:
   - Use o Agendador de Tarefas do Windows
   - Configure para executar desktop_capture.py a cada 30 minutos

========================================
ARQUIVOS:
- desktop_capture.py (script principal)
- requirements.txt (dependências)
- README.txt (este arquivo)

========================================
"""

with open(comet_dir / "README.txt", "w", encoding="utf-8") as f:
    f.write(readme_content)
print("✅")

print()
print("✅ Todos os arquivos criados em C:\\Comet\\!")
print()

# ========================================
# PASSO 5: Teste
# ========================================
print("=" * 70)
print("✅ INSTALAÇÃO CONCLUÍDA!")
print("=" * 70)
print()
print("📂 Arquivos instalados em: C:\\Comet\\")
print()
print("   ✅ desktop_capture.py")
print("   ✅ requirements.txt")
print("   ✅ README.txt")
print()
print("=" * 70)
print()

resposta = input("Deseja executar o teste de captura AGORA? (S/N): ").strip().upper()

if resposta == "S":
    print()
    print("🚀 Executando teste de captura...")
    print()
    
    try:
        os.chdir(comet_dir)
        subprocess.run([sys.executable, "desktop_capture.py"])
    except Exception as e:
        print(f"❌ Erro: {e}")

print()
print("=" * 70)
print("🎉 PRONTO! Você pode executar a qualquer momento:")
print("   cd C:\\Comet")
print("   python desktop_capture.py")
print("=" * 70)
print()
input("Pressione Enter para finalizar...")
