#!/usr/bin/env python3
"""
Agente Local Obsidian - Controle Remoto via WebSocket
Inspirado na arquitetura do Vercept (Vy)

Este agente roda no computador do usuário e permite controle total do Obsidian
através da interface web do servidor de automação.
"""

import os
import sys
import json
import time
import asyncio
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import websockets
import argparse

class ObsidianVaultWatcher(FileSystemEventHandler):
    """Monitora mudanças no vault do Obsidian"""
    
    def __init__(self, agent):
        self.agent = agent
        self.last_modified = {}
    
    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        
        # Evitar duplicatas (watchdog dispara múltiplos eventos)
        path = event.src_path
        current_time = time.time()
        if path in self.last_modified and (current_time - self.last_modified[path]) < 1:
            return
        
        self.last_modified[path] = current_time
        asyncio.create_task(self.agent.on_file_modified(path))
    
    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        asyncio.create_task(self.agent.on_file_created(event.src_path))
    
    def on_deleted(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return
        asyncio.create_task(self.agent.on_file_deleted(event.src_path))


class ObsidianAgent:
    """Agente principal de controle do Obsidian"""
    
    def __init__(self, vault_path: str, server_url: str, auth_token: str):
        self.vault_path = Path(vault_path).resolve()
        self.server_url = server_url
        self.auth_token = auth_token
        self.websocket = None
        self.observer = None
        self.running = False
        
        if not self.vault_path.exists():
            raise ValueError(f"Vault não encontrado: {vault_path}")
        
        print(f"✅ Agente Obsidian iniciado")
        print(f"📁 Vault: {self.vault_path}")
        print(f"🌐 Servidor: {server_url}")
    
    async def connect(self):
        """Conecta ao servidor via WebSocket"""
        while self.running:
            try:
                print(f"🔄 Conectando ao servidor...")
                async with websockets.connect(
                    self.server_url,
                    extra_headers={"Authorization": f"Bearer {self.auth_token}"}
                ) as websocket:
                    self.websocket = websocket
                    print(f"✅ Conectado ao servidor!")
                    
                    # Enviar handshake
                    await self.send_message({
                        "type": "handshake",
                        "vault_path": str(self.vault_path),
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    # Loop de recepção de mensagens
                    async for message in websocket:
                        await self.handle_message(json.loads(message))
            
            except websockets.exceptions.ConnectionClosed:
                print("⚠️  Conexão perdida. Reconectando em 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"❌ Erro: {e}")
                await asyncio.sleep(5)
    
    async def send_message(self, data: Dict):
        """Envia mensagem ao servidor"""
        if self.websocket and not self.websocket.closed:
            await self.websocket.send(json.dumps(data))
    
    async def handle_message(self, data: Dict):
        """Processa comandos recebidos do servidor"""
        command = data.get("command")
        
        handlers = {
            "list_files": self.cmd_list_files,
            "read_file": self.cmd_read_file,
            "write_file": self.cmd_write_file,
            "create_file": self.cmd_create_file,
            "delete_file": self.cmd_delete_file,
            "search": self.cmd_search,
            "get_structure": self.cmd_get_structure,
        }
        
        handler = handlers.get(command)
        if handler:
            try:
                result = await handler(data.get("params", {}))
                await self.send_message({
                    "type": "response",
                    "command": command,
                    "success": True,
                    "data": result
                })
            except Exception as e:
                await self.send_message({
                    "type": "response",
                    "command": command,
                    "success": False,
                    "error": str(e)
                })
        else:
            print(f"⚠️  Comando desconhecido: {command}")
    
    async def cmd_list_files(self, params: Dict) -> List[Dict]:
        """Lista todos os arquivos .md do vault"""
        files = []
        for md_file in self.vault_path.rglob("*.md"):
            rel_path = md_file.relative_to(self.vault_path)
            stat = md_file.stat()
            files.append({
                "path": str(rel_path),
                "name": md_file.name,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
        return sorted(files, key=lambda x: x["modified"], reverse=True)
    
    async def cmd_read_file(self, params: Dict) -> Dict:
        """Lê conteúdo de um arquivo"""
        file_path = self.vault_path / params["path"]
        
        if not file_path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {params['path']}")
        
        content = file_path.read_text(encoding="utf-8")
        stat = file_path.stat()
        
        return {
            "path": params["path"],
            "content": content,
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }
    
    async def cmd_write_file(self, params: Dict) -> Dict:
        """Edita arquivo existente"""
        file_path = self.vault_path / params["path"]
        
        if not file_path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {params['path']}")
        
        # Backup antes de editar
        backup_path = file_path.with_suffix(".md.backup")
        backup_path.write_text(file_path.read_text(encoding="utf-8"), encoding="utf-8")
        
        # Escrever novo conteúdo
        file_path.write_text(params["content"], encoding="utf-8")
        
        return {
            "path": params["path"],
            "success": True,
            "backup": str(backup_path.relative_to(self.vault_path))
        }
    
    async def cmd_create_file(self, params: Dict) -> Dict:
        """Cria novo arquivo"""
        file_path = self.vault_path / params["path"]
        
        if file_path.exists():
            raise FileExistsError(f"Arquivo já existe: {params['path']}")
        
        # Criar diretórios se necessário
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Criar arquivo
        file_path.write_text(params.get("content", ""), encoding="utf-8")
        
        return {
            "path": params["path"],
            "success": True
        }
    
    async def cmd_delete_file(self, params: Dict) -> Dict:
        """Deleta arquivo (move para lixeira)"""
        file_path = self.vault_path / params["path"]
        
        if not file_path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {params['path']}")
        
        # Mover para pasta .trash
        trash_dir = self.vault_path / ".trash"
        trash_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        trash_path = trash_dir / f"{file_path.stem}_{timestamp}.md"
        file_path.rename(trash_path)
        
        return {
            "path": params["path"],
            "success": True,
            "trash_path": str(trash_path.relative_to(self.vault_path))
        }
    
    async def cmd_search(self, params: Dict) -> List[Dict]:
        """Busca texto em todos os arquivos"""
        query = params["query"].lower()
        results = []
        
        for md_file in self.vault_path.rglob("*.md"):
            try:
                content = md_file.read_text(encoding="utf-8")
                if query in content.lower():
                    # Encontrar linhas que contêm a query
                    matches = []
                    for i, line in enumerate(content.split("\n"), 1):
                        if query in line.lower():
                            matches.append({
                                "line": i,
                                "text": line.strip()
                            })
                    
                    results.append({
                        "path": str(md_file.relative_to(self.vault_path)),
                        "matches": matches[:5]  # Máximo 5 matches por arquivo
                    })
            except Exception:
                continue
        
        return results[:50]  # Máximo 50 arquivos
    
    async def cmd_get_structure(self, params: Dict) -> Dict:
        """Retorna estrutura de pastas do vault"""
        def build_tree(path: Path) -> Dict:
            tree = {"name": path.name, "type": "folder", "children": []}
            
            try:
                for item in sorted(path.iterdir()):
                    if item.name.startswith("."):
                        continue
                    
                    if item.is_dir():
                        tree["children"].append(build_tree(item))
                    elif item.suffix == ".md":
                        tree["children"].append({
                            "name": item.name,
                            "type": "file",
                            "path": str(item.relative_to(self.vault_path))
                        })
            except PermissionError:
                pass
            
            return tree
        
        return build_tree(self.vault_path)
    
    async def on_file_modified(self, path: str):
        """Callback quando arquivo é modificado localmente"""
        try:
            file_path = Path(path)
            rel_path = file_path.relative_to(self.vault_path)
            content = file_path.read_text(encoding="utf-8")
            
            await self.send_message({
                "type": "file_changed",
                "action": "modified",
                "path": str(rel_path),
                "content": content,
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"⚠️  Erro ao processar modificação: {e}")
    
    async def on_file_created(self, path: str):
        """Callback quando arquivo é criado localmente"""
        try:
            file_path = Path(path)
            rel_path = file_path.relative_to(self.vault_path)
            
            await self.send_message({
                "type": "file_changed",
                "action": "created",
                "path": str(rel_path),
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"⚠️  Erro ao processar criação: {e}")
    
    async def on_file_deleted(self, path: str):
        """Callback quando arquivo é deletado localmente"""
        try:
            file_path = Path(path)
            rel_path = file_path.relative_to(self.vault_path)
            
            await self.send_message({
                "type": "file_changed",
                "action": "deleted",
                "path": str(rel_path),
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"⚠️  Erro ao processar deleção: {e}")
    
    def start_file_watcher(self):
        """Inicia monitoramento de arquivos"""
        event_handler = ObsidianVaultWatcher(self)
        self.observer = Observer()
        self.observer.schedule(event_handler, str(self.vault_path), recursive=True)
        self.observer.start()
        print(f"👁️  Monitorando mudanças no vault...")
    
    async def run(self):
        """Executa o agente"""
        self.running = True
        self.start_file_watcher()
        
        try:
            await self.connect()
        except KeyboardInterrupt:
            print("\n🛑 Encerrando agente...")
        finally:
            self.running = False
            if self.observer:
                self.observer.stop()
                self.observer.join()


def main():
    parser = argparse.ArgumentParser(description="Agente Local Obsidian")
    parser.add_argument("--vault", required=True, help="Caminho do vault Obsidian")
    parser.add_argument("--server", default="ws://localhost:3000/ws/obsidian", help="URL do servidor WebSocket")
    parser.add_argument("--token", required=True, help="Token de autenticação")
    
    args = parser.parse_args()
    
    agent = ObsidianAgent(
        vault_path=args.vault,
        server_url=args.server,
        auth_token=args.token
    )
    
    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
