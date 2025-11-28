#!/usr/bin/env python3
"""
Desktop Agent v2.0 - Sistema de Automação Remota com Auto-Update
Arquitetura modular com plugin system e hot reload
"""

import asyncio
import websockets
import json
import logging
import subprocess
import platform
import os
import sys
import hashlib
import importlib
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, Any, Optional, List
import base64

# ==================== CONFIGURAÇÃO ====================
VERSION = "2.0.0"
TOKEN = "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e"
SERVER_URL = "wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent"
DEVICE_NAME = platform.node()
PLATFORM = platform.system()

# Diretórios
AGENT_DIR = Path(__file__).parent
PLUGINS_DIR = AGENT_DIR / "plugins"
CACHE_DIR = AGENT_DIR / "cache"
LOGS_DIR = AGENT_DIR / "logs"

# Criar diretórios se não existirem
for dir_path in [PLUGINS_DIR, CACHE_DIR, LOGS_DIR]:
    dir_path.mkdir(exist_ok=True)

# ==================== LOGGING ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / 'agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==================== PLUGIN SYSTEM ====================
class PluginManager:
    """Gerenciador de plugins para comandos extensíveis"""
    
    def __init__(self):
        self.plugins: Dict[str, Any] = {}
        self.command_handlers: Dict[str, callable] = {}
        
    def load_plugins(self):
        """Carrega todos os plugins do diretório de plugins"""
        logger.info("Carregando plugins...")
        
        # Adicionar diretório de plugins ao path
        if str(PLUGINS_DIR) not in sys.path:
            sys.path.insert(0, str(PLUGINS_DIR))
        
        # Carregar plugins Python
        for plugin_file in PLUGINS_DIR.glob("*.py"):
            if plugin_file.name.startswith("_"):
                continue
                
            try:
                plugin_name = plugin_file.stem
                module = importlib.import_module(plugin_name)
                
                if hasattr(module, "register"):
                    self.plugins[plugin_name] = module
                    module.register(self)
                    logger.info(f"✓ Plugin carregado: {plugin_name}")
                else:
                    logger.warning(f"⚠ Plugin {plugin_name} não tem função register()")
                    
            except Exception as e:
                logger.error(f"✗ Erro ao carregar plugin {plugin_file.name}: {e}")
        
        logger.info(f"Total de plugins carregados: {len(self.plugins)}")
    
    def register_command(self, command_type: str, handler: callable):
        """Registra um handler para um tipo de comando"""
        self.command_handlers[command_type] = handler
        logger.debug(f"Comando registrado: {command_type}")
    
    async def execute_command(self, command_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Executa um comando usando o handler apropriado"""
        if command_type not in self.command_handlers:
            return {"error": f"Comando não suportado: {command_type}"}
        
        try:
            handler = self.command_handlers[command_type]
            result = await handler(params)
            return result
        except Exception as e:
            logger.error(f"Erro ao executar comando {command_type}: {e}")
            return {"error": str(e)}

# ==================== AUTO-UPDATE SYSTEM ====================
class AutoUpdater:
    """Sistema de auto-atualização do agent"""
    
    def __init__(self, current_version: str, server_url: str):
        self.current_version = current_version
        self.server_url = server_url.replace("wss://", "https://").replace("ws://", "http://")
        self.update_check_interval = 21600  # 6 horas
        
    async def check_for_updates(self) -> Optional[Dict[str, Any]]:
        """Verifica se há atualizações disponíveis"""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.server_url}/api/agent/latest-version") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        latest_version = data.get("version")
                        
                        if self._is_newer_version(latest_version, self.current_version):
                            logger.info(f"🔔 Nova versão disponível: {latest_version} (atual: {self.current_version})")
                            return data
                        else:
                            logger.debug(f"Versão atual ({self.current_version}) está atualizada")
                            return None
        except Exception as e:
            logger.error(f"Erro ao verificar atualizações: {e}")
            return None
    
    def _is_newer_version(self, latest: str, current: str) -> bool:
        """Compara versões semânticas"""
        try:
            latest_parts = [int(x) for x in latest.split(".")]
            current_parts = [int(x) for x in current.split(".")]
            return latest_parts > current_parts
        except:
            return False
    
    async def download_and_install(self, update_info: Dict[str, Any]) -> bool:
        """Baixa e instala atualização"""
        try:
            import aiohttp
            
            download_url = update_info.get("download_url")
            expected_hash = update_info.get("file_hash")
            
            logger.info(f"Baixando atualização de {download_url}...")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(download_url) as resp:
                    if resp.status == 200:
                        content = await resp.read()
                        
                        # Verificar integridade
                        actual_hash = hashlib.sha256(content).hexdigest()
                        if actual_hash != expected_hash:
                            logger.error("❌ Hash inválido! Atualização cancelada.")
                            return False
                        
                        # Salvar nova versão
                        new_agent_path = AGENT_DIR / "agent_new.py"
                        with open(new_agent_path, "wb") as f:
                            f.write(content)
                        
                        logger.info("✓ Atualização baixada com sucesso")
                        
                        # Hot reload: substituir arquivo atual
                        current_file = Path(__file__)
                        backup_file = AGENT_DIR / f"agent_backup_{self.current_version}.py"
                        
                        # Fazer backup da versão atual
                        current_file.rename(backup_file)
                        
                        # Mover nova versão para o lugar
                        new_agent_path.rename(current_file)
                        
                        logger.info("✓ Atualização instalada! Reiniciando...")
                        
                        # Reiniciar agent
                        os.execv(sys.executable, [sys.executable] + sys.argv)
                        
                        return True
        except Exception as e:
            logger.error(f"Erro ao instalar atualização: {e}")
            return False

# ==================== TELEMETRY ====================
class TelemetryCollector:
    """Coleta métricas de performance e saúde"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.command_count = 0
        self.error_count = 0
    
    async def collect_metrics(self) -> Dict[str, Any]:
        """Coleta métricas atuais"""
        try:
            import psutil
            
            uptime = (datetime.now() - self.start_time).total_seconds()
            
            return {
                "cpu_usage": psutil.cpu_percent(interval=1),
                "memory_usage": psutil.virtual_memory().percent,
                "uptime_seconds": int(uptime),
                "command_count": self.command_count,
                "error_count": self.error_count,
            }
        except ImportError:
            logger.warning("psutil não instalado. Telemetria limitada.")
            return {
                "uptime_seconds": int((datetime.now() - self.start_time).total_seconds()),
                "command_count": self.command_count,
                "error_count": self.error_count,
            }

# ==================== DESKTOP AGENT ====================
class DesktopAgent:
    def __init__(self):
        self.ws = None
        self.agent_id = None
        self.running = True
        self.heartbeat_task = None
        self.update_check_task = None
        
        # Componentes modulares
        self.plugin_manager = PluginManager()
        self.updater = AutoUpdater(VERSION, SERVER_URL)
        self.telemetry = TelemetryCollector()
        
    async def initialize(self):
        """Inicializa componentes do agent"""
        logger.info("Inicializando Desktop Agent v2.0...")
        
        # Carregar plugins
        self.plugin_manager.load_plugins()
        
        # Registrar comandos core
        self._register_core_commands()
        
        logger.info("✓ Inicialização completa")
    
    def _register_core_commands(self):
        """Registra comandos principais do sistema"""
        self.plugin_manager.register_command("shell", self.execute_shell)
        self.plugin_manager.register_command("screenshot", self.take_screenshot)
        self.plugin_manager.register_command("get_metrics", self.get_metrics)
        self.plugin_manager.register_command("update_check", self.check_updates)
    
    async def connect(self):
        """Conectar ao servidor WebSocket"""
        try:
            logger.info(f"Conectando ao servidor: {SERVER_URL}")
            self.ws = await websockets.connect(SERVER_URL)
            logger.info("✓ Conexão WebSocket estabelecida")
            
            # Enviar autenticação
            await self.authenticate()
            
            # Iniciar tarefas em background
            self.heartbeat_task = asyncio.create_task(self.send_heartbeat())
            self.update_check_task = asyncio.create_task(self.auto_update_loop())
            
            # Processar mensagens
            await self.process_messages()
            
        except Exception as e:
            logger.error(f"Erro na conexão: {e}")
            await asyncio.sleep(5)
            if self.running:
                await self.connect()
    
    async def authenticate(self):
        """Autenticar com o servidor"""
        auth_message = {
            "type": "auth",
            "token": TOKEN,
            "device_name": DEVICE_NAME,
            "platform": PLATFORM,
            "version": VERSION
        }
        
        await self.ws.send(json.dumps(auth_message))
        logger.info("Mensagem de autenticação enviada")
        
        # Aguardar resposta
        response = await self.ws.recv()
        data = json.loads(response)
        
        if data.get("type") == "auth_success":
            self.agent_id = data.get("agent_id")
            logger.info(f"✓ Autenticação bem-sucedida! Agent ID: {self.agent_id}")
        else:
            logger.error(f"✗ Falha na autenticação: {data.get('message')}")
            raise Exception("Autenticação falhou")
    
    async def send_heartbeat(self):
        """Enviar heartbeat com telemetria"""
        while self.running:
            try:
                await asyncio.sleep(30)
                if self.ws and not self.ws.closed:
                    metrics = await self.telemetry.collect_metrics()
                    
                    await self.ws.send(json.dumps({
                        "type": "heartbeat",
                        "metrics": metrics,
                        "plugins": list(self.plugin_manager.plugins.keys())
                    }))
                    logger.debug("Heartbeat enviado")
            except Exception as e:
                logger.error(f"Erro ao enviar heartbeat: {e}")
                break
    
    async def auto_update_loop(self):
        """Loop de verificação automática de atualizações"""
        while self.running:
            try:
                await asyncio.sleep(self.updater.update_check_interval)
                
                update_info = await self.updater.check_for_updates()
                if update_info:
                    # Notificar servidor
                    await self.ws.send(json.dumps({
                        "type": "update_available",
                        "current_version": VERSION,
                        "latest_version": update_info.get("version")
                    }))
                    
                    # Auto-instalar se configurado
                    # await self.updater.download_and_install(update_info)
                    
            except Exception as e:
                logger.error(f"Erro no auto-update loop: {e}")
    
    async def process_messages(self):
        """Processar mensagens recebidas"""
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")
                    
                    if msg_type == "pong":
                        logger.debug("Pong recebido")
                    
                    elif msg_type == "command":
                        await self.handle_command(data)
                    
                    elif msg_type == "install_plugin":
                        await self.install_plugin(data)
                    
                    elif msg_type == "force_update":
                        await self.force_update(data)
                    
                    else:
                        logger.warning(f"Tipo de mensagem desconhecido: {msg_type}")
                
                except json.JSONDecodeError:
                    logger.error(f"Mensagem inválida: {message}")
                except Exception as e:
                    logger.error(f"Erro ao processar mensagem: {e}")
                    self.telemetry.error_count += 1
        
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Conexão WebSocket fechada")
            if self.running:
                await asyncio.sleep(5)
                await self.connect()
    
    async def handle_command(self, command_data: Dict[str, Any]):
        """Executar comando recebido"""
        command_id = command_data.get("command_id")
        command_type = command_data.get("command_type")
        command_params = command_data.get("command_data", {})
        
        logger.info(f"Executando comando {command_id}: {command_type}")
        
        try:
            # Enviar status "executing"
            await self.send_command_status(command_id, "executing")
            
            # Executar via plugin manager
            result = await self.plugin_manager.execute_command(command_type, command_params)
            
            # Enviar resultado
            await self.send_command_result(command_id, result)
            
            self.telemetry.command_count += 1
            
        except Exception as e:
            logger.error(f"Erro ao executar comando {command_id}: {e}")
            await self.send_command_result(command_id, {"error": str(e)}, failed=True)
            self.telemetry.error_count += 1
    
    # ==================== COMANDOS CORE ====================
    
    async def execute_shell(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Executar comando shell"""
        command = params.get("command", "")
        cwd = params.get("cwd")
        timeout = params.get("timeout", 30)
        
        logger.info(f"Executando shell: {command}")
        
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd
            )
            
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout
                )
                
                return {
                    "stdout": stdout.decode('utf-8', errors='ignore'),
                    "stderr": stderr.decode('utf-8', errors='ignore'),
                    "exit_code": process.returncode
                }
            
            except asyncio.TimeoutError:
                process.kill()
                return {"error": f"Comando excedeu timeout de {timeout}s"}
        
        except Exception as e:
            return {"error": str(e)}
    
    async def take_screenshot(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Capturar screenshot"""
        try:
            from PIL import ImageGrab
            
            logger.info("Capturando screenshot...")
            
            screenshot = ImageGrab.grab()
            
            buffered = BytesIO()
            screenshot.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            
            return {
                "image_base64": img_base64,
                "width": screenshot.width,
                "height": screenshot.height,
                "format": "PNG"
            }
        
        except ImportError:
            return {"error": "Pillow não instalado. Execute: pip install pillow"}
        except Exception as e:
            return {"error": str(e)}
    
    async def get_metrics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Retornar métricas de telemetria"""
        return await self.telemetry.collect_metrics()
    
    async def check_updates(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Verificar atualizações manualmente"""
        update_info = await self.updater.check_for_updates()
        if update_info:
            return {
                "update_available": True,
                "current_version": VERSION,
                "latest_version": update_info.get("version"),
                "changelog": update_info.get("changelog")
            }
        else:
            return {
                "update_available": False,
                "current_version": VERSION
            }
    
    # ==================== PLUGIN MANAGEMENT ====================
    
    async def install_plugin(self, plugin_data: Dict[str, Any]):
        """Instalar novo plugin remotamente"""
        try:
            plugin_name = plugin_data.get("name")
            plugin_code = plugin_data.get("code")
            
            logger.info(f"Instalando plugin: {plugin_name}")
            
            # Salvar plugin
            plugin_file = PLUGINS_DIR / f"{plugin_name}.py"
            with open(plugin_file, "w") as f:
                f.write(plugin_code)
            
            # Carregar plugin
            module = importlib.import_module(plugin_name)
            if hasattr(module, "register"):
                self.plugin_manager.plugins[plugin_name] = module
                module.register(self.plugin_manager)
                
                logger.info(f"✓ Plugin {plugin_name} instalado com sucesso")
                
                await self.ws.send(json.dumps({
                    "type": "plugin_installed",
                    "plugin_name": plugin_name,
                    "success": True
                }))
            else:
                raise Exception("Plugin não tem função register()")
                
        except Exception as e:
            logger.error(f"Erro ao instalar plugin: {e}")
            await self.ws.send(json.dumps({
                "type": "plugin_installed",
                "plugin_name": plugin_data.get("name"),
                "success": False,
                "error": str(e)
            }))
    
    async def force_update(self, update_data: Dict[str, Any]):
        """Forçar atualização do agent"""
        logger.info("Atualização forçada recebida do servidor")
        success = await self.updater.download_and_install(update_data)
        
        if not success:
            await self.ws.send(json.dumps({
                "type": "update_failed",
                "error": "Falha ao instalar atualização"
            }))
    
    # ==================== HELPERS ====================
    
    async def send_command_status(self, command_id: str, status: str):
        """Enviar status de comando"""
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps({
                "type": "command_status",
                "command_id": command_id,
                "status": status
            }))
    
    async def send_command_result(self, command_id: str, result: Dict[str, Any], failed: bool = False):
        """Enviar resultado de comando"""
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps({
                "type": "command_result",
                "command_id": command_id,
                "result": result,
                "status": "failed" if failed else "completed"
            }))
    
    async def shutdown(self):
        """Desligar agent"""
        logger.info("Desligando Desktop Agent...")
        self.running = False
        
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        
        if self.update_check_task:
            self.update_check_task.cancel()
        
        if self.ws:
            await self.ws.close()
        
        logger.info("✓ Desktop Agent desligado")

# ==================== MAIN ====================
async def main():
    """Função principal"""
    agent = DesktopAgent()
    
    try:
        await agent.initialize()
        await agent.connect()
    except KeyboardInterrupt:
        logger.info("Interrompido pelo usuário")
    finally:
        await agent.shutdown()

if __name__ == "__main__":
    print("=" * 60)
    print("DESKTOP AGENT v2.0 - Sistema de Automação Remota")
    print("=" * 60)
    print(f"Device: {DEVICE_NAME}")
    print(f"Platform: {PLATFORM}")
    print(f"Version: {VERSION}")
    print(f"Server: {SERVER_URL}")
    print("=" * 60)
    print()
    
    asyncio.run(main())
