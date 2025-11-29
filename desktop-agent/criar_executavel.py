#!/usr/bin/env python3
"""
Script para criar executável .exe do Desktop Agent
Usa PyInstaller para empacotar tudo em um único arquivo
"""

import os
import sys
import subprocess
import shutil

def main():
    print("=" * 60)
    print("  CRIADOR DE EXECUTÁVEL - DESKTOP AGENT")
    print("=" * 60)
    print()
    
    # Verificar se PyInstaller está instalado
    print("[1/5] Verificando PyInstaller...")
    try:
        import PyInstaller
        print("✓ PyInstaller encontrado")
    except ImportError:
        print("✗ PyInstaller não encontrado. Instalando...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
        print("✓ PyInstaller instalado")
    
    print()
    
    # Verificar se agent.py existe
    print("[2/5] Verificando agent.py...")
    if not os.path.exists("agent.py"):
        print("✗ ERRO: agent.py não encontrado!")
        print("  Por favor, certifique-se de que agent.py está no mesmo diretório.")
        sys.exit(1)
    print("✓ agent.py encontrado")
    
    print()
    
    # Criar arquivo de spec do PyInstaller
    print("[3/5] Criando configuração do PyInstaller...")
    
    spec_content = """# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['agent.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['websockets', 'PIL', 'psutil', 'win32api', 'win32con'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='DesktopAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
    version_file=None,
)
"""
    
    with open("agent.spec", "w") as f:
        f.write(spec_content)
    
    print("✓ Configuração criada (agent.spec)")
    
    print()
    
    # Executar PyInstaller
    print("[4/5] Compilando executável...")
    print("  Isso pode levar alguns minutos...")
    print()
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "PyInstaller",
            "--clean",
            "--onefile",
            "--name=DesktopAgent",
            "--console",
            "--add-data=agent.py;.",
            "agent.py"
        ])
        print()
        print("✓ Compilação concluída")
    except subprocess.CalledProcessError as e:
        print(f"✗ ERRO ao compilar: {e}")
        sys.exit(1)
    
    print()
    
    # Verificar se o executável foi criado
    print("[5/5] Verificando executável...")
    
    exe_path = os.path.join("dist", "DesktopAgent.exe")
    if os.path.exists(exe_path):
        file_size = os.path.getsize(exe_path) / (1024 * 1024)  # MB
        print(f"✓ Executável criado com sucesso!")
        print(f"  Local: {os.path.abspath(exe_path)}")
        print(f"  Tamanho: {file_size:.2f} MB")
    else:
        print("✗ ERRO: Executável não foi criado!")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("  SUCESSO!")
    print("=" * 60)
    print()
    print("O executável está pronto em:")
    print(f"  {os.path.abspath(exe_path)}")
    print()
    print("Você pode distribuir este arquivo .exe para qualquer")
    print("computador Windows sem precisar instalar Python!")
    print()
    print("Para usar:")
    print("  1. Copie DesktopAgent.exe para o computador de destino")
    print("  2. Execute DesktopAgent.exe")
    print("  3. Pronto! O agent se conectará automaticamente.")
    print()
    
    # Limpar arquivos temporários
    print("Limpando arquivos temporários...")
    if os.path.exists("build"):
        shutil.rmtree("build")
    if os.path.exists("agent.spec"):
        os.remove("agent.spec")
    print("✓ Limpeza concluída")
    print()

if __name__ == "__main__":
    main()
