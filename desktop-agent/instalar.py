#!/usr/bin/env python3
"""
INSTALADOR INTELIGENTE - DESKTOP AGENT
Instala, configura e testa o Desktop Agent automaticamente
Com rollback automático em caso de falha
"""

import json
import os
import platform
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional, Tuple


class Colors:
    """Cores ANSI para terminal"""
    RESET = '\033[0m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'


def print_banner():
    """Exibe banner do instalador"""
    print()
    print(Colors.CYAN + "=" * 70 + Colors.RESET)
    print(Colors.CYAN + Colors.BOLD + "  INSTALADOR INTELIGENTE - DESKTOP AGENT" + Colors.RESET)
    print(Colors.CYAN + "  Configuração automática com teste de conexão" + Colors.RESET)
    print(Colors.CYAN + "=" * 70 + Colors.RESET)
    print()


def print_step(step: int, total: int, message: str):
    """Exibe passo da instalação"""
    print(f"{Colors.BLUE}[{step}/{total}]{Colors.RESET} {message}")


def print_success(message: str):
    """Exibe mensagem de sucesso"""
    print(f"{Colors.GREEN}[OK]{Colors.RESET} {message}")


def print_error(message: str):
    """Exibe mensagem de erro"""
    print(f"{Colors.RED}[ERRO]{Colors.RESET} {message}")


def print_warning(message: str):
    """Exibe mensagem de aviso"""
    print(f"{Colors.YELLOW}[AVISO]{Colors.RESET} {message}")


def print_info(message: str):
    """Exibe mensagem informativa"""
    print(f"{Colors.CYAN}[INFO]{Colors.RESET} {message}")


def check_python_version() -> bool:
    """Verifica se Python 3.7+ está instalado"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 7:
        return True
    return False


def check_dependencies() -> Tuple[bool, list]:
    """Verifica se dependências estão instaladas"""
    required = ['websocket']
    optional = ['PIL']
    
    missing = []
    
    for module in required:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    return len(missing) == 0, missing


def install_dependencies(missing: list) -> bool:
    """Instala dependências faltantes"""
    print_info("Instalando dependências...")
    
    packages = []
    if 'websocket' in missing:
        packages.append('websocket-client')
    
    if not packages:
        return True
    
    try:
        cmd = [sys.executable, '-m', 'pip', 'install'] + packages
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print_success("Dependências instaladas com sucesso")
            return True
        else:
            print_error(f"Falha ao instalar dependências: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print_error("Timeout ao instalar dependências")
        return False
    except Exception as e:
        print_error(f"Erro ao instalar dependências: {e}")
        return False


def get_device_info() -> Tuple[str, str]:
    """Detecta informações do dispositivo"""
    device_name = socket.gethostname()
    system = platform.system()
    release = platform.release()
    platform_str = f"{system} {release}"
    
    return device_name, platform_str


def create_config(token: str, device_name: str, platform_str: str) -> dict:
    """Cria estrutura de configuração"""
    return {
        "server": {
            "url": "wss://automacao-ws-alejofy2.manus.space/desktop-agent",
            "max_reconnect_attempts": 10
        },
        "agent": {
            "token": token,
            "device_name": device_name,
            "platform": platform_str,
            "version": "2.1.0"
        },
        "heartbeat": {
            "interval": 30,
            "timeout": 90
        },
        "logging": {
            "level": "INFO"
        }
    }


def save_config(config: dict, output_path: Path) -> bool:
    """Salva configuração em JSON com UTF-8 sem BOM"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print_error(f"Falha ao salvar config.json: {e}")
        return False


def backup_config(config_path: Path) -> Optional[Path]:
    """Cria backup do config.json existente"""
    if not config_path.exists():
        return None
    
    backup_path = config_path.with_suffix('.json.backup')
    try:
        shutil.copy2(config_path, backup_path)
        return backup_path
    except Exception as e:
        print_warning(f"Não foi possível criar backup: {e}")
        return None


def restore_config(backup_path: Optional[Path], config_path: Path):
    """Restaura config.json do backup"""
    if backup_path and backup_path.exists():
        try:
            shutil.copy2(backup_path, config_path)
            print_info("Config.json restaurado do backup")
        except Exception as e:
            print_error(f"Falha ao restaurar backup: {e}")


