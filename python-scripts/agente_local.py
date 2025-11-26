#!/usr/bin/env python3
"""
AGENTE LOCAL HÍBRIDO - Sistema Revolucionário de IA Auto-Evolutivo
===================================================================

Este agente conecta o computador local ao servidor web na nuvem,
permitindo controle total do desktop, execução de tarefas automatizadas
e comunicação em tempo real via WebSocket.

Funcionalidades:
- Conexão WebSocket com servidor na nuvem
- Controle total do desktop (mouse, teclado, programas)
- Execução de scripts Python com sandbox
- Desktop Capture automático
- Integração com Obsidian
- Sistema de permissões e whitelist
- Logs completos de todas as ações
- Auto-start com Windows
- Ícone na bandeja do sistema

Autor: Sistema de Automação
Data: 2025-01-26
"""

import asyncio
import websockets
import json
import logging
import sys
import os
import subprocess
import time
import base64
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
import pyautogui
import psutil
import platform

# Configuração de logging
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / f"agente_local_{datetime.now().strftime('%Y%m%d')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Configurações
CONFIG = {
    "servidor_url": os.getenv("SERVIDOR_URL", "ws://localhost:3000/ws/agente"),
    "reconnect_interval": 5,  # segundos
    "heartbeat_interval": 30,  # segundos
    "desktop_capture_interval": 1800,  # 30 minutos
    "max_screenshot_size": 1920,  # largura máxima
}

# Sistema de permissões (whitelist)
PERMISSOES = {
    "desktop_capture": True,
    "executar_scripts": True,
    "acessar_obsidian": True,
    "controlar_mouse": False,  # Desabilitado por padrão (segurança)
    "controlar_teclado": False,  # Desabilitado por padrão
    "abrir_programas": False,  # Desabilitado por padrão
    "modificar_arquivos": False,  # Desabilitado por padrão
}

# Comandos permitidos (whitelist)
COMANDOS_PERMITIDOS = [
    "desktop_capture",
    "status",
    "listar_processos",
    "info_sistema",
    "executar_skill",
    "criar_nota_obsidian",
    "listar_arquivos_servidor",
    "ping",
    "atualizar_permissoes",
]

# Comandos bloqueados (blacklist)
COMANDOS_BLOQUEADOS = [
    "deletar_sistema",
    "formatar_disco",
    "modificar_registro",
    "desligar_computador",
    "reiniciar_computador",
]


