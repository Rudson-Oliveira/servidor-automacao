#!/usr/bin/env python3
"""
SCRIPT DE TESTE - DESKTOP AGENT
Valida instalação e configuração antes de executar
"""

import json
import os
import platform
import sys
from pathlib import Path


def print_header(title: str):
    """Exibe cabeçalho de seção"""
    print()
    print("=" * 70)
    print(f"  {title}")
    print("=" * 70)
    print()


def print_test(name: str, passed: bool, details: str = ""):
    """Exibe resultado de teste"""
    status = "✓ PASS" if passed else "✗ FAIL"
    color = "\033[92m" if passed else "\033[91m"
    reset = "\033[0m"
    
    print(f"{color}{status}{reset} {name}")
    if details:
        print(f"      {details}")


def test_python_version() -> bool:
    """Testa versão do Python"""
    version = sys.version_info
    passed = version.major >= 3 and version.minor >= 7
    details = f"Python {version.major}.{version.minor}.{version.micro}"
    print_test("Versão do Python (>= 3.7)", passed, details)
    return passed


def test_dependencies() -> bool:
    """Testa dependências instaladas"""
    all_ok = True
    
    # websocket-client (obrigatório)
    try:
        import websocket
        print_test("websocket-client", True, f"v{websocket.__version__}")
    except ImportError:
        print_test("websocket-client", False, "NÃO INSTALADO")
        all_ok = False
    
    # Pillow (opcional)
    try:
        from PIL import Image
        print_test("Pillow (screenshots)", True, "Instalado")
    except ImportError:
        print_test("Pillow (screenshots)", False, "Opcional - não instalado")
    
    return all_ok


def test_config_exists() -> tuple:
    """Testa se config.json existe"""
    config_path = Path(__file__).parent / "config.json"
    exists = config_path.exists()
    
    print_test("config.json existe", exists, str(config_path))
    
    return exists, config_path


def test_config_encoding(config_path: Path) -> bool:
    """Testa encoding do config.json"""
    try:
        # Ler bytes
        with open(config_path, 'rb') as f:
            first_bytes = f.read(3)
        
        has_bom = (first_bytes == b'\xef\xbb\xbf')
        
        if has_bom:
            print_test("Encoding UTF-8 sem BOM", False, "TEM BOM (mas agent.py consegue ler)")
            return True  # Agent.py corrigido consegue ler
        else:
            print_test("Encoding UTF-8 sem BOM", True, "Correto")
            return True
            
    except Exception as e:
        print_test("Encoding UTF-8 sem BOM", False, f"Erro: {e}")
        return False


def test_config_valid_json(config_path: Path) -> tuple:
    """Testa se config.json é JSON válido"""
    try:
        # Tentar múltiplos encodings (mesmo que agent.py)
        encodings = ['utf-8-sig', 'utf-8', 'cp1252', 'latin-1']
        
        config = None
        for encoding in encodings:
            try:
                with open(config_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    if content.startswith('\ufeff'):
                        content = content[1:]
                    config = json.loads(content)
                    break
            except:
                continue
        
        if config:
            print_test("JSON válido", True, "Parse OK")
            return True, config
        else:
            print_test("JSON válido", False, "Falha no parse")
            return False, None
            
    except Exception as e:
        print_test("JSON válido", False, f"Erro: {e}")
        return False, None


def test_config_structure(config: dict) -> bool:
    """Testa estrutura do config.json"""
    all_ok = True
    
    # Campos obrigatórios
    required_sections = ['server', 'agent', 'heartbeat']
    
    for section in required_sections:
        if section in config:
            print_test(f"Seção '{section}'", True, "Presente")
        else:
            print_test(f"Seção '{section}'", False, "AUSENTE")
            all_ok = False
    
    # Validar token
    if 'agent' in config and 'token' in config['agent']:
        token = config['agent']['token']
        token_len = len(token)
        token_ok = token_len == 64
        
        if token_ok:
            print_test("Token", True, f"{token_len} caracteres (correto)")
        else:
            print_test("Token", False, f"{token_len} caracteres (esperado: 64)")
            all_ok = False
    else:
        print_test("Token", False, "AUSENTE")
        all_ok = False
    
    # Validar URL do servidor
    if 'server' in config and 'url' in config['server']:
        url = config['server']['url']
        url_ok = url.startswith('wss://') or url.startswith('ws://')
        
        if url_ok:
            print_test("URL do servidor", True, url)
        else:
            print_test("URL do servidor", False, f"Protocolo inválido: {url}")
            all_ok = False
    else:
        print_test("URL do servidor", False, "AUSENTE")
        all_ok = False
    
    return all_ok


def test_agent_file() -> bool:
    """Testa se agent.py existe"""
    agent_path = Path(__file__).parent / "agent.py"
    exists = agent_path.exists()
    
    print_test("agent.py existe", exists, str(agent_path))
    
    return exists


def main():
    """Função principal"""
    print_header("TESTE DE INSTALAÇÃO - DESKTOP AGENT v2.1.0")
    
    print(f"Sistema: {platform.system()} {platform.release()}")
    print(f"Arquitetura: {platform.machine()}")
    print(f"Python: {sys.version.split()[0]}")
    
    # Testes
    print_header("1. AMBIENTE")
    test1 = test_python_version()
    test2 = test_dependencies()
    
    print_header("2. ARQUIVOS")
    test3, config_path = test_config_exists()
    test4 = test_agent_file()
    
    if test3:
        print_header("3. CONFIGURAÇÃO")
        test5 = test_config_encoding(config_path)
        test6, config = test_config_valid_json(config_path)
        
        if test6 and config:
            test7 = test_config_structure(config)
        else:
            test7 = False
    else:
        print_header("3. CONFIGURAÇÃO")
        print("⚠ config.json não encontrado - pulando testes")
        test5 = test6 = test7 = False
    
    # Resumo
    print_header("RESUMO")
    
    all_tests = [test1, test2, test3, test4, test5, test6, test7]
    passed = sum(all_tests)
    total = len(all_tests)
    
    print(f"Testes passados: {passed}/{total}")
    print()
    
    if all(all_tests):
        print("\033[92m✓ TODOS OS TESTES PASSARAM!\033[0m")
        print()
        print("Desktop Agent está pronto para uso.")
        print("Execute: python agent.py")
    else:
        print("\033[91m✗ ALGUNS TESTES FALHARAM\033[0m")
        print()
        print("Recomendações:")
        
        if not test1:
            print("  - Atualize Python para versão 3.7+")
        if not test2:
            print("  - Execute: pip install websocket-client")
        if not test3:
            print("  - Execute: python gerar_config.py")
        if not test6 or not test7:
            print("  - Recrie config.json: python gerar_config.py")
        
        print()
        print("Ou use o instalador automático:")
        print("  python instalar.py")
    
    print()
    input("Pressione ENTER para sair...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print("Teste cancelado")
        sys.exit(0)
    except Exception as e:
        print()
        print(f"Erro: {e}")
        input("Pressione ENTER para sair...")
        sys.exit(1)
