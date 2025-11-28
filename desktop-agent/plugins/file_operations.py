"""
Plugin: File Operations
Adiciona comandos para manipulação de arquivos
"""

import os
import shutil
from pathlib import Path
from typing import Dict, Any

async def read_file_handler(params: Dict[str, Any]) -> Dict[str, Any]:
    """Ler conteúdo de um arquivo"""
    file_path = params.get("path")
    encoding = params.get("encoding", "utf-8")
    
    try:
        with open(file_path, "r", encoding=encoding) as f:
            content = f.read()
        
        return {
            "success": True,
            "content": content,
            "size": len(content),
            "path": file_path
        }
    except Exception as e:
        return {"error": str(e)}

async def write_file_handler(params: Dict[str, Any]) -> Dict[str, Any]:
    """Escrever conteúdo em um arquivo"""
    file_path = params.get("path")
    content = params.get("content", "")
    encoding = params.get("encoding", "utf-8")
    
    try:
        # Criar diretório se não existir
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "w", encoding=encoding) as f:
            f.write(content)
        
        return {
            "success": True,
            "path": file_path,
            "size": len(content)
        }
    except Exception as e:
        return {"error": str(e)}

async def copy_file_handler(params: Dict[str, Any]) -> Dict[str, Any]:
    """Copiar arquivo"""
    source = params.get("source")
    destination = params.get("destination")
    
    try:
        # Criar diretório de destino se não existir
        Path(destination).parent.mkdir(parents=True, exist_ok=True)
        
        shutil.copy2(source, destination)
        
        return {
            "success": True,
            "source": source,
            "destination": destination
        }
    except Exception as e:
        return {"error": str(e)}

async def move_file_handler(params: Dict[str, Any]) -> Dict[str, Any]:
    """Mover arquivo"""
    source = params.get("source")
    destination = params.get("destination")
    
    try:
        # Criar diretório de destino se não existir
        Path(destination).parent.mkdir(parents=True, exist_ok=True)
        
        shutil.move(source, destination)
        
        return {
            "success": True,
            "source": source,
            "destination": destination
        }
    except Exception as e:
        return {"error": str(e)}

async def delete_file_handler(params: Dict[str, Any]) -> Dict[str, Any]:
    """Deletar arquivo"""
    file_path = params.get("path")
    
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
        elif os.path.isdir(file_path):
            shutil.rmtree(file_path)
        else:
            return {"error": "Caminho não encontrado"}
        
        return {
            "success": True,
            "path": file_path
        }
    except Exception as e:
        return {"error": str(e)}

async def list_directory_handler(params: Dict[str, Any]) -> Dict[str, Any]:
    """Listar conteúdo de um diretório"""
    dir_path = params.get("path", ".")
    
    try:
        items = []
        for item in os.listdir(dir_path):
            full_path = os.path.join(dir_path, item)
            items.append({
                "name": item,
                "path": full_path,
                "is_file": os.path.isfile(full_path),
                "is_dir": os.path.isdir(full_path),
                "size": os.path.getsize(full_path) if os.path.isfile(full_path) else 0
            })
        
        return {
            "success": True,
            "path": dir_path,
            "items": items,
            "count": len(items)
        }
    except Exception as e:
        return {"error": str(e)}

def register(plugin_manager):
    """Registrar comandos do plugin"""
    plugin_manager.register_command("read_file", read_file_handler)
    plugin_manager.register_command("write_file", write_file_handler)
    plugin_manager.register_command("copy_file", copy_file_handler)
    plugin_manager.register_command("move_file", move_file_handler)
    plugin_manager.register_command("delete_file", delete_file_handler)
    plugin_manager.register_command("list_directory", list_directory_handler)
