#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
INSTALADOR AUTOMÁTICO - DESKTOP AGENT
Sistema de Automação Remota
Versão: 2.0 (Autocontido - sem download externo)
"""

import os
import sys
import json
import platform
import subprocess
from pathlib import Path
import urllib.request
import urllib.error

# ============================================================================
# CÓDIGO DO AGENT EMBUTIDO (será extraído durante instalação)
# ============================================================================

AGENT_CODE = """
#!/usr/bin/env python3
"""
Desktop Agent - Cliente Python para Controle Remoto
Conecta ao servidor WebSocket e executa comandos remotamente
"""

import json
import logging
import platform
import socket
import subprocess
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import base64
import os

import websocket

# Tentar importar Pillow para screenshots
try:
    from PIL import ImageGrab
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("⚠️ Pillow não instalado. Screenshots não estarão disponíveis.")
    print("💡 Execute: pip install Pillow")


class DesktopAgent:
    """
    Desktop Agent que conecta ao servidor via WebSocket
    e executa comandos remotamente
    """
    
    def __init__(self, config_path: str = "config.json"):
        """Inicializa o Desktop Agent com configuração"""
        self.config = self._load_config(config_path)
        self.ws: Optional[websocket.WebSocketApp] = None
        self.connected = False
        self.authenticated = False
        self.reconnect_attempts = 0
        self.heartbeat_thread: Optional[threading.Thread] = None
        self.polling_thread: Optional[threading.Thread] = None
        self.should_run = True
        
        # Configurar logging
        self._setup_logging()
        
        self.logger.info("=" * 60)
        self.logger.info("Desktop Agent Iniciado")
        self.logger.info(f"Dispositivo: {self.config['agent']['device_name']}")
        self.logger.info(f"Plataforma: {self.config['agent']['platform']}")
        self.logger.info(f"Versão: {self.config['agent']['version']}")
        self.logger.info("=" * 60)
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Carrega configuração do arquivo JSON"""
        config_file = Path(config_path)
        
        if not config_file.exists():
            print(f"❌ Arquivo de configuração não encontrado: {config_path}")
            print(f"💡 Copie config.example.json para config.json e configure seu token")
            sys.exit(1)
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # Validar campos obrigatórios
            required_fields = ['server', 'agent', 'heartbeat']
            for field in required_fields:
                if field not in config:
                    raise ValueError(f"Campo obrigatório ausente: {field}")
            
            # Detectar plataforma automaticamente se não especificado
            if not config['agent'].get('platform'):
                config['agent']['platform'] = platform.system() + " " + platform.release()
            
            return config
            
        except json.JSONDecodeError as e:
            print(f"❌ Erro ao ler configuração: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Erro ao carregar configuração: {e}")
            sys.exit(1)
    
    def _setup_logging(self):
        """Configura sistema de logging"""
        log_config = self.config.get('logging', {})
        log_level = getattr(logging, log_config.get('level', 'INFO'))
        
        # Formato de log
        log_format = '%(asctime)s [%(levelname)s] %(message)s'
        date_format = '%Y-%m-%d %H:%M:%S'
        
        # Configurar handlers
        handlers = [logging.StreamHandler(sys.stdout)]
        
        # Log em arquivo se configurado
        if log_config.get('file'):
            handlers.append(logging.FileHandler(
                log_config['file'],
                encoding='utf-8'
            ))
        
        logging.basicConfig(
            level=log_level,
            format=log_format,
            datefmt=date_format,
            handlers=handlers
        )
        
        self.logger = logging.getLogger(__name__)
    
    def connect(self):
        """Conecta ao servidor WebSocket"""
        server_url = self.config['server']['url']
        max_reconnect = self.config['server'].get('max_reconnect_attempts', 10)
        
        self.logger.info(f"🔌 Conectando ao servidor: {server_url}")
        
        # Configurar WebSocket
        self.ws = websocket.WebSocketApp(
            server_url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )
        
        # Conectar em thread separada
        ws_thread = threading.Thread(target=self.ws.run_forever, daemon=True)
        ws_thread.start()
        
        # Aguardar conexão
        timeout = 10
        start_time = time.time()
        while not self.connected and (time.time() - start_time) < timeout:
            time.sleep(0.1)
        
        if not self.connected:
            self.logger.error("❌ Timeout ao conectar")
            if self.reconnect_attempts < max_reconnect:
                self.reconnect_attempts += 1
                delay = min(2 ** self.reconnect_attempts, 60)
                self.logger.info(f"🔄 Tentando reconectar em {delay}s (tentativa {self.reconnect_attempts}/{max_reconnect})")
                time.sleep(delay)
                self.connect()
            else:
                self.logger.error("❌ Número máximo de tentativas de reconexão atingido")
                self.stop()
    
    def _on_open(self, ws):
        """Callback quando conexão é estabelecida"""
        self.logger.info("Websocket connected")
        self.connected = True
        self.reconnect_attempts = 0
        self.logger.info("✅ Conexão estabelecida com sucesso!")
        
        # Autenticar
        self._authenticate()
    
    def _on_message(self, ws, message):
        """Callback quando mensagem é recebida"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            self.logger.debug(f"📨 Mensagem recebida: {msg_type}")
            
            if msg_type == 'welcome':
                self.logger.info(f"👋 {data.get('message', 'Bem-vindo!')}")
            
            elif msg_type == 'auth_success':
                self._on_auth_success(data)
            
            elif msg_type == 'auth_error':
                self.logger.error(f"❌ Erro de autenticação: {data.get('message')}")
                self.stop()
            
            elif msg_type == 'command':
                self._on_command(data)
            
            elif msg_type == 'pong':
                self.logger.debug("💓 Pong recebido")
            
            else:
                self.logger.warning(f"⚠️ Tipo de mensagem desconhecido: {msg_type}")
                
        except json.JSONDecodeError as e:
            self.logger.error(f"❌ Erro ao decodificar mensagem: {e}")
        except Exception as e:
            self.logger.error(f"❌ Erro ao processar mensagem: {e}")
    
    def _on_error(self, ws, error):
        """Callback quando erro ocorre"""
        self.logger.error(f"❌ Erro no WebSocket: {error}")
        self.connected = False
        self.authenticated = False
    
    def _on_close(self, ws, close_status_code, close_msg):
        """Callback quando conexão é fechada"""
        self.connected = False
        self.authenticated = False
        
        if close_status_code:
            self.logger.warning(
                f"🔌 Conexão fechada (código: {close_status_code}, "
                f"mensagem: {close_msg})"
            )
        else:
            self.logger.warning("🔌 Conexão fechada")
        
        # Parar heartbeat
        if self.heartbeat_thread and self.heartbeat_thread.is_alive():
            self.heartbeat_thread = None
    
    def _authenticate(self):
        """Envia autenticação ao servidor"""
        token = self.config['agent']['token']
        
        if not token or token == "SEU_TOKEN_AQUI_64_CARACTERES":
            self.logger.error("❌ Token não configurado! Edite config.json")
            self.stop()
            return
        
        auth_message = {
            'type': 'auth',
            'token': token
        }
        
        self.logger.info("🔐 Enviando autenticação...")
        self._send(auth_message)
    
    def _on_auth_success(self, data: Dict[str, Any]):
        """Callback quando autenticação é bem-sucedida"""
        self.authenticated = True
        agent_id = data.get('agentId')
        device_name = data.get('deviceName')
        
        self.logger.info("=" * 60)
        self.logger.info("✅ AUTENTICAÇÃO BEM-SUCEDIDA!")
        self.logger.info(f"   Agent ID: {agent_id}")
        self.logger.info(f"   Dispositivo: {device_name}")
        self.logger.info("=" * 60)
        
        # Iniciar heartbeat
        self._start_heartbeat()
        
        # Iniciar polling de comandos pendentes
        self._start_polling()
    
    def _start_heartbeat(self):
        """Inicia thread de heartbeat"""
        if self.heartbeat_thread and self.heartbeat_thread.is_alive():
            return
        
        interval = self.config['heartbeat']['interval']
        self.logger.info(f"💓 Iniciando heartbeat (intervalo: {interval}s)")
        
        self.heartbeat_thread = threading.Thread(
            target=self._heartbeat_loop,
            daemon=True
        )
        self.heartbeat_thread.start()
    
    def _heartbeat_loop(self):
        """Loop de heartbeat"""
        interval = self.config['heartbeat']['interval']
        
        while self.should_run and self.authenticated:
            try:
                time.sleep(interval)
                
                if not self.connected or not self.authenticated:
                    break
                
                # Enviar heartbeat
                heartbeat_message = {
                    'type': 'heartbeat',
                    'timestamp': int(time.time() * 1000)
                }
                
                self._send(heartbeat_message)
                self.logger.debug("💓 Heartbeat enviado")
                
            except Exception as e:
                self.logger.error(f"❌ Erro no heartbeat: {e}")
                break
    
    def _start_polling(self):
        """Inicia thread de polling de comandos pendentes"""
        if self.polling_thread and self.polling_thread.is_alive():
            return
        
        # Intervalo de polling: 10 segundos
        polling_interval = 10
        self.logger.info(f"🔄 Iniciando polling de comandos (intervalo: {polling_interval}s)")
        
        self.polling_thread = threading.Thread(
            target=self._polling_loop,
            args=(polling_interval,),
            daemon=True
        )
        self.polling_thread.start()
    
    def _polling_loop(self, interval: int):
        """Loop de polling de comandos pendentes"""
        while self.should_run and self.authenticated:
            try:
                time.sleep(interval)
                
                if not self.connected or not self.authenticated:
                    break
                
                # Solicitar comandos pendentes
                poll_message = {
                    'type': 'poll_commands',
                    'timestamp': int(time.time() * 1000)
                }
                
                self._send(poll_message)
                self.logger.debug("🔄 Polling de comandos enviado")
                
            except Exception as e:
                self.logger.error(f"❌ Erro no polling: {e}")
                break
    
    def _on_command(self, data: Dict[str, Any]):
        """Processa comando recebido do servidor"""
        command_id = data.get('commandId')
        command_type = data.get('commandType')
        command_data = data.get('commandData', {})
        
        self.logger.info(f"📋 Comando recebido: {command_type} (ID: {command_id})")
        self.logger.info(f"   Dados: {command_data}")
        
        # Enviar status "executing" antes de começar
        executing_message = {
            'type': 'command_status',
            'commandId': command_id,
            'status': 'executing'
        }
        self._send(executing_message)
        self.logger.info(f"⏳ Iniciando execução do comando {command_id}...")
        
        start_time = time.time()
        
        try:
            # Executar comando baseado no tipo
            if command_type == 'shell':
                result = self._execute_shell_command(command_data)
            elif command_type == 'screenshot':
                result = self._capture_screenshot(command_data)
            else:
                result = {
                    'success': False,
                    'error': f'Tipo de comando não suportado: {command_type}'
                }
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Enviar resultado
            result_message = {
                'type': 'command_result',
                'commandId': command_id,
                'success': result.get('success', False),
                'result': result.get('data', {}),
                'error': result.get('error'),
                'executionTimeMs': execution_time_ms
            }
            
            self._send(result_message)
            
            if result.get('success'):
                self.logger.info(f"✅ Comando {command_id} executado com sucesso ({execution_time_ms}ms)")
            else:
                self.logger.error(f"❌ Comando {command_id} falhou: {result.get('error')}")
                
        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            self.logger.error(f"❌ Erro ao executar comando {command_id}: {e}")
            
            # Enviar erro
            error_message = {
                'type': 'command_result',
                'commandId': command_id,
                'success': False,
                'error': str(e),
                'executionTimeMs': execution_time_ms
            }
            
            self._send(error_message)
    
    def _execute_shell_command(self, command_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executa comando shell
        
        Args:
            command_data: {
                'command': str,  # Comando a executar
                'timeout': int,  # Timeout em segundos (padrão: 30)
                'cwd': str       # Diretório de trabalho (opcional)
            }
        
        Returns:
            {
                'success': bool,
                'data': {
                    'stdout': str,
                    'stderr': str,
                    'returncode': int,
                    'command': str
                },
                'error': str (se falhou)
            }
        """
        command = command_data.get('command')
        timeout = command_data.get('timeout', 30)
        cwd = command_data.get('cwd')
        
        if not command:
            return {
                'success': False,
                'error': 'Comando não especificado'
            }
        
        self.logger.info(f"🔧 Executando comando shell: {command}")
        
        try:
            # Executar comando
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=cwd
            )
            
            stdout = result.stdout.strip()
            stderr = result.stderr.strip()
            returncode = result.returncode
            
            self.logger.info(f"   Return code: {returncode}")
            if stdout:
                self.logger.debug(f"   Stdout: {stdout[:200]}...")
            if stderr:
                self.logger.debug(f"   Stderr: {stderr[:200]}...")
            
            return {
                'success': returncode == 0,
                'data': {
                    'stdout': stdout,
                    'stderr': stderr,
                    'returncode': returncode,
                    'command': command
                },
                'error': stderr if returncode != 0 else None
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': f'Comando excedeu timeout de {timeout}s'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao executar comando: {str(e)}'
            }
    
    def _capture_screenshot(self, command_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Captura screenshot da tela
        
        Args:
            command_data: {
                'format': str,  # Formato da imagem (png, jpg) - padrão: png
                'quality': int  # Qualidade JPEG (1-100) - padrão: 85
            }
        
        Returns:
            {
                'success': bool,
                'data': {
                    'image_base64': str,  # Imagem em base64
                    'width': int,
                    'height': int,
                    'format': str,
                    'size_bytes': int
                },
                'error': str (se falhou)
            }
        """
        if not PILLOW_AVAILABLE:
            return {
                'success': False,
                'error': 'Pillow não está instalado. Execute: pip install Pillow'
            }
        
        image_format = command_data.get('format', 'png').lower()
        quality = command_data.get('quality', 85)
        
        self.logger.info(f"📸 Capturando screenshot (formato: {image_format})")
        
        try:
            # Capturar screenshot
            screenshot = ImageGrab.grab()
            
            # Converter para bytes
            from io import BytesIO
            buffer = BytesIO()
            
            if image_format == 'jpg' or image_format == 'jpeg':
                screenshot.save(buffer, format='JPEG', quality=quality)
            else:
                screenshot.save(buffer, format='PNG')
            
            image_bytes = buffer.getvalue()
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            width, height = screenshot.size
            size_bytes = len(image_bytes)
            
            self.logger.info(f"   Tamanho: {width}x{height}")
            self.logger.info(f"   Bytes: {size_bytes:,}")
            
            return {
                'success': True,
                'data': {
                    'image_base64': image_base64,
                    'width': width,
                    'height': height,
                    'format': image_format,
                    'size_bytes': size_bytes
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao capturar screenshot: {str(e)}'
            }
    
    def _send(self, message: Dict[str, Any]):
        """Envia mensagem para o servidor"""
        if not self.connected or not self.ws:
            self.logger.warning("⚠️ Não conectado. Mensagem não enviada.")
            return
        
        try:
            self.ws.send(json.dumps(message))
        except Exception as e:
            self.logger.error(f"❌ Erro ao enviar mensagem: {e}")
    
    def send_log(self, level: str, message: str, metadata: Optional[Dict] = None):
        """Envia log para o servidor"""
        log_message = {
            'type': 'log',
            'level': level,
            'message': message,
            'metadata': metadata or {}
        }
        
        self._send(log_message)
    
    def run(self):
        """Executa o agent em loop"""
        self.connect()
        
        try:
            # Manter agent rodando
            while self.should_run:
                time.sleep(1)
                
                # Verificar se ainda está conectado
                if not self.connected and self.should_run:
                    self.logger.warning("⚠️ Conexão perdida. Tentando reconectar...")
                    self.connect()
                    
        except KeyboardInterrupt:
            self.logger.info("\n🛑 Interrompido pelo usuário")
            self.stop()
    
    def stop(self):
        """Para o agent"""
        self.logger.info("🛑 Encerrando Desktop Agent...")
        self.should_run = False
        
        if self.ws:
            self.ws.close()
        
        self.logger.info("👋 Desktop Agent encerrado")


def print_banner():
    """Imprime banner do Desktop Agent"""
    banner = """
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🖥️  DESKTOP AGENT - CONTROLE REMOTO            ║
║                                                           ║
║  Conecta ao servidor e permite controle remoto do PC     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """
    print(banner)


def main():
    """Função principal"""
    print_banner()
    
    # Criar e executar agent
    agent = DesktopAgent()
    agent.run()


if __name__ == "__main__":
    main()

"""

# ============================================================================
# FUNÇÕES DO INSTALADOR
# ============================================================================

def print_header():
    """Exibe cabeçalho do instalador"""
    print()
    print("=" * 70)
    print("  INSTALADOR AUTOMÁTICO - DESKTOP AGENT")
    print("  Sistema de Automação Remota")
    print("=" * 70)
    print()

def check_python():
    """Verifica se Python está instalado"""
    print("[1/6] Verificando Python...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("  ❌ Python 3.7+ necessário")
        print(f"  Versão atual: {version.major}.{version.minor}")
        sys.exit(1)
    print(f"  ✓ Python {version.major}.{version.minor} encontrado")
    print()

def create_directories():
    """Cria diretórios necessários"""
    print("[2/6] Criando diretórios...")
    
    base_dir = Path.home() / "DesktopAgent"
    base_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"  ✓ Diretório criado: {base_dir}")
    print()
    return base_dir

def install_dependencies(base_dir):
    """Instala dependências Python"""
    print("[3/6] Instalando dependências...")
    
    dependencies = ['websockets', 'pillow', 'requests']
    
    for dep in dependencies:
        print(f"  - {dep}")
        try:
            subprocess.check_call(
                [sys.executable, '-m', 'pip', 'install', '--user', '--quiet', dep],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except subprocess.CalledProcessError:
            print(f"    ⚠️ Erro ao instalar {dep}, mas continuando...")
    
    print("  ✓ Dependências instaladas")
    print()

def extract_agent(base_dir):
    """Extrai código do agent embutido"""
    print("[4/6] Extraindo Desktop Agent...")
    
    agent_path = base_dir / "agent.py"
    
    # Escrever código do agent
    with open(agent_path, 'w', encoding='utf-8') as f:
        f.write(AGENT_CODE.strip())
    
    print(f"  ✓ Agent extraído: {agent_path}")
    print()
    return agent_path

def register_agent():
    """Registra agent no servidor e obtém token"""
    print("[5/6] Registrando no servidor...")
    
    SERVER_URL = "https://automacao-api-alejofy2.manus.space"
    
    # Dados do agent
    data = {
        "deviceName": platform.node(),
        "platform": f"{platform.system()} {platform.release()}",
        "version": "2.0"
    }
    
    try:
        # Fazer requisição POST
        req = urllib.request.Request(
            f"{SERVER_URL}/api/desktop-agent/register",
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'DesktopAgent-Installer/2.0'
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if result.get('success'):
                print(f"  ✓ Agent registrado (ID: {result['agentId']})")
                return result['token']
            else:
                print(f"  ❌ Erro: {result.get('message', 'Desconhecido')}")
                return None
                
    except Exception as e:
        print(f"  ❌ Erro ao registrar: {e}")
        return None

def create_config(base_dir, token):
    """Cria arquivo de configuração"""
    print("[6/6] Criando configuração...")
    
    if not token:
        print("  ❌ Token não obtido, usando configuração manual")
        token = "SEU_TOKEN_AQUI_64_CARACTERES"
    
    config = {
        "server": {
            "url": "wss://automacao-ws-alejofy2.manus.space",
            "max_reconnect_attempts": 10
        },
        "agent": {
            "token": token,
            "device_name": platform.node(),
            "platform": f"{platform.system()} {platform.release()}",
            "version": "2.0"
        },
        "heartbeat": {
            "interval": 30
        },
        "logging": {
            "level": "INFO",
            "file": "agent.log"
        }
    }
    
    config_path = base_dir / "config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"  ✓ Configuração criada: {config_path}")
    print()
    return config_path

def create_shortcuts(base_dir, agent_path):
    """Cria atalhos para iniciar o agent"""
    print("[7/7] Criando atalhos...")
    
    if platform.system() == "Windows":
        # Criar .bat na pasta do agent
        bat_path = base_dir / "Iniciar_Agent.bat"
        with open(bat_path, 'w') as f:
            f.write('@echo off\n')
            f.write('title Desktop Agent\n')
            f.write('cd /d "{}"\n'.format(base_dir))
            f.write('"{})" "{}"\n'.format(sys.executable, agent_path))
            f.write('pause\n')
        
        print(f"  ✓ Atalho criado: {bat_path}")
        
        # Criar atalho na área de trabalho
        try:
            desktop = Path.home() / "Desktop"
            if desktop.exists():
                desktop_bat = desktop / "Desktop_Agent.bat"
                with open(desktop_bat, 'w') as f:
                    f.write('@echo off\n')
                    f.write('cd /d "{}"\n'.format(base_dir))
                    f.write('"{})" "{}"\n'.format(sys.executable, agent_path))
                print(f"  ✓ Atalho criado na área de trabalho: {desktop_bat}")
        except Exception as e:
            print(f"  ⚠️ Não foi possível criar atalho na área de trabalho: {e}")
    else:
        # Criar .sh para Linux/Mac
        sh_path = base_dir / "start_agent.sh"
        with open(sh_path, 'w') as f:
            f.write('#!/bin/bash\n')
            f.write('cd "{}"\n'.format(base_dir))
            f.write('"{})" "{}"\n'.format(sys.executable, agent_path))
        
        os.chmod(sh_path, 0o755)
        print(f"  ✓ Script criado: {sh_path}")
    
    print()

def start_agent(agent_path):
    """Inicia o agent"""
    print("=" * 70)
    print("  INSTALAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 70)
    print()
    print("O Desktop Agent está pronto para uso!")
    print()
    print("Atalhos criados:")
    
    if platform.system() == "Windows":
        print("  - Área de trabalho: Desktop_Agent.bat")
        print(f"  - Pasta do agent: {Path(agent_path).parent / 'Iniciar_Agent.bat'}")
    else:
        print(f"  - Script: {Path(agent_path).parent / 'start_agent.sh'}")
    
    print()
    print()
    choice = input("Deseja iniciar o agent agora? [S/N]: ").strip().upper()
    
    if choice == "S":
        print()
        print("Iniciando Desktop Agent...")
        print("(Pressione Ctrl+C para parar)")
        print()
        
        try:
            subprocess.run([sys.executable, str(agent_path)])
        except KeyboardInterrupt:
            print()
            print("Agent parado pelo usuário")
        except Exception as e:
            print(f"Erro ao iniciar agent: {e}")
    else:
        print()
        print("Para iniciar o agent manualmente:")
        if platform.system() == "Windows":
            print("  - Clique duplo em Desktop_Agent.bat na área de trabalho")
        else:
            print(f"  - Execute: {Path(agent_path).parent / 'start_agent.sh'}")
        print()

def main():
    """Função principal do instalador"""
    try:
        print_header()
        check_python()
        base_dir = create_directories()
        install_dependencies(base_dir)
        agent_path = extract_agent(base_dir)
        token = register_agent()
        create_config(base_dir, token)
        create_shortcuts(base_dir, agent_path)
        start_agent(agent_path)
        
    except KeyboardInterrupt:
        print()
        print("Instalação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print()
        print(f"❌ Erro durante instalação: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
