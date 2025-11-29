#!/usr/bin/env python3
"""
INSTALADOR AUTOMÁTICO - DESKTOP AGENT
1 CLIQUE = SISTEMA RODANDO

Este script:
1. Verifica Python
2. Instala dependências
3. Baixa o agent do servidor
4. Configura automaticamente
5. Inicia o sistema
"""

import os
import sys
import subprocess
import platform
import urllib.request
import json
import time
from pathlib import Path

VERSION = "1.0.0"
SERVER_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"

def print_header():
    print("=" * 70)
    print("  INSTALADOR AUTOMÁTICO - DESKTOP AGENT v{}".format(VERSION))
    print("  Sistema de Automação Remota")
    print("=" * 70)
    print()

def check_python():
    """Verifica versão do Python"""
    print("[1/6] Verificando Python...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python 3.7+ é necessário!")
        print("   Versão atual: {}.{}.{}".format(version.major, version.minor, version.micro))
        print()
        print("   Baixe Python em: https://www.python.org/downloads/")
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    print("✓ Python {}.{}.{} detectado".format(version.major, version.minor, version.micro))
    print()

def install_dependencies():
    """Instala dependências necessárias"""
    print("[2/6] Instalando dependências...")
    
    dependencies = [
        "websockets",
        "pillow",
        "requests"
    ]
    
    for dep in dependencies:
        try:
            print("  → Instalando {}...".format(dep))
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", dep, "--quiet"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print("    ✓ {} instalado".format(dep))
        except Exception as e:
            print("    ⚠ Erro ao instalar {}: {}".format(dep, e))
    
    print("✓ Dependências instaladas")
    print()

def create_directories():
    """Cria estrutura de diretórios"""
    print("[3/6] Criando diretórios...")
    
    base_dir = Path.home() / "DesktopAgent"
    dirs = [
        base_dir,
        base_dir / "plugins",
        base_dir / "cache",
        base_dir / "logs"
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    print("✓ Diretórios criados em: {}".format(base_dir))
    print()
    return base_dir

def download_agent(base_dir):
    """Baixa o agent do servidor"""
    print("[4/6] Baixando Desktop Agent...")
    
    try:
        # Baixar agent_v2.py
        url = "{}/api/download-agent/agent".format(SERVER_URL)
        agent_path = base_dir / "agent.py"
        
        print("  → Conectando ao servidor...")
        urllib.request.urlretrieve(url, agent_path)
        
        print("✓ Agent baixado com sucesso")
        print()
        return agent_path
    except Exception as e:
        print("❌ Erro ao baixar agent: {}".format(e))
        print()
        print("   Tentando usar agent local...")
        
        # Se falhar, copiar agent_v2.py local
        local_agent = Path(__file__).parent / "agent_v2.py"
        if local_agent.exists():
            import shutil
            agent_path = base_dir / "agent.py"
            shutil.copy(local_agent, agent_path)
            print("✓ Agent local copiado")
            print()
            return agent_path
        else:
            print("❌ Agent não encontrado!")
            input("\nPressione ENTER para sair...")
            sys.exit(1)

def configure_agent(base_dir):
    """Configura o agent"""
    print("[5/6] Configurando agent...")
    
    config = {
        "server_url": "wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent",
        "token": "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e",
        "device_name": platform.node(),
        "auto_start": True,
        "auto_update": True
    }
    
    config_path = base_dir / "config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✓ Configuração criada")
    print()

def create_startup_script(base_dir, agent_path):
    """Cria script de inicialização"""
    print("[6/6] Criando atalhos...")
    
    if platform.system() == "Windows":
        # Criar .bat para Windows
        bat_path = base_dir / "Iniciar_Agent.bat"
        with open(bat_path, 'w') as f:
            f.write('@echo off\n')
            f.write('title Desktop Agent\n')
            f.write('cd /d "{}"\n'.format(base_dir))
            f.write('"{}" "{}"\n'.format(sys.executable, agent_path))
            f.write('pause\n')
        
        print("✓ Atalho criado: {}".format(bat_path))
        
        # Criar atalho na área de trabalho
        try:
            desktop = Path.home() / "Desktop"
            if desktop.exists():
                desktop_bat = desktop / "Desktop_Agent.bat"
                with open(desktop_bat, 'w') as f:
                    f.write('@echo off\n')
                    f.write('cd /d "{}"\n'.format(base_dir))
                    f.write('"{}" "{}"\n'.format(sys.executable, agent_path))
                print("✓ Atalho criado na área de trabalho")
        except:
            pass
    else:
        # Criar .sh para Linux/Mac
        sh_path = base_dir / "start_agent.sh"
        with open(sh_path, 'w') as f:
            f.write('#!/bin/bash\n')
            f.write('cd "{}"\n'.format(base_dir))
            f.write('"{}" "{}"\n'.format(sys.executable, agent_path))
        
        os.chmod(sh_path, 0o755)
        print("✓ Script criado: {}".format(sh_path))
    
    print()

def start_agent(agent_path):
    """Inicia o agent"""
    print("=" * 70)
    print("  INSTALAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 70)
    print()
    print("O Desktop Agent está pronto para uso!")
    print()
    print("Opções:")
    print("  1. Iniciar agora")
    print("  2. Sair (iniciar manualmente depois)")
    print()
    
    choice = input("Escolha uma opção [1/2]: ").strip()
    
    if choice == "1":
        print()
        print("Iniciando Desktop Agent...")
        print("-" * 70)
        print()
        
        try:
            subprocess.run([sys.executable, str(agent_path)])
        except KeyboardInterrupt:
            print()
            print("Agent finalizado pelo usuário.")
    else:
        print()
        print("Para iniciar o agent depois:")
        if platform.system() == "Windows":
            print("  → Clique duas vezes em 'Iniciar_Agent.bat'")
            print("  → Ou use o atalho na área de trabalho")
        else:
            print("  → Execute: {}".format(agent_path.parent / "start_agent.sh"))
        print()
        input("Pressione ENTER para sair...")

def main():
    try:
        print_header()
        check_python()
        install_dependencies()
        base_dir = create_directories()
        agent_path = download_agent(base_dir)
        configure_agent(base_dir)
        create_startup_script(base_dir, agent_path)
        start_agent(agent_path)
        
    except KeyboardInterrupt:
        print()
        print()
        print("Instalação cancelada pelo usuário.")
        input("\nPressione ENTER para sair...")
        sys.exit(0)
    except Exception as e:
        print()
        print("=" * 70)
        print("  ERRO DURANTE A INSTALAÇÃO")
        print("=" * 70)
        print()
        print("Erro: {}".format(e))
        print()
        input("Pressione ENTER para sair...")
        sys.exit(1)

if __name__ == "__main__":
    main()
