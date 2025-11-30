#!/usr/bin/env python3
"""
🚀 INSTALADOR AUTOMÁTICO - AGENTE DESKTOP MANUS
Instalação simplificada para usuários leigos
Não requer conhecimento técnico
"""

import os
import sys
import json
import subprocess
import urllib.request
import zipfile
import shutil
import winreg
from pathlib import Path
import ctypes

# ========================================
# CONFIGURAÇÕES
# ========================================

SERVER_URL = "https://automacao-api-alejofy2.manus.space"
INSTALL_DIR = os.path.join(os.getenv('APPDATA'), 'ManusDesktopAgent')
AGENT_VERSION = "1.0.0"

# ========================================
# FUNÇÕES AUXILIARES
# ========================================

def is_admin():
    """Verifica se está rodando como administrador"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def print_header():
    """Imprime cabeçalho bonito"""
    print("\n" + "="*70)
    print("🚀 INSTALADOR MANUS DESKTOP AGENT")
    print("="*70 + "\n")

def print_step(step, total, message):
    """Imprime passo da instalação"""
    print(f"[{step}/{total}] {message}")

def print_success(message):
    """Imprime mensagem de sucesso"""
    print(f"✅ {message}")

def print_error(message):
    """Imprime mensagem de erro"""
    print(f"❌ {message}")

def print_info(message):
    """Imprime mensagem informativa"""
    print(f"ℹ️  {message}")

# ========================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ========================================

def install_dependencies():
    """Instala dependências Python necessárias"""
    print_step(1, 7, "Instalando dependências Python...")
    
    dependencies = [
        'pillow',
        'psutil',
        'requests',
        'websockets',
        'pywin32',
    ]
    
    for dep in dependencies:
        try:
            print(f"   Instalando {dep}...")
            subprocess.check_call(
                [sys.executable, '-m', 'pip', 'install', '--quiet', '--upgrade', dep],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print_success(f"{dep} instalado")
        except subprocess.CalledProcessError:
            print_error(f"Falha ao instalar {dep}")
            return False
    
    return True

# ========================================
# CRIAÇÃO DE DIRETÓRIOS
# ========================================

def create_directories():
    """Cria estrutura de diretórios"""
    print_step(2, 7, "Criando diretórios...")
    
    dirs = [
        INSTALL_DIR,
        os.path.join(INSTALL_DIR, 'logs'),
        os.path.join(INSTALL_DIR, 'screenshots'),
        os.path.join(INSTALL_DIR, 'config'),
    ]
    
    for dir_path in dirs:
        try:
            os.makedirs(dir_path, exist_ok=True)
            print_success(f"Diretório criado: {dir_path}")
        except Exception as e:
            print_error(f"Falha ao criar {dir_path}: {e}")
            return False
    
    return True

# ========================================
# DOWNLOAD DO AGENTE
# ========================================

def download_agent():
    """Baixa o agente desktop do servidor"""
    print_step(3, 7, "Baixando agente desktop...")
    
    agent_url = f"{SERVER_URL}/api/download/desktop-agent.py"
    agent_path = os.path.join(INSTALL_DIR, 'desktop_agent.py')
    
    try:
        print(f"   Baixando de: {agent_url}")
        urllib.request.urlretrieve(agent_url, agent_path)
        print_success(f"Agente baixado: {agent_path}")
        return True
    except Exception as e:
        print_error(f"Falha ao baixar agente: {e}")
        print_info("Usando agente local como fallback...")
        
        # Fallback: copiar agente local se existir
        local_agent = os.path.join(os.path.dirname(__file__), '..', 'desktop_capture.py')
        if os.path.exists(local_agent):
            shutil.copy(local_agent, agent_path)
            print_success("Agente local copiado")
            return True
        
        return False

# ========================================
# REGISTRO NO SERVIDOR
# ========================================

def register_agent():
    """Registra o agente no servidor e obtém token"""
    print_step(4, 7, "Registrando agente no servidor...")
    
    import socket
    import uuid
    
    # Obter informações do sistema
    hostname = socket.gethostname()
    machine_id = str(uuid.getnode())  # MAC address como ID único
    
    # Dados de registro
    registration_data = {
        'hostname': hostname,
        'machine_id': machine_id,
        'agent_version': AGENT_VERSION,
        'os': sys.platform,
        'python_version': sys.version,
    }
    
    try:
        import requests
        
        response = requests.post(
            f"{SERVER_URL}/api/install/desktop-agent",
            json=registration_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            token = result.get('token')
            agent_id = result.get('agent_id')
            
            # Salvar configuração
            config = {
                'server_url': SERVER_URL,
                'token': token,
                'agent_id': agent_id,
                'hostname': hostname,
                'machine_id': machine_id,
            }
            
            config_path = os.path.join(INSTALL_DIR, 'config', 'agent.json')
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            print_success(f"Agente registrado! ID: {agent_id}")
            return True
        else:
            print_error(f"Falha no registro: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Erro ao registrar: {e}")
        return False

# ========================================
# INSTALAÇÃO DA EXTENSÃO DO NAVEGADOR
# ========================================

def install_browser_extension():
    """Instala extensão do navegador (Chrome/Edge)"""
    print_step(5, 7, "Configurando extensão do navegador...")
    
    # Download da extensão
    extension_url = f"{SERVER_URL}/api/download/browser-extension.zip"
    extension_dir = os.path.join(INSTALL_DIR, 'browser_extension')
    
    try:
        # Criar diretório
        os.makedirs(extension_dir, exist_ok=True)
        
        # Baixar extensão
        extension_zip = os.path.join(INSTALL_DIR, 'extension.zip')
        print(f"   Baixando extensão de: {extension_url}")
        
        try:
            urllib.request.urlretrieve(extension_url, extension_zip)
            
            # Extrair
            with zipfile.ZipFile(extension_zip, 'r') as zip_ref:
                zip_ref.extractall(extension_dir)
            
            # Remover zip
            os.remove(extension_zip)
            
            print_success("Extensão baixada e extraída")
        except Exception as e:
            print_info(f"Extensão não disponível no servidor: {e}")
            print_info("Você pode instalar manualmente depois")
        
        # Instruções para o usuário
        print("\n" + "="*70)
        print("📌 INSTRUÇÕES PARA INSTALAR A EXTENSÃO DO NAVEGADOR:")
        print("="*70)
        print("1. Abra o Chrome ou Edge")
        print("2. Digite na barra de endereços: chrome://extensions/")
        print("3. Ative o 'Modo do desenvolvedor' (canto superior direito)")
        print("4. Clique em 'Carregar sem compactação'")
        print(f"5. Selecione a pasta: {extension_dir}")
        print("="*70 + "\n")
        
        return True
        
    except Exception as e:
        print_error(f"Erro ao configurar extensão: {e}")
        return False

# ========================================
# CONFIGURAÇÃO DE INICIALIZAÇÃO AUTOMÁTICA
# ========================================

def setup_autostart():
    """Configura inicialização automática do Windows"""
    print_step(6, 7, "Configurando inicialização automática...")
    
    try:
        # Criar script de inicialização
        startup_script = os.path.join(INSTALL_DIR, 'start_agent.bat')
        
        with open(startup_script, 'w') as f:
            f.write('@echo off\n')
            f.write(f'cd /d "{INSTALL_DIR}"\n')
            f.write(f'"{sys.executable}" desktop_agent.py\n')
        
        # Adicionar ao registro do Windows (Run)
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, "ManusDesktopAgent", 0, winreg.REG_SZ, startup_script)
        winreg.CloseKey(key)
        
        print_success("Inicialização automática configurada")
        return True
        
    except Exception as e:
        print_error(f"Falha ao configurar autostart: {e}")
        print_info("Você pode iniciar manualmente o agente")
        return False

# ========================================
# CRIAÇÃO DE ATALHOS
# ========================================

def create_shortcuts():
    """Cria atalhos na área de trabalho"""
    print_step(7, 7, "Criando atalhos...")
    
    try:
        desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        
        # Atalho para iniciar agente
        shortcut_path = os.path.join(desktop, "Manus Desktop Agent.bat")
        
        with open(shortcut_path, 'w') as f:
            f.write('@echo off\n')
            f.write(f'cd /d "{INSTALL_DIR}"\n')
            f.write(f'"{sys.executable}" desktop_agent.py\n')
            f.write('pause\n')
        
        print_success(f"Atalho criado: {shortcut_path}")
        return True
        
    except Exception as e:
        print_error(f"Falha ao criar atalhos: {e}")
        return False

# ========================================
# FUNÇÃO PRINCIPAL
# ========================================

def main():
    """Função principal de instalação"""
    print_header()
    
    # Verificar se é Windows
    if sys.platform != 'win32':
        print_error("Este instalador funciona apenas no Windows")
        return False
    
    # Verificar privilégios
    if not is_admin():
        print_info("Recomenda-se executar como administrador")
        print_info("Mas a instalação pode continuar...")
    
    print("Iniciando instalação...\n")
    
    # Executar passos
    steps = [
        ("Instalando dependências", install_dependencies),
        ("Criando diretórios", create_directories),
        ("Baixando agente", download_agent),
        ("Registrando no servidor", register_agent),
        ("Configurando extensão", install_browser_extension),
        ("Configurando autostart", setup_autostart),
        ("Criando atalhos", create_shortcuts),
    ]
    
    success = True
    for step_name, step_func in steps:
        try:
            if not step_func():
                print_error(f"Falha em: {step_name}")
                success = False
                # Continuar mesmo com falhas não-críticas
        except Exception as e:
            print_error(f"Erro em {step_name}: {e}")
            success = False
    
    # Resultado final
    print("\n" + "="*70)
    if success:
        print("✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*70)
        print("\n📌 PRÓXIMOS PASSOS:")
        print("1. O agente será iniciado automaticamente no próximo login")
        print("2. Você pode iniciar agora usando o atalho na área de trabalho")
        print("3. Instale a extensão do navegador seguindo as instruções acima")
        print(f"\n📁 Diretório de instalação: {INSTALL_DIR}")
    else:
        print("⚠️  INSTALAÇÃO CONCLUÍDA COM AVISOS")
        print("="*70)
        print("\nAlgumas etapas falharam, mas o agente pode funcionar")
        print("Verifique os erros acima para mais detalhes")
    
    print("\n")
    input("Pressione ENTER para sair...")
    return success

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Instalação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        input("Pressione ENTER para sair...")
        sys.exit(1)
