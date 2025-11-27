#!/usr/bin/env python3
"""
Desktop Agent - Cliente Python para Controle Remoto
Conecta ao servidor WebSocket e executa comandos remotamente
"""

import json
import logging
import platform
import socket
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

import websocket


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
        
        self.logger.info(f"🔌 Conectando ao servidor: {server_url}")
        
        # Configurar WebSocket
        self.ws = websocket.WebSocketApp(
            server_url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close
        )
        
        # Executar em thread separada
        ws_thread = threading.Thread(target=self._run_websocket, daemon=True)
        ws_thread.start()
    
    def _run_websocket(self):
        """Executa o WebSocket em loop"""
        while self.should_run:
            try:
                self.ws.run_forever()
                
                # Se desconectou, tentar reconectar
                if self.should_run:
                    self._handle_reconnect()
                    
            except Exception as e:
                self.logger.error(f"❌ Erro no WebSocket: {e}")
                if self.should_run:
                    self._handle_reconnect()
    
    def _handle_reconnect(self):
        """Gerencia reconexão automática"""
        max_attempts = self.config['server'].get('max_reconnect_attempts', 10)
        interval = self.config['server'].get('reconnect_interval', 5)
        
        self.reconnect_attempts += 1
        
        if self.reconnect_attempts > max_attempts:
            self.logger.error(f"❌ Máximo de tentativas de reconexão atingido ({max_attempts})")
            self.stop()
            return
        
        self.logger.warning(
            f"🔄 Tentando reconectar em {interval}s "
            f"(tentativa {self.reconnect_attempts}/{max_attempts})"
        )
        time.sleep(interval)
    
    def _on_open(self, ws):
        """Callback quando conexão é estabelecida"""
        self.connected = True
        self.reconnect_attempts = 0
        self.logger.info("✅ Conexão estabelecida com sucesso!")
        
        # Enviar autenticação
        self._authenticate()
    
    def _on_message(self, ws, message: str):
        """Callback quando mensagem é recebida"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            self.logger.debug(f"📥 Mensagem recebida: {msg_type}")
            
            # Processar mensagem
            if msg_type == 'welcome':
                self.logger.info(f"👋 {data.get('message')}")
            
            elif msg_type == 'auth_success':
                self._on_auth_success(data)
            
            elif msg_type == 'heartbeat_ack':
                self.logger.debug("💓 Heartbeat ACK recebido")
            
            elif msg_type == 'command':
                self._on_command(data)
            
            elif msg_type == 'error':
                self.logger.error(f"❌ Erro do servidor: {data.get('error')}")
                if not self.authenticated:
                    self.logger.error("❌ Falha na autenticação. Verifique seu token.")
                    self.stop()
            
            else:
                self.logger.warning(f"⚠️ Tipo de mensagem desconhecido: {msg_type}")
                
        except json.JSONDecodeError:
            self.logger.error(f"❌ Mensagem inválida recebida: {message}")
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
    
    def _on_command(self, data: Dict[str, Any]):
        """Processa comando recebido do servidor"""
        command_id = data.get('commandId')
        command_type = data.get('commandType')
        command_data = data.get('commandData', {})
        
        self.logger.info(f"📋 Comando recebido: {command_type} (ID: {command_id})")
        
        # Por enquanto, apenas logar o comando
        # Nas próximas fases, vamos implementar a execução
        self.logger.info(f"   Tipo: {command_type}")
        self.logger.info(f"   Dados: {command_data}")
        
        # Enviar resultado de sucesso (por enquanto)
        result_message = {
            'type': 'command_result',
            'commandId': command_id,
            'success': True,
            'result': {
                'message': f'Comando {command_type} recebido (execução não implementada ainda)',
                'timestamp': datetime.now().isoformat()
            },
            'executionTimeMs': 0
        }
        
        self._send(result_message)
        self.logger.info(f"✅ Resultado enviado para comando {command_id}")
    
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
            # Manter vivo
            while self.should_run:
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.logger.info("\n⚠️ Interrupção detectada (Ctrl+C)")
            self.stop()
    
    def stop(self):
        """Para o agent gracefully"""
        self.logger.info("🛑 Parando Desktop Agent...")
        self.should_run = False
        
        if self.ws:
            self.ws.close()
        
        self.logger.info("👋 Desktop Agent finalizado")
        sys.exit(0)


def main():
    """Função principal"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🖥️  DESKTOP AGENT - CONTROLE REMOTO            ║
║                                                           ║
║  Conecta ao servidor e permite controle remoto do PC     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Criar agent
    agent = DesktopAgent()
    
    # Executar
    agent.run()


if __name__ == "__main__":
    main()