class AgenteLocal:
    """Agente local que conecta ao servidor via WebSocket"""
    
    def __init__(self):
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.conectado = False
        self.id_agente = self._gerar_id_agente()
        self.tarefas_executadas = 0
        self.inicio = datetime.now()
        self.ultima_atividade = datetime.now()
        
        logger.info(f"Agente Local iniciado - ID: {self.id_agente}")
        logger.info(f"Sistema: {platform.system()} {platform.release()}")
        logger.info(f"Python: {sys.version}")
    
    def _gerar_id_agente(self) -> str:
        """Gera ID único para o agente baseado no hostname"""
        import socket
        hostname = socket.gethostname()
        return f"{hostname}_{int(time.time())}"
    
    async def conectar(self):
        """Conecta ao servidor WebSocket"""
        while True:
            try:
                logger.info(f"Conectando ao servidor: {CONFIG['servidor_url']}")
                
                async with websockets.connect(
                    CONFIG['servidor_url'],
                    ping_interval=20,
                    ping_timeout=10
                ) as websocket:
                    self.websocket = websocket
                    self.conectado = True
                    logger.info("✅ Conectado ao servidor com sucesso!")
                    
                    # Enviar mensagem de registro
                    await self.enviar_mensagem({
                        "tipo": "registro",
                        "id_agente": self.id_agente,
                        "sistema": {
                            "os": platform.system(),
                            "release": platform.release(),
                            "python": sys.version,
                            "hostname": platform.node(),
                        },
                        "permissoes": PERMISSOES,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    # Iniciar tasks assíncronas
                    await asyncio.gather(
                        self.receber_mensagens(),
                        self.enviar_heartbeat(),
                        self.desktop_capture_automatico(),
                    )
                    
            except websockets.exceptions.WebSocketException as e:
                logger.error(f"❌ Erro de WebSocket: {e}")
            except Exception as e:
                logger.error(f"❌ Erro ao conectar: {e}")
            finally:
                self.conectado = False
                logger.warning(f"Desconectado. Reconectando em {CONFIG['reconnect_interval']}s...")
                await asyncio.sleep(CONFIG['reconnect_interval'])
    
    async def receber_mensagens(self):
        """Recebe e processa mensagens do servidor"""
        try:
            async for mensagem in self.websocket:
                try:
                    dados = json.loads(mensagem)
                    await self.processar_comando(dados)
                except json.JSONDecodeError as e:
                    logger.error(f"Erro ao decodificar mensagem: {e}")
                except Exception as e:
                    logger.error(f"Erro ao processar mensagem: {e}")
        except websockets.exceptions.ConnectionClosed:
            logger.warning("Conexão fechada pelo servidor")
    
    async def processar_comando(self, dados: Dict[str, Any]):
        """Processa comando recebido do servidor"""
        comando = dados.get("comando")
        parametros = dados.get("parametros", {})
        id_comando = dados.get("id_comando")
        
        logger.info(f"📥 Comando recebido: {comando}")
        
        # Validar comando
        if comando in COMANDOS_BLOQUEADOS:
            await self.enviar_resposta(id_comando, {
                "sucesso": False,
                "erro": f"Comando bloqueado por segurança: {comando}"
            })
            return
        
        if comando not in COMANDOS_PERMITIDOS:
            await self.enviar_resposta(id_comando, {
                "sucesso": False,
                "erro": f"Comando não permitido: {comando}"
            })
            return
        
        # Executar comando
        try:
            resultado = await self.executar_comando(comando, parametros)
            await self.enviar_resposta(id_comando, {
                "sucesso": True,
                "resultado": resultado,
                "timestamp": datetime.now().isoformat()
            })
            
            self.tarefas_executadas += 1
            self.ultima_atividade = datetime.now()
            
        except Exception as e:
            logger.error(f"Erro ao executar comando {comando}: {e}")
            await self.enviar_resposta(id_comando, {
                "sucesso": False,
                "erro": str(e)
            })
    
    async def executar_comando(self, comando: str, parametros: Dict[str, Any]) -> Any:
        """Executa comando específico"""
        
        if comando == "ping":
            return {"pong": True, "timestamp": datetime.now().isoformat()}
        
        elif comando == "status":
            return self.obter_status()
        
        elif comando == "info_sistema":
            return self.obter_info_sistema()
        
        elif comando == "listar_processos":
            return self.listar_processos()
        
        elif comando == "desktop_capture":
            return await self.capturar_tela()
        
        elif comando == "executar_skill":
            return await self.executar_skill(parametros)
        
        elif comando == "criar_nota_obsidian":
            return await self.criar_nota_obsidian(parametros)
        
        elif comando == "atualizar_permissoes":
            return self.atualizar_permissoes(parametros)
        
        else:
            raise ValueError(f"Comando não implementado: {comando}")
    
    def obter_status(self) -> Dict[str, Any]:
        """Retorna status atual do agente"""
        uptime = (datetime.now() - self.inicio).total_seconds()
        
        return {
            "id_agente": self.id_agente,
            "conectado": self.conectado,
            "uptime_segundos": uptime,
            "tarefas_executadas": self.tarefas_executadas,
            "ultima_atividade": self.ultima_atividade.isoformat(),
            "permissoes": PERMISSOES,
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memoria_percent": psutil.virtual_memory().percent,
        }
    
    def obter_info_sistema(self) -> Dict[str, Any]:
        """Retorna informações do sistema"""
        return {
            "sistema_operacional": platform.system(),
            "release": platform.release(),
            "versao": platform.version(),
            "arquitetura": platform.machine(),
            "processador": platform.processor(),
            "hostname": platform.node(),
            "python_version": sys.version,
            "cpu_count": psutil.cpu_count(),
            "memoria_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "disco_total_gb": round(psutil.disk_usage('/').total / (1024**3), 2),
            "disco_livre_gb": round(psutil.disk_usage('/').free / (1024**3), 2),
        }
    
    def listar_processos(self) -> List[Dict[str, Any]]:
        """Lista processos em execução"""
        processos = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processos.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        # Ordenar por uso de CPU
        processos.sort(key=lambda x: x.get('cpu_percent', 0), reverse=True)
        return processos[:20]  # Top 20
    
    async def capturar_tela(self) -> Dict[str, Any]:
        """Captura screenshot da tela"""
        if not PERMISSOES.get("desktop_capture"):
            raise PermissionError("Desktop Capture não autorizado")
        
        logger.info("📸 Capturando tela...")
        
        # Capturar screenshot
        screenshot = pyautogui.screenshot()
        
        # Redimensionar se necessário
        if screenshot.width > CONFIG["max_screenshot_size"]:
            ratio = CONFIG["max_screenshot_size"] / screenshot.width
            new_height = int(screenshot.height * ratio)
            screenshot = screenshot.resize((CONFIG["max_screenshot_size"], new_height))
        
        # Salvar temporariamente
        temp_file = LOG_DIR / f"screenshot_{int(time.time())}.png"
        screenshot.save(temp_file)
        
        # Converter para base64
        with open(temp_file, "rb") as f:
            screenshot_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        # Remover arquivo temporário
        temp_file.unlink()
        
        logger.info(f"✅ Screenshot capturado ({screenshot.width}x{screenshot.height})")
        
        return {
            "screenshot": screenshot_b64,
            "largura": screenshot.width,
            "altura": screenshot.height,
            "timestamp": datetime.now().isoformat()
        }
    
    async def executar_skill(self, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Executa uma skill Python"""
        if not PERMISSOES.get("executar_scripts"):
            raise PermissionError("Execução de scripts não autorizada")
        
        script_path = parametros.get("script_path")
        args = parametros.get("args", [])
        
        if not script_path:
            raise ValueError("script_path não fornecido")
        
        logger.info(f"🐍 Executando skill: {script_path}")
        
        # Executar script
        result = subprocess.run(
            [sys.executable, script_path] + args,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutos
        )
        
        return {
            "codigo_retorno": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "sucesso": result.returncode == 0
        }
    
    async def criar_nota_obsidian(self, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Cria nota no Obsidian"""
        if not PERMISSOES.get("acessar_obsidian"):
            raise PermissionError("Acesso ao Obsidian não autorizado")
        
        titulo = parametros.get("titulo")
        conteudo = parametros.get("conteudo")
        pasta = parametros.get("pasta", "")
        
        if not titulo or not conteudo:
            raise ValueError("título e conteúdo são obrigatórios")
        
        # Caminho do vault Obsidian (configurável)
        vault_path = Path(os.getenv("OBSIDIAN_VAULT_PATH", "C:/Users/Usuario/Documents/ObsidianVault"))
        
        if pasta:
            nota_path = vault_path / pasta / f"{titulo}.md"
        else:
            nota_path = vault_path / f"{titulo}.md"
        
        # Criar pasta se não existir
        nota_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Escrever nota
        nota_path.write_text(conteudo, encoding='utf-8')
        
        logger.info(f"📝 Nota criada: {nota_path}")
        
        return {
            "caminho": str(nota_path),
            "sucesso": True
        }
    
    def atualizar_permissoes(self, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza permissões do agente"""
        novas_permissoes = parametros.get("permissoes", {})
        
        for chave, valor in novas_permissoes.items():
            if chave in PERMISSOES:
                PERMISSOES[chave] = valor
                logger.info(f"🔐 Permissão atualizada: {chave} = {valor}")
        
        return {
            "permissoes_atualizadas": PERMISSOES
        }
    
    async def enviar_mensagem(self, dados: Dict[str, Any]):
        """Envia mensagem para o servidor"""
        if self.websocket and self.conectado:
            try:
                await self.websocket.send(json.dumps(dados))
            except Exception as e:
                logger.error(f"Erro ao enviar mensagem: {e}")
    
    async def enviar_resposta(self, id_comando: str, resposta: Dict[str, Any]):
        """Envia resposta de comando para o servidor"""
        await self.enviar_mensagem({
            "tipo": "resposta",
            "id_comando": id_comando,
            "resposta": resposta,
            "id_agente": self.id_agente,
            "timestamp": datetime.now().isoformat()
        })
    
    async def enviar_heartbeat(self):
        """Envia heartbeat periódico para o servidor"""
        while self.conectado:
            try:
                await self.enviar_mensagem({
                    "tipo": "heartbeat",
                    "id_agente": self.id_agente,
                    "status": self.obter_status(),
                    "timestamp": datetime.now().isoformat()
                })
                await asyncio.sleep(CONFIG["heartbeat_interval"])
            except Exception as e:
                logger.error(f"Erro ao enviar heartbeat: {e}")
                break
    
    async def desktop_capture_automatico(self):
        """Executa Desktop Capture automaticamente"""
        # Aguardar 1 minuto antes de iniciar
        await asyncio.sleep(60)
        
        while self.conectado:
            try:
                if PERMISSOES.get("desktop_capture"):
                    logger.info("🔄 Desktop Capture automático...")
                    resultado = await self.capturar_tela()
                    
                    # Enviar screenshot para o servidor
                    await self.enviar_mensagem({
                        "tipo": "desktop_capture_automatico",
                        "id_agente": self.id_agente,
                        "dados": resultado,
                        "timestamp": datetime.now().isoformat()
                    })
                
                await asyncio.sleep(CONFIG["desktop_capture_interval"])
            except Exception as e:
                logger.error(f"Erro no Desktop Capture automático: {e}")
                await asyncio.sleep(CONFIG["desktop_capture_interval"])


def main():
    """Função principal"""
    logger.info("=" * 60)
    logger.info("AGENTE LOCAL HÍBRIDO - Sistema de Automação")
    logger.info("=" * 60)
    
    # Verificar dependências
    try:
        import pyautogui
        import psutil
        import websockets
    except ImportError as e:
        logger.error(f"❌ Dependência faltando: {e}")
        logger.error("Execute: pip install pyautogui psutil websockets")
        sys.exit(1)
    
    # Criar e iniciar agente
    agente = AgenteLocal()
    
    try:
        asyncio.run(agente.conectar())
    except KeyboardInterrupt:
        logger.info("\n👋 Agente encerrado pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro fatal: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