def test_connection(config_path: Path, timeout: int = 10) -> bool:
    """
    Testa conexão com o servidor executando agent.py por alguns segundos
    Retorna True se conectou com sucesso
    """
    print_info(f"Testando conexão (timeout: {timeout}s)...")
    
    script_dir = config_path.parent
    agent_path = script_dir / "agent.py"
    
    if not agent_path.exists():
        print_error(f"agent.py não encontrado em {agent_path}")
        return False
    
    try:
        # Executar agent.py e capturar saída
        process = subprocess.Popen(
            [sys.executable, str(agent_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=str(script_dir)
        )
        
        # Ler saída por alguns segundos
        start_time = time.time()
        output_lines = []
        
        while time.time() - start_time < timeout:
            line = process.stdout.readline()
            if line:
                output_lines.append(line.strip())
                print(f"  {line.strip()}")
                
                # Verificar sucesso na autenticação
                if "Autenticado com sucesso" in line or "authenticated" in line.lower():
                    process.terminate()
                    print_success("Conexão estabelecida com sucesso!")
                    return True
                
                # Verificar erros críticos
                if "Token inválido" in line or "authentication failed" in line.lower():
                    process.terminate()
                    print_error("Falha na autenticação - token inválido")
                    return False
            
            # Verificar se processo terminou
            if process.poll() is not None:
                break
            
            time.sleep(0.1)
        
        # Timeout - terminar processo
        process.terminate()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            process.kill()
        
        # Analisar saída
        output_text = '\n'.join(output_lines)
        
        if "Conectado ao servidor" in output_text:
            print_success("Conexão estabelecida!")
            return True
        elif "Token inválido" in output_text:
            print_error("Token inválido")
            return False
        else:
            print_warning("Não foi possível confirmar conexão no tempo limite")
            print_info("Isso pode ser normal se a rede estiver lenta")
            return False
            
    except Exception as e:
        print_error(f"Erro ao testar conexão: {e}")
        return False


def main():
    """Função principal do instalador"""
    print_banner()
    
    # Passo 1: Verificar Python
    print_step(1, 6, "Verificando versão do Python...")
    if not check_python_version():
        print_error(f"Python 3.7+ necessário (atual: {sys.version})")
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    print_success(f"Python {sys.version.split()[0]} OK")
    print()
    
    # Passo 2: Verificar dependências
    print_step(2, 6, "Verificando dependências...")
    deps_ok, missing = check_dependencies()
    
    if not deps_ok:
        print_warning(f"Dependências faltantes: {', '.join(missing)}")
        
        response = input("Deseja instalar automaticamente? (S/n): ").strip().lower()
        if response in ['', 's', 'sim', 'y', 'yes']:
            if not install_dependencies(missing):
                print_error("Falha ao instalar dependências")
                input("\nPressione ENTER para sair...")
                sys.exit(1)
        else:
            print_info("Instale manualmente: pip install websocket-client")
            input("\nPressione ENTER para sair...")
            sys.exit(1)
    else:
        print_success("Todas as dependências estão instaladas")
    print()
    
    # Passo 3: Detectar informações do sistema
    print_step(3, 6, "Detectando informações do sistema...")
    device_name, platform_str = get_device_info()
    print_success(f"Dispositivo: {device_name}")
    print_success(f"Plataforma: {platform_str}")
    print()
    
    # Passo 4: Solicitar token
    print_step(4, 6, "Configurando autenticação...")
    print_info("Obtenha seu token em: https://automacao-api-alejofy2.manus.space/desktop/agents")
    print()
    
    token = input("Digite o token de autenticação (64 caracteres): ").strip()
    
    if not token or len(token) != 64:
        print_error("Token inválido! Deve ter 64 caracteres")
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    print_success("Token configurado")
    print()
    
    # Passo 5: Criar configuração
    print_step(5, 6, "Criando arquivo de configuração...")
    
    script_dir = Path(__file__).parent
    config_path = script_dir / "config.json"
    
    # Backup se existir
    backup_path = backup_config(config_path)
    if backup_path:
        print_info(f"Backup criado: {backup_path.name}")
    
    # Criar nova configuração
    config = create_config(token, device_name, platform_str)
    
    if not save_config(config, config_path):
        print_error("Falha ao criar config.json")
        restore_config(backup_path, config_path)
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    print_success(f"Config.json criado: {config_path}")
    print()
    
    # Passo 6: Testar conexão
    print_step(6, 6, "Testando conexão com o servidor...")
    print()
    
    connection_ok = test_connection(config_path, timeout=15)
    
    print()
    
    if connection_ok:
        print()
        print(Colors.GREEN + Colors.BOLD + "=" * 70 + Colors.RESET)
        print(Colors.GREEN + Colors.BOLD + "  ✓ INSTALAÇÃO CONCLUÍDA COM SUCESSO!" + Colors.RESET)
        print(Colors.GREEN + Colors.BOLD + "=" * 70 + Colors.RESET)
        print()
        print_info("Desktop Agent está pronto para uso!")
        print_info("Execute: python agent.py")
        print()
        
        # Remover backup se tudo OK
        if backup_path and backup_path.exists():
            try:
                backup_path.unlink()
            except:
                pass
    else:
        print()
        print(Colors.YELLOW + "=" * 70 + Colors.RESET)
        print(Colors.YELLOW + "  ⚠ INSTALAÇÃO CONCLUÍDA COM AVISOS" + Colors.RESET)
        print(Colors.YELLOW + "=" * 70 + Colors.RESET)
        print()
        print_warning("Não foi possível confirmar a conexão")
        print_info("Possíveis causas:")
        print_info("  - Token incorreto ou expirado")
        print_info("  - Servidor temporariamente indisponível")
        print_info("  - Firewall bloqueando conexão WebSocket")
        print()
        print_info("Tente executar manualmente: python agent.py")
        print()
        
        response = input("Deseja reverter para configuração anterior? (s/N): ").strip().lower()
        if response in ['s', 'sim', 'y', 'yes']:
            restore_config(backup_path, config_path)
            print_info("Configuração revertida")
    
    print()
    input("Pressione ENTER para finalizar...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print_info("Instalação cancelada pelo usuário")
        sys.exit(0)
    except Exception as e:
        print()
        print_error(f"Erro inesperado: {e}")
        input("\nPressione ENTER para sair...")
        sys.exit(1)
