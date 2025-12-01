#!/usr/bin/env python3
"""
GERADOR DE CONFIG.JSON - MULTIPLATAFORMA
Cria config.json com encoding correto (UTF-8 sem BOM)
"""

import json
import platform
import socket
import sys
from pathlib import Path


def print_banner():
    """Exibe banner do gerador"""
    print("=" * 60)
    print("  GERADOR DE CONFIG.JSON - DESKTOP AGENT")
    print("=" * 60)
    print()


def get_device_info():
    """Detecta informações do dispositivo automaticamente"""
    device_name = socket.gethostname()
    system = platform.system()
    release = platform.release()
    platform_str = f"{system} {release}"
    
    return device_name, platform_str


def validate_token(token: str) -> bool:
    """Valida formato do token"""
    if not token:
        return False
    
    # Token deve ter 64 caracteres hexadecimais
    if len(token) != 64:
        print(f"[AVISO] Token deve ter 64 caracteres (atual: {len(token)})")
        return True  # Permitir mesmo assim
    
    # Verificar se é hexadecimal
    try:
        int(token, 16)
        return True
    except ValueError:
        print("[AVISO] Token deve conter apenas caracteres hexadecimais (0-9, a-f)")
        return True  # Permitir mesmo assim


def create_config(token: str, device_name: str, platform_str: str, server_url: str):
    """Cria estrutura de configuração"""
    config = {
        "server": {
            "url": server_url,
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
    
    return config


def save_config(config: dict, output_path: Path):
    """
    Salva configuração em JSON com UTF-8 sem BOM
    CRÍTICO: encoding='utf-8' garante que não há BOM
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception as e:
        print(f"[ERRO] Falha ao salvar config.json: {e}")
        return False


def verify_no_bom(file_path: Path) -> bool:
    """Verifica se arquivo NÃO tem BOM"""
    try:
        with open(file_path, 'rb') as f:
            first_bytes = f.read(3)
            has_bom = (first_bytes == b'\xef\xbb\xbf')
            return not has_bom
    except Exception:
        return True  # Assumir OK se não conseguir verificar


def main():
    """Função principal"""
    print_banner()
    
    # Detectar informações do dispositivo
    device_name, platform_str = get_device_info()
    
    print(f"[INFO] Dispositivo detectado: {device_name}")
    print(f"[INFO] Plataforma: {platform_str}")
    print()
    
    # Solicitar token
    print("[INFO] Token de autenticação necessário")
    print("[INFO] Obtenha seu token em: https://automacao-api-alejofy2.manus.space/desktop/agents")
    print()
    
    token = input("Digite o token (64 caracteres): ").strip()
    
    if not validate_token(token):
        print("[ERRO] Token inválido!")
        print()
        input("Pressione ENTER para sair...")
        sys.exit(1)
    
    print()
    
    # Solicitar nome do dispositivo (opcional)
    custom_name = input(f"Nome do dispositivo [{device_name}]: ").strip()
    if custom_name:
        device_name = custom_name
    
    # URL do servidor (padrão)
    server_url = "wss://automacao-ws-alejofy2.manus.space/desktop-agent"
    
    # Criar configuração
    config = create_config(token, device_name, platform_str, server_url)
    
    # Caminho do arquivo
    script_dir = Path(__file__).parent
    config_path = script_dir / "config.json"
    
    # Salvar configuração
    print()
    print("[INFO] Criando config.json...")
    
    if not save_config(config, config_path):
        print()
        input("Pressione ENTER para sair...")
        sys.exit(1)
    
    print(f"[OK] Config.json criado com sucesso!")
    print(f"[OK] Arquivo: {config_path}")
    print()
    
    # Verificar BOM
    if verify_no_bom(config_path):
        print("[OK] Arquivo criado SEM BOM (correto!)")
    else:
        print("[AVISO] Arquivo criado COM BOM (não esperado)")
        print("[INFO] Agent.py deve conseguir ler mesmo assim")
    
    print()
    print("[INFO] Configuração:")
    print(f"  - Dispositivo: {device_name}")
    print(f"  - Plataforma: {platform_str}")
    print(f"  - Servidor: {server_url}")
    print(f"  - Token: {token[:16]}...")
    print()
    print("[INFO] Próximo passo: Execute 'python agent.py'")
    print()
    
    input("Pressione ENTER para continuar...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print("[INFO] Operação cancelada pelo usuário")
        sys.exit(0)
    except Exception as e:
        print()
        print(f"[ERRO] Erro inesperado: {e}")
        input("Pressione ENTER para sair...")
        sys.exit(1)
