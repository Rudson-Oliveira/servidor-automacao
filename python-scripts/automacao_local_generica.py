#!/usr/bin/env python3
"""
Script Genérico de Automação Local
Permite controlar programas locais a partir do servidor web
Reutilizável para: Obsidian, VSCode, arquivos, comandos do sistema, etc.

Uso:
    python automacao_local_generica.py --server http://localhost:3000 --token SEU_TOKEN
"""

import os
import sys
import json
import time
import argparse
import subprocess
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

class AutomacaoLocal:
    """Classe principal de automação local"""
    
    def __init__(self, server_url: str, api_token: Optional[str] = None):
        self.server_url = server_url.rstrip('/')
        self.api_token = api_token
        self.session = requests.Session()
        
        if api_token:
            self.session.headers['Authorization'] = f'Bearer {api_token}'
    
    def log(self, message: str, level: str = 'INFO'):
        """Log com timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f'[{timestamp}] [{level}] {message}')
    
    # ==================== OBSIDIAN ====================
    
    def obsidian_criar_nota(self, vault: str, arquivo: str, conteudo: str, 
                           append: bool = False) -> bool:
        """Cria ou atualiza nota no Obsidian"""
        try:
            # Encontrar diretório do vault
            vault_path = self.encontrar_vault_obsidian(vault)
            if not vault_path:
                self.log(f'Vault "{vault}" não encontrado', 'ERROR')
                return False
            
            # Caminho completo do arquivo
            arquivo_path = vault_path / arquivo
            
            # Criar diretórios se necessário
            arquivo_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Escrever conteúdo
            mode = 'a' if append else 'w'
            with open(arquivo_path, mode, encoding='utf-8') as f:
                if append:
                    f.write('\n\n' + conteudo)
                else:
                    f.write(conteudo)
            
            self.log(f'Nota criada: {arquivo_path}')
            return True
            
        except Exception as e:
            self.log(f'Erro ao criar nota: {e}', 'ERROR')
            return False
    
    def obsidian_ler_nota(self, vault: str, arquivo: str) -> Optional[str]:
        """Lê conteúdo de nota do Obsidian"""
        try:
            vault_path = self.encontrar_vault_obsidian(vault)
            if not vault_path:
                return None
            
            arquivo_path = vault_path / arquivo
            
            if not arquivo_path.exists():
                self.log(f'Arquivo não encontrado: {arquivo_path}', 'ERROR')
                return None
            
            with open(arquivo_path, 'r', encoding='utf-8') as f:
                conteudo = f.read()
            
            self.log(f'Nota lida: {arquivo_path} ({len(conteudo)} caracteres)')
            return conteudo
            
        except Exception as e:
            self.log(f'Erro ao ler nota: {e}', 'ERROR')
            return None
    
    def obsidian_listar_notas(self, vault: str, extensao: str = '.md') -> List[str]:
        """Lista todas as notas do vault"""
        try:
            vault_path = self.encontrar_vault_obsidian(vault)
            if not vault_path:
                return []
            
            notas = []
            for arquivo in vault_path.rglob(f'*{extensao}'):
                # Caminho relativo ao vault
                relativo = arquivo.relative_to(vault_path)
                notas.append(str(relativo))
            
            self.log(f'Encontradas {len(notas)} notas no vault "{vault}"')
            return sorted(notas)
            
        except Exception as e:
            self.log(f'Erro ao listar notas: {e}', 'ERROR')
            return []
    
    def encontrar_vault_obsidian(self, vault_name: str) -> Optional[Path]:
        """Encontra diretório do vault do Obsidian"""
        # Locais comuns de vaults
        locais_comuns = [
            Path.home() / 'Documents' / vault_name,
            Path.home() / 'Documentos' / vault_name,
            Path.home() / vault_name,
            Path.home() / 'Obsidian' / vault_name,
            Path.home() / 'OneDrive' / vault_name,
            Path.home() / 'Google Drive' / vault_name,
            Path.home() / 'Dropbox' / vault_name,
        ]
        
        for local in locais_comuns:
            if local.exists() and local.is_dir():
                # Verificar se é vault do Obsidian (tem pasta .obsidian)
                if (local / '.obsidian').exists():
                    return local
        
        return None
    
    # ==================== VSCODE ====================
    
    def vscode_abrir_arquivo(self, caminho: str, linha: Optional[int] = None) -> bool:
        """Abre arquivo no VSCode"""
        try:
            cmd = ['code', caminho]
            
            if linha:
                cmd.extend(['-g', f'{caminho}:{linha}'])
            
            subprocess.run(cmd, check=True)
            self.log(f'Arquivo aberto no VSCode: {caminho}')
            return True
            
        except Exception as e:
            self.log(f'Erro ao abrir VSCode: {e}', 'ERROR')
            return False
    
    # ==================== SISTEMA DE ARQUIVOS ====================
    
    def arquivo_ler(self, caminho: str) -> Optional[str]:
        """Lê conteúdo de arquivo"""
        try:
            with open(caminho, 'r', encoding='utf-8') as f:
                conteudo = f.read()
            
            self.log(f'Arquivo lido: {caminho} ({len(conteudo)} caracteres)')
            return conteudo
            
        except Exception as e:
            self.log(f'Erro ao ler arquivo: {e}', 'ERROR')
            return None
    
    def arquivo_escrever(self, caminho: str, conteudo: str, append: bool = False) -> bool:
        """Escreve em arquivo"""
        try:
            # Criar diretórios se necessário
            Path(caminho).parent.mkdir(parents=True, exist_ok=True)
            
            mode = 'a' if append else 'w'
            with open(caminho, mode, encoding='utf-8') as f:
                f.write(conteudo)
            
            self.log(f'Arquivo escrito: {caminho}')
            return True
            
        except Exception as e:
            self.log(f'Erro ao escrever arquivo: {e}', 'ERROR')
            return False
    
    def arquivo_buscar(self, diretorio: str, padrao: str = '*') -> List[str]:
        """Busca arquivos recursivamente"""
        try:
            arquivos = []
            for arquivo in Path(diretorio).rglob(padrao):
                if arquivo.is_file():
                    arquivos.append(str(arquivo))
            
            self.log(f'Encontrados {len(arquivos)} arquivos em {diretorio}')
            return sorted(arquivos)
            
        except Exception as e:
            self.log(f'Erro ao buscar arquivos: {e}', 'ERROR')
            return []
    
    # ==================== COMANDOS DO SISTEMA ====================
    
    def executar_comando(self, comando: str, shell: bool = True) -> Dict[str, Any]:
        """Executa comando do sistema"""
        try:
            resultado = subprocess.run(
                comando,
                shell=shell,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                'sucesso': resultado.returncode == 0,
                'codigo': resultado.returncode,
                'stdout': resultado.stdout,
                'stderr': resultado.stderr,
            }
            
        except Exception as e:
            self.log(f'Erro ao executar comando: {e}', 'ERROR')
            return {
                'sucesso': False,
                'codigo': -1,
                'stdout': '',
                'stderr': str(e),
            }
    
    # ==================== COMUNICAÇÃO COM SERVIDOR ====================
    
    def enviar_dados(self, endpoint: str, dados: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Envia dados para o servidor"""
        try:
            url = f'{self.server_url}{endpoint}'
            response = self.session.post(url, json=dados)
            response.raise_for_status()
            
            self.log(f'Dados enviados para {endpoint}')
            return response.json()
            
        except Exception as e:
            self.log(f'Erro ao enviar dados: {e}', 'ERROR')
            return None
    
    def buscar_tarefas(self) -> List[Dict[str, Any]]:
        """Busca tarefas pendentes do servidor"""
        try:
            url = f'{self.server_url}/api/tarefas-locais/pendentes'
            response = self.session.get(url)
            response.raise_for_status()
            
            tarefas = response.json()
            self.log(f'Buscadas {len(tarefas)} tarefas pendentes')
            return tarefas
            
        except Exception as e:
            self.log(f'Erro ao buscar tarefas: {e}', 'ERROR')
            return []
    
    def processar_tarefa(self, tarefa: Dict[str, Any]) -> Dict[str, Any]:
        """Processa uma tarefa do servidor"""
        tipo = tarefa.get('tipo')
        params = tarefa.get('params', {})
        
        resultado = {
            'tarefa_id': tarefa.get('id'),
            'sucesso': False,
            'resultado': None,
            'erro': None,
        }
        
        try:
            if tipo == 'obsidian_criar_nota':
                sucesso = self.obsidian_criar_nota(
                    params['vault'],
                    params['arquivo'],
                    params['conteudo'],
                    params.get('append', False)
                )
                resultado['sucesso'] = sucesso
                
            elif tipo == 'obsidian_ler_nota':
                conteudo = self.obsidian_ler_nota(
                    params['vault'],
                    params['arquivo']
                )
                resultado['sucesso'] = conteudo is not None
                resultado['resultado'] = conteudo
                
            elif tipo == 'obsidian_listar_notas':
                notas = self.obsidian_listar_notas(params['vault'])
                resultado['sucesso'] = True
                resultado['resultado'] = notas
                
            elif tipo == 'vscode_abrir':
                sucesso = self.vscode_abrir_arquivo(
                    params['caminho'],
                    params.get('linha')
                )
                resultado['sucesso'] = sucesso
                
            elif tipo == 'arquivo_ler':
                conteudo = self.arquivo_ler(params['caminho'])
                resultado['sucesso'] = conteudo is not None
                resultado['resultado'] = conteudo
                
            elif tipo == 'arquivo_escrever':
                sucesso = self.arquivo_escrever(
                    params['caminho'],
                    params['conteudo'],
                    params.get('append', False)
                )
                resultado['sucesso'] = sucesso
                
            elif tipo == 'executar_comando':
                res = self.executar_comando(params['comando'])
                resultado['sucesso'] = res['sucesso']
                resultado['resultado'] = res
                
            else:
                resultado['erro'] = f'Tipo de tarefa desconhecido: {tipo}'
            
        except Exception as e:
            resultado['erro'] = str(e)
            self.log(f'Erro ao processar tarefa: {e}', 'ERROR')
        
        return resultado
    
    def loop_principal(self, intervalo: int = 5):
        """Loop principal de processamento de tarefas"""
        self.log('Iniciando loop de automação local...')
        
        try:
            while True:
                tarefas = self.buscar_tarefas()
                
                for tarefa in tarefas:
                    self.log(f'Processando tarefa: {tarefa.get("tipo")}')
                    resultado = self.processar_tarefa(tarefa)
                    
                    # Enviar resultado de volta para o servidor
                    self.enviar_dados('/api/tarefas-locais/resultado', resultado)
                
                time.sleep(intervalo)
                
        except KeyboardInterrupt:
            self.log('Loop interrompido pelo usuário')
        except Exception as e:
            self.log(f'Erro no loop principal: {e}', 'ERROR')


def main():
    parser = argparse.ArgumentParser(description='Automação Local Genérica')
    parser.add_argument('--server', required=True, help='URL do servidor')
    parser.add_argument('--token', help='Token de autenticação')
    parser.add_argument('--intervalo', type=int, default=5, help='Intervalo de polling (segundos)')
    parser.add_argument('--modo', choices=['loop', 'teste'], default='loop', help='Modo de execução')
    
    args = parser.parse_args()
    
    automacao = AutomacaoLocal(args.server, args.token)
    
    if args.modo == 'loop':
        automacao.loop_principal(args.intervalo)
    elif args.modo == 'teste':
        # Modo de teste
        print('=== TESTE DE AUTOMAÇÃO LOCAL ===')
        print(f'Servidor: {args.server}')
        print(f'Token: {"Configurado" if args.token else "Não configurado"}')
        print('\nTestando conexão...')
        tarefas = automacao.buscar_tarefas()
        print(f'✅ Conexão OK - {len(tarefas)} tarefas pendentes')


if __name__ == '__main__':
    main()
