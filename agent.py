#!/usr/bin/env python3
"""
Desktop Agent - Sistema de Automação Remota
Conecta ao servidor para receber e executar comandos remotamente
"""

import asyncio
import websockets
import json
import logging
import subprocess
import platform
import os
from datetime import datetime
from io import BytesIO
import base64

# Configuração
TOKEN = "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e"
SERVER_URL = "wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent"
DEVICE_NAME = platform.node()
PLATFORM = platform.system()
VERSION = "1.0.0"

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DesktopAgent:
    def __init__(self):
        self.ws = None
        self.agent_id = None
        self.running = True
        self.heartbeat_task = None
        
    async def connect(self):
        """Conectar ao servidor WebSocket"""
        try:
            logger.info(f"Conectando ao servidor: {SERVER_URL}")
            self.ws = await websockets.connect(SERVER_URL)
            logger.info("Conexão WebSocket estabelecida")
            
            # Enviar autenticação
            await self.authenticate()
            
            # Iniciar heartbeat
            self.heartbeat_task = asyncio.create_task(self.send_heartbeat())
            
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
        
        # Aguardar resposta de autenticação
        response = await self.ws.recv()
        data = json.loads(response)
        
        if data.get("type") == "auth_success":
            self.agent_id = data.get("agent_id")
            logger.info(f"Autenticação bem-sucedida! Agent ID: {self.agent_id}")
        else:
            logger.error(f"Falha na autenticação: {data.get('message')}")
            raise Exception("Autenticação falhou")
    
    async def send_heartbeat(self):
        """Enviar heartbeat a cada 30 segundos"""
        while self.running:
            try:
                await asyncio.sleep(30)
                if self.ws and not self.ws.closed:
                    await self.ws.send(json.dumps({"type": "ping"}))
                    logger.debug("Heartbeat enviado")
            except Exception as e:
                logger.error(f"Erro ao enviar heartbeat: {e}")
                break
    
    async def process_messages(self):
        """Processar mensagens recebidas do servidor"""
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")
                    
                    if msg_type == "pong":
                        logger.debug("Pong recebido")
                    
                    elif msg_type == "command":
                        await self.execute_command(data)
                    
                    else:
                        logger.warning(f"Tipo de mensagem desconhecido: {msg_type}")
                
                except json.JSONDecodeError:
                    logger.error(f"Mensagem inválida recebida: {message}")
                except Exception as e:
                    logger.error(f"Erro ao processar mensagem: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Conexão WebSocket fechada")
            if self.running:
                await asyncio.sleep(5)
                await self.connect()
    
    async def execute_command(self, command_data):
        """Executar comando recebido"""
        command_id = command_data.get("command_id")
        command_type = command_data.get("command_type")
        command_params = command_data.get("command_data", {})
        
        logger.info(f"Executando comando {command_id}: {command_type}")
        
        try:
            # Enviar status "executing"
            await self.send_command_status(command_id, "executing")
            
            result = None
            
            if command_type == "shell":
                result = await self.execute_shell(command_params)
            
            elif command_type == "screenshot":
                result = await self.take_screenshot(command_params)
            
            else:
                result = {"error": f"Tipo de comando não suportado: {command_type}"}
            
            # Enviar resultado
            await self.send_command_result(command_id, result)
            
        except Exception as e:
            logger.error(f"Erro ao executar comando {command_id}: {e}")
            await self.send_command_result(command_id, {"error": str(e)}, failed=True)
    
    async def execute_shell(self, params):
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
    
    async def take_screenshot(self, params):
        """Capturar screenshot"""
        try:
            from PIL import ImageGrab
            
            logger.info("Capturando screenshot...")
            
            # Capturar screenshot
            screenshot = ImageGrab.grab()
            
            # Converter para base64
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
    
    async def send_command_status(self, command_id, status):
        """Enviar status de execução do comando"""
        message = {
            "type": "command_status",
            "command_id": command_id,
            "status": status
        }
        
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(message))
            logger.info(f"Status enviado para comando {command_id}: {status}")
    
    async def send_command_result(self, command_id, result, failed=False):
        """Enviar resultado de execução do comando"""
        message = {
            "type": "command_result",
            "command_id": command_id,
            "result": result,
            "status": "failed" if failed else "completed"
        }
        
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(message))
            logger.info(f"Resultado enviado para comando {command_id}")
    
    async def shutdown(self):
        """Desligar agent graciosamente"""
        logger.info("Desligando Desktop Agent...")
        self.running = False
        
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        
        if self.ws:
            await self.ws.close()
        
        logger.info("Desktop Agent desligado")

async def main():
    """Função principal"""
    agent = DesktopAgent()
    
    try:
        await agent.connect()
    except KeyboardInterrupt:
        logger.info("Interrompido pelo usuário")
    finally:
        await agent.shutdown()

if __name__ == "__main__":
    print("=" * 50)
    print("DESKTOP AGENT - Sistema de Automação Remota")
    print("=" * 50)
    print(f"Device: {DEVICE_NAME}")
    print(f"Platform: {PLATFORM}")
    print(f"Version: {VERSION}")
    print(f"Server: {SERVER_URL}")
    print("=" * 50)
    print()
    
    asyncio.run(main())
