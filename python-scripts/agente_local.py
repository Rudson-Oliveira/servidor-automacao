#!/usr/bin/env python3
"""
Agente Local - Sistema Vercept
Conecta ao servidor via WebSocket e executa comandos localmente
"""

import asyncio
import json
import platform
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

# Instalar dependências automaticamente
try:
    import websockets
except ImportError:
    print("📦 Instalando websockets...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

# Configurações
SERVIDOR_URL = "ws://localhost:3000/ws/agente"
TOKEN = ""  # Será configurado pelo instalador
AGENTE_ID = f"{platform.node()}_{int(time.time())}"
AGENTE_NOME = platform.node()
VERSAO = "1.0.0"
HEARTBEAT_INTERVAL = 30
RECONNECT_DELAY_MIN = 1
RECONNECT_DELAY_MAX = 60


class AgenteLocal:
    def __init__(self):
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self.running = True
        self.reconnect_delay = RECONNECT_DELAY_MIN
        self.last_heartbeat = time.time()

    async def conectar(self):
        """Conecta ao servidor WebSocket"""
        try:
            print(f"🔌 Conectando: {SERVIDOR_URL}")
            self.ws = await websockets.connect(
                SERVIDOR_URL, ping_interval=None, close_timeout=10
            )

            await self.registrar()
            self.reconnect_delay = RECONNECT_DELAY_MIN
            print(f"✅ Conectado! ID: {AGENTE_ID}")
            return True

        except Exception as e:
            print(f"❌ Erro: {e}")
            return False

    async def registrar(self):
        """Registra agente no servidor"""
        await self.enviar(
            {
                "type": "register",
                "payload": {
                    "id": AGENTE_ID,
                    "name": AGENTE_NOME,
                    "version": VERSAO,
                    "platform": platform.system(),
                    "hostname": socket.gethostname(),
                },
                "timestamp": int(time.time() * 1000),
            }
        )
        print(f"📝 Registrado: {AGENTE_NOME} v{VERSAO}")

    async def enviar(self, mensagem: Dict[str, Any]):
        """Envia mensagem para servidor"""
        if self.ws and not self.ws.closed:
            await self.ws.send(json.dumps(mensagem))

    async def processar_mensagem(self, mensagem_json: str):
        """Processa mensagem recebida"""
        try:
            msg = json.loads(mensagem_json)
            tipo = msg.get("type")
            payload = msg.get("payload", {})

            if tipo == "ping":
                await self.enviar(
                    {
                        "type": "pong",
                        "payload": {},
                        "timestamp": int(time.time() * 1000),
                    }
                )
                self.last_heartbeat = time.time()

            elif tipo == "command":
                await self.executar_comando(payload)

            elif tipo == "registered":
                print("✅ Registro confirmado")

        except Exception as e:
            print(f"❌ Erro ao processar: {e}")

    async def executar_comando(self, payload: Dict[str, Any]):
        """Executa comando recebido"""
        comando = payload.get("command")
        params = payload.get("params", {})
        message_id = payload.get("messageId")

        print(f"⚡ Executando: {comando}")
        inicio = time.time()

        try:
            if comando == "shell":
                resultado = await self.cmd_shell(params)
            elif comando == "obsidian.criar_nota":
                resultado = await self.cmd_obsidian_criar_nota(params)
            elif comando == "obsidian.listar_notas":
                resultado = await self.cmd_obsidian_listar_notas(params)
            elif comando == "obsidian.ler_nota":
                resultado = await self.cmd_obsidian_ler_nota(params)
            elif comando == "vscode.abrir_arquivo":
                resultado = await self.cmd_vscode_abrir_arquivo(params)
            elif comando == "sistema.info":
                resultado = await self.cmd_sistema_info()
            else:
                resultado = {"erro": f"Comando desconhecido: {comando}"}

            duracao = int((time.time() - inicio) * 1000)

            await self.enviar(
                {
                    "type": "result",
                    "payload": {
                        "messageId": message_id,
                        "comando": comando,
                        "resultado": resultado,
                        "duracaoMs": duracao,
                        "status": "sucesso" if "erro" not in resultado else "erro",
                    },
                    "timestamp": int(time.time() * 1000),
                }
            )

            print(f"✅ Concluído em {duracao}ms")

        except Exception as e:
            duracao = int((time.time() - inicio) * 1000)
            await self.enviar(
                {
                    "type": "error",
                    "payload": {
                        "messageId": message_id,
                        "comando": comando,
                        "erro": str(e),
                        "duracaoMs": duracao,
                    },
                    "timestamp": int(time.time() * 1000),
                }
            )
            print(f"❌ Erro: {e}")

    # ===== COMANDOS =====

    async def cmd_shell(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Executa comando shell"""
        cmd = params.get("cmd", "")
        if not cmd:
            return {"erro": "Parâmetro 'cmd' obrigatório"}

        try:
            resultado = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, timeout=30
            )
            return {
                "stdout": resultado.stdout,
                "stderr": resultado.stderr,
                "returncode": resultado.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"erro": "Timeout (30s)"}
        except Exception as e:
            return {"erro": str(e)}

    async def cmd_obsidian_criar_nota(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Cria nota no Obsidian"""
        vault_path = params.get("vault_path", "")
        nome_arquivo = params.get("nome_arquivo", "")
        conteudo = params.get("conteudo", "")

        if not vault_path or not nome_arquivo:
            return {"erro": "Parâmetros 'vault_path' e 'nome_arquivo' obrigatórios"}

        try:
            arquivo = Path(vault_path) / f"{nome_arquivo}.md"
            arquivo.parent.mkdir(parents=True, exist_ok=True)
            arquivo.write_text(conteudo, encoding="utf-8")

            return {
                "sucesso": True,
                "caminho": str(arquivo),
                "mensagem": f"Nota '{nome_arquivo}' criada",
            }
        except Exception as e:
            return {"erro": str(e)}

    async def cmd_obsidian_listar_notas(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Lista notas do Obsidian"""
        vault_path = params.get("vault_path", "")

        if not vault_path:
            return {"erro": "Parâmetro 'vault_path' obrigatório"}

        try:
            vault = Path(vault_path)
            if not vault.exists():
                return {"erro": f"Vault não encontrado: {vault_path}"}

            notas = []
            for arquivo in vault.rglob("*.md"):
                notas.append(
                    {
                        "nome": arquivo.stem,
                        "caminho": str(arquivo.relative_to(vault)),
                        "tamanho": arquivo.stat().st_size,
                        "modificado": arquivo.stat().st_mtime,
                    }
                )

            return {"sucesso": True, "total": len(notas), "notas": notas[:100]}
        except Exception as e:
            return {"erro": str(e)}

    async def cmd_obsidian_ler_nota(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Lê conteúdo de nota"""
        vault_path = params.get("vault_path", "")
        nome_arquivo = params.get("nome_arquivo", "")

        if not vault_path or not nome_arquivo:
            return {"erro": "Parâmetros 'vault_path' e 'nome_arquivo' obrigatórios"}

        try:
            arquivo = Path(vault_path) / f"{nome_arquivo}.md"
            if not arquivo.exists():
                return {"erro": f"Nota não encontrada: {nome_arquivo}"}

            conteudo = arquivo.read_text(encoding="utf-8")

            return {
                "sucesso": True,
                "nome": nome_arquivo,
                "conteudo": conteudo,
                "tamanho": len(conteudo),
            }
        except Exception as e:
            return {"erro": str(e)}

    async def cmd_vscode_abrir_arquivo(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Abre arquivo no VSCode"""
        caminho = params.get("caminho", "")

        if not caminho:
            return {"erro": "Parâmetro 'caminho' obrigatório"}

        try:
            subprocess.Popen(["code", caminho])
            return {"sucesso": True, "mensagem": f"Arquivo aberto: {caminho}"}
        except FileNotFoundError:
            return {"erro": "VSCode não encontrado"}
        except Exception as e:
            return {"erro": str(e)}

    async def cmd_sistema_info(self) -> Dict[str, Any]:
        """Retorna informações do sistema"""
        return {
            "sistema": platform.system(),
            "versao": platform.version(),
            "arquitetura": platform.machine(),
            "processador": platform.processor(),
            "hostname": socket.gethostname(),
            "python": platform.python_version(),
            "agente_versao": VERSAO,
        }

    async def loop_principal(self):
        """Loop principal do agente"""
        while self.running:
            try:
                if not await self.conectar():
                    print(f"⏳ Reconectando em {self.reconnect_delay}s...")
                    await asyncio.sleep(self.reconnect_delay)
                    self.reconnect_delay = min(
                        self.reconnect_delay * 2, RECONNECT_DELAY_MAX
                    )
                    continue

                async for mensagem in self.ws:
                    await self.processar_mensagem(mensagem)

            except websockets.exceptions.ConnectionClosed:
                print("⚠️  Conexão fechada")
            except Exception as e:
                print(f"❌ Erro: {e}")

            if self.running:
                print(f"⏳ Reconectando em {self.reconnect_delay}s...")
                await asyncio.sleep(self.reconnect_delay)

    def parar(self):
        """Para o agente"""
        print("\n🛑 Parando...")
        self.running = False


async def main():
    """Função principal"""
    print("=" * 60)
    print("🤖 Agente Local - Sistema Vercept")
    print(f"📌 Versão: {VERSAO}")
    print(f"💻 Sistema: {platform.system()} {platform.release()}")
    print(f"🏷️  ID: {AGENTE_ID}")
    print(f"📝 Nome: {AGENTE_NOME}")
    print("=" * 60)
    print()

    if not TOKEN:
        print("❌ TOKEN não configurado!")
        print("📝 Execute o instalador ou configure manualmente")
        return

    agente = AgenteLocal()

    try:
        await agente.loop_principal()
    except KeyboardInterrupt:
        print("\n⚠️  Interrompido")
        agente.parar()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Até logo!")
