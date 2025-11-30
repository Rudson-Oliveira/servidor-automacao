#!/usr/bin/env python3
"""
🔨 SCRIPT DE BUILD - COMPILAR INSTALADOR .EXE
Usa PyInstaller para criar executável standalone
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# ========================================
# CONFIGURAÇÕES
# ========================================

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
INSTALLER_SCRIPT = SCRIPT_DIR / 'desktop_agent_installer.py'
DIST_DIR = SCRIPT_DIR / 'dist'
BUILD_DIR = SCRIPT_DIR / 'build'
OUTPUT_NAME = 'ManusDesktopAgentInstaller'

# ========================================
# FUNÇÕES
# ========================================

def print_step(message):
    print(f"\n{'='*70}")
    print(f"🔨 {message}")
    print('='*70)

def install_pyinstaller():
    """Instala PyInstaller se não estiver instalado"""
    print_step("Verificando PyInstaller...")
    
    try:
        import PyInstaller
        print("✅ PyInstaller já instalado")
        return True
    except ImportError:
        print("📦 Instalando PyInstaller...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
            print("✅ PyInstaller instalado com sucesso")
            return True
        except subprocess.CalledProcessError:
            print("❌ Falha ao instalar PyInstaller")
            return False

def clean_build_dirs():
    """Limpa diretórios de build anteriores"""
    print_step("Limpando builds anteriores...")
    
    for dir_path in [DIST_DIR, BUILD_DIR]:
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print(f"✅ Removido: {dir_path}")

def create_icon():
    """Cria ícone para o instalador (opcional)"""
    print_step("Criando ícone...")
    
    icon_path = SCRIPT_DIR / 'icon.ico'
    
    if icon_path.exists():
        print(f"✅ Ícone encontrado: {icon_path}")
        return str(icon_path)
    else:
        print("ℹ️  Ícone não encontrado, usando padrão")
        return None

def build_exe():
    """Compila o instalador usando PyInstaller"""
    print_step("Compilando instalador...")
    
    icon_path = create_icon()
    
    # Argumentos do PyInstaller
    args = [
        'pyinstaller',
        '--onefile',  # Arquivo único
        '--windowed',  # Sem console (GUI)
        '--name', OUTPUT_NAME,
        '--distpath', str(DIST_DIR),
        '--workpath', str(BUILD_DIR),
        '--clean',
    ]
    
    # Adicionar ícone se existir
    if icon_path:
        args.extend(['--icon', icon_path])
    
    # Adicionar dados adicionais (se necessário)
    # args.extend(['--add-data', 'config.json;.'])
    
    # Script principal
    args.append(str(INSTALLER_SCRIPT))
    
    print(f"Executando: {' '.join(args)}")
    
    try:
        subprocess.check_call(args)
        print("\n✅ Compilação concluída com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Erro na compilação: {e}")
        return False

def verify_output():
    """Verifica se o .exe foi criado"""
    print_step("Verificando output...")
    
    exe_path = DIST_DIR / f'{OUTPUT_NAME}.exe'
    
    if exe_path.exists():
        size_mb = exe_path.stat().st_size / (1024 * 1024)
        print(f"✅ Instalador criado: {exe_path}")
        print(f"📦 Tamanho: {size_mb:.2f} MB")
        return True
    else:
        print(f"❌ Instalador não encontrado: {exe_path}")
        return False

def create_readme():
    """Cria README para distribuição"""
    print_step("Criando README...")
    
    readme_path = DIST_DIR / 'README.txt'
    
    readme_content = """
========================================
MANUS DESKTOP AGENT - INSTALADOR
========================================

📦 INSTALAÇÃO:

1. Execute ManusDesktopAgentInstaller.exe
2. Siga as instruções na tela
3. O agente será instalado automaticamente
4. Configure a extensão do navegador conforme instruído

========================================
REQUISITOS:

- Windows 10 ou superior
- Python 3.8+ (será instalado se necessário)
- Conexão com internet

========================================
SUPORTE:

Para suporte, acesse:
https://automacao-api-alejofy2.manus.space

========================================
"""
    
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"✅ README criado: {readme_path}")

def main():
    """Função principal"""
    print("\n" + "="*70)
    print("🚀 BUILD MANUS DESKTOP AGENT INSTALLER")
    print("="*70)
    
    # Verificar se estamos no diretório correto
    if not INSTALLER_SCRIPT.exists():
        print(f"❌ Script não encontrado: {INSTALLER_SCRIPT}")
        return False
    
    # Executar steps
    steps = [
        ("Instalando PyInstaller", install_pyinstaller),
        ("Limpando builds anteriores", clean_build_dirs),
        ("Compilando instalador", build_exe),
        ("Verificando output", verify_output),
        ("Criando README", create_readme),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Falha em: {step_name}")
            return False
    
    # Sucesso
    print("\n" + "="*70)
    print("✅ BUILD CONCLUÍDO COM SUCESSO!")
    print("="*70)
    print(f"\n📦 Instalador disponível em: {DIST_DIR / f'{OUTPUT_NAME}.exe'}")
    print("\n📌 PRÓXIMOS PASSOS:")
    print("1. Teste o instalador em uma máquina limpa")
    print("2. Distribua o arquivo .exe para os usuários")
    print("3. Forneça o README para instruções")
    print("\n")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Build cancelado pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
