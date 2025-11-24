#!/usr/bin/env python3
"""
MENTOR E LEITOR DE ENDPOINTS - Network Server Scanner
Script de raspagem de servidores SMB/Windows para Comet

Funcionalidades:
- Conecta em servidores SMB/Windows via autenticação NTLM
- Mapeia estrutura completa de pastas (departamentos)
- Extrai metadados de todos os arquivos
- Envia dados para API do sistema
- Suporta raspagem incremental
- Sistema de retry e tratamento de erros

Autor: Manus + Comet
Data: 24/11/2025
Versão: 1.0.0
"""

from smb.SMBConnection import SMBConnection
from smb.smb_structs import OperationFailure
import requests
import json
import hashlib
import os
from datetime import datetime
from typing import List, Dict, Optional, Tuple
import time
from pathlib import Path
import mimetypes

# ========================================
# CONFIGURAÇÃO
# ========================================

# Servidor alvo
SERVER_IP = "192.168.50.11"
SERVER_NAME = "SERVIDOR-HOSPITALAR"  # Nome NetBIOS do servidor
SERVER_PORT = 139  # Porta SMB (139 ou 445)

# Credenciais Windows (NTLM)
USERNAME = "usuario"  # Usuário do domínio
PASSWORD = "senha"  # Senha
DOMAIN = "DOMINIO"  # Domínio Windows (ou deixar vazio para workgroup)
CLIENT_NAME = "COMET-SCANNER"  # Nome da máquina cliente

# URL base da API
API_BASE_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"
API_TRPC_URL = f"{API_BASE_URL}/api/trpc"API_ENDPOINTS = {
    "registrar_servidor": f"{API_BASE_URL}/api/servidor/registrar",
    "mapear_departamentos": f"{API_BASE_URL}/api/servidor/departamentos",
    "enviar_arquivos": f"{API_BASE_URL}/api/servidor/arquivos",
    "atualizar_status": f"{API_BASE_URL}/api/servidor/status",
    "log_raspagem": f"{API_BASE_URL}/api/servidor/log"
}

# Configurações de raspagem
MAX_DEPTH = 10  # Profundidade máxima de subpastas
MAX_FILE_SIZE_INDEX = 10 * 1024 * 1024  # 10MB - Máximo para indexar conteúdo
BATCH_SIZE = 100  # Quantidade de arquivos por lote enviado à API
RETRY_ATTEMPTS = 3  # Tentativas em caso de erro
RETRY_DELAY = 5  # Segundos entre tentativas

# Extensões para indexar conteúdo (busca textual)
INDEXABLE_EXTENSIONS = [
    '.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js',
    '.py', '.java', '.c', '.cpp', '.h', '.sql', '.log'
]

# Categorias de arquivos
FILE_CATEGORIES = {
    'documento': ['.doc', '.docx', '.odt', '.rtf', '.txt', '.pdf'],
    'planilha': ['.xls', '.xlsx', '.ods', '.csv'],
    'apresentacao': ['.ppt', '.pptx', '.odp'],
    'imagem': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp'],
    'video': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    'audio': ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.wma'],
    'compactado': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
    'executavel': ['.exe', '.msi', '.bat', '.sh', '.cmd'],
    'codigo': ['.py', '.js', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go'],
    'banco_dados': ['.db', '.sqlite', '.mdb', '.accdb', '.sql'],
    'email': ['.msg', '.eml', '.pst'],
}

# ========================================
# CLASSES E ESTRUTURAS
# ========================================

class ServerScanner:
    """Classe principal para raspagem de servidores SMB"""
    
    def __init__(self):
        self.connection = None
        self.servidor_id = None
        self.stats = {
            'departamentos': 0,
            'arquivos_total': 0,
            'arquivos_novos': 0,
            'arquivos_atualizados': 0,
            'erros': 0,
            'tempo_inicio': None,
            'tempo_fim': None
        }
    
    def conectar(self) -> bool:
        """
        Estabelece conexão SMB com o servidor usando autenticação NTLM
        
        Returns:
            bool: True se conectado com sucesso
        """
        print(f"\n🔌 Conectando ao servidor {SERVER_IP}...")
        
        try:
            # Criar conexão SMB
            self.connection = SMBConnection(
                username=USERNAME,
                password=PASSWORD,
                my_name=CLIENT_NAME,
                remote_name=SERVER_NAME,
                domain=DOMAIN,
                use_ntlm_v2=True,  # Usar NTLMv2 (mais seguro)
                is_direct_tcp=(SERVER_PORT == 445)  # True se porta 445, False se 139
            )
            
            # Tentar conectar
            if self.connection.connect(SERVER_IP, SERVER_PORT):
                print(f"✅ Conectado com sucesso!")
                print(f"   Usuário: {DOMAIN}\\{USERNAME}")
                print(f"   Servidor: {SERVER_NAME} ({SERVER_IP}:{SERVER_PORT})")
                return True
            else:
                print(f"❌ Falha na conexão")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            return False
    
    def listar_compartilhamentos(self) -> List[str]:
        """
        Lista todos os compartilhamentos (shares) disponíveis no servidor
        
        Returns:
            List[str]: Lista de nomes de compartilhamentos
        """
        print(f"\n📂 Listando compartilhamentos...")
        
        try:
            shares = self.connection.listShares()
            compartilhamentos = []
            
            for share in shares:
                # Filtrar shares de sistema
                if not share.name.endswith('$'):
                    compartilhamentos.append(share.name)
                    print(f"   📁 {share.name}")
            
            print(f"\n✅ Total: {len(compartilhamentos)} compartilhamentos")
            return compartilhamentos
            
        except Exception as e:
            print(f"❌ Erro ao listar compartilhamentos: {e}")
            return []
    
    def mapear_estrutura(self, share_name: str, path: str = "/", depth: int = 0) -> List[Dict]:
        """
        Mapeia recursivamente a estrutura de pastas e arquivos
        
        Args:
            share_name: Nome do compartilhamento
            path: Caminho atual (relativo ao share)
            depth: Profundidade atual da recursão
        
        Returns:
            List[Dict]: Lista de dicionários com informações dos arquivos
        """
        if depth > MAX_DEPTH:
            print(f"⚠️  Profundidade máxima atingida em: {path}")
            return []
        
        arquivos_info = []
        
        try:
            # Listar conteúdo do diretório
            items = self.connection.listPath(share_name, path)
            
            for item in items:
                # Ignorar . e ..
                if item.filename in ['.', '..']:
                    continue
                
                # Construir caminho completo
                if path.endswith('/'):
                    item_path = f"{path}{item.filename}"
                else:
                    item_path = f"{path}/{item.filename}"
                
                # Se for diretório, recursão
                if item.isDirectory:
                    print(f"{'  ' * depth}📁 {item.filename}/")
                    sub_arquivos = self.mapear_estrutura(share_name, item_path, depth + 1)
                    arquivos_info.extend(sub_arquivos)
                else:
                    # É arquivo
                    print(f"{'  ' * depth}📄 {item.filename} ({self._format_size(item.file_size)})")
                    
                    # Extrair informações do arquivo
                    arquivo_info = self._extrair_info_arquivo(
                        share_name, 
                        item_path, 
                        item
                    )
                    
                    if arquivo_info:
                        arquivos_info.append(arquivo_info)
                    
                    self.stats['arquivos_total'] += 1
            
        except OperationFailure as e:
            print(f"{'  ' * depth}❌ Acesso negado: {path}")
            self.stats['erros'] += 1
        except Exception as e:
            print(f"{'  ' * depth}❌ Erro em {path}: {e}")
            self.stats['erros'] += 1
        
        return arquivos_info
    
    def _extrair_info_arquivo(self, share_name: str, path: str, item) -> Optional[Dict]:
        """
        Extrai informações detalhadas de um arquivo
        
        Args:
            share_name: Nome do compartilhamento
            path: Caminho do arquivo
            item: Objeto SharedFile do pysmb
        
        Returns:
            Dict: Dicionário com informações do arquivo
        """
        try:
            # Informações básicas
            nome = item.filename
            extensao = Path(nome).suffix.lower()
            
            # Categorizar arquivo
            categoria = self._categorizar_arquivo(extensao)
            
            # Calcular hash (se arquivo pequeno)
            hash_md5 = None
            if item.file_size < 50 * 1024 * 1024:  # Até 50MB
                try:
                    hash_md5 = self._calcular_hash(share_name, path)
                except:
                    pass
            
            # Indexar conteúdo (se aplicável)
            conteudo_indexado = None
            if extensao in INDEXABLE_EXTENSIONS and item.file_size < MAX_FILE_SIZE_INDEX:
                try:
                    conteudo_indexado = self._ler_conteudo(share_name, path, 1000)
                except:
                    pass
            
            # Montar informações
            arquivo_info = {
                'nome': nome,
                'caminho_completo': f"\\\\{SERVER_IP}\\{share_name}{path}",
                'caminho_relativo': path,
                'share': share_name,
                'extensao': extensao,
                'tipo_arquivo': categoria,
                'tamanho': item.file_size,
                'data_criacao': datetime.fromtimestamp(item.create_time).isoformat(),
                'data_modificacao': datetime.fromtimestamp(item.last_write_time).isoformat(),
                'data_acesso': datetime.fromtimestamp(item.last_access_time).isoformat(),
                'hash': hash_md5,
                'conteudo_indexado': conteudo_indexado,
                'is_readonly': item.isReadOnly,
                'is_hidden': item.isHidden,
                'is_archive': item.isArchive,
            }
            
            return arquivo_info
            
        except Exception as e:
            print(f"   ⚠️  Erro ao extrair info de {path}: {e}")
            return None
    
    def _calcular_hash(self, share_name: str, path: str) -> str:
        """Calcula hash MD5 do arquivo"""
        try:
            file_obj = self.connection.retrieveFile(share_name, path)
            md5 = hashlib.md5()
            
            while True:
                chunk = file_obj.read(8192)
                if not chunk:
                    break
                md5.update(chunk)
            
            return md5.hexdigest()
        except:
            return None
    
    def _ler_conteudo(self, share_name: str, path: str, max_chars: int = 1000) -> str:
        """Lê primeiros N caracteres do arquivo para indexação"""
        try:
            file_obj = self.connection.retrieveFile(share_name, path)
            conteudo = file_obj.read(max_chars).decode('utf-8', errors='ignore')
            return conteudo
        except:
            return None
    
    def _categorizar_arquivo(self, extensao: str) -> str:
        """Categoriza arquivo baseado na extensão"""
        for categoria, extensoes in FILE_CATEGORIES.items():
            if extensao in extensoes:
                return categoria
        return 'outro'
    
    def _format_size(self, size_bytes: int) -> str:
        """Formata tamanho em bytes para formato legível"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"
    
    def enviar_para_api(self, endpoint: str, dados: Dict, retry: int = 0) -> bool:
        """
        Envia dados para API do sistema com retry automático
        
        Args:
            endpoint: URL do endpoint
            dados: Dados a enviar (JSON)
            retry: Tentativa atual (uso interno)
        
        Returns:
            bool: True se enviado com sucesso
        """
        try:
            response = requests.post(
                endpoint,
                json=dados,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return True
            else:
                print(f"⚠️  API retornou status {response.status_code}")
                if retry < RETRY_ATTEMPTS:
                    print(f"   Tentando novamente em {RETRY_DELAY}s...")
                    time.sleep(RETRY_DELAY)
                    return self.enviar_para_api(endpoint, dados, retry + 1)
                return False
                
        except Exception as e:
            print(f"❌ Erro ao enviar para API: {e}")
            if retry < RETRY_ATTEMPTS:
                print(f"   Tentando novamente em {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                return self.enviar_para_api(endpoint, dados, retry + 1)
            return False
    
    def processar_lote_arquivos(self, arquivos: List[Dict], departamento_id: int):
        """
        Processa e envia lote de arquivos para API
        
        Args:
            arquivos: Lista de informações de arquivos
            departamento_id: ID do departamento no banco
        """
        print(f"\n📤 Enviando lote de {len(arquivos)} arquivos...")
        
        dados = {
            'departamento_id': departamento_id,
            'arquivos': arquivos
        }
        
        if self.enviar_para_api(API_ENDPOINTS['enviar_arquivos'], dados):
            print(f"✅ Lote enviado com sucesso!")
            self.stats['arquivos_novos'] += len(arquivos)
        else:
            print(f"❌ Falha ao enviar lote")
            self.stats['erros'] += 1
    
    def desconectar(self):
        """Fecha conexão com o servidor"""
        if self.connection:
            self.connection.close()
            print("\n👋 Desconectado do servidor")
    
    def gerar_relatorio(self):
        """Gera relatório final da raspagem"""
        tempo_total = (self.stats['tempo_fim'] - self.stats['tempo_inicio']).total_seconds()
        
        print("\n" + "=" * 70)
        print("📊 RELATÓRIO FINAL DA RASPAGEM")
        print("=" * 70)
        print(f"Servidor: {SERVER_IP} ({SERVER_NAME})")
        print(f"Tempo total: {tempo_total:.1f} segundos")
        print(f"Departamentos mapeados: {self.stats['departamentos']}")
        print(f"Arquivos encontrados: {self.stats['arquivos_total']}")
        print(f"Arquivos novos: {self.stats['arquivos_novos']}")
        print(f"Arquivos atualizados: {self.stats['arquivos_atualizados']}")
        print(f"Erros encontrados: {self.stats['erros']}")
        print("=" * 70)


# ========================================
# FUNÇÃO PRINCIPAL
# ========================================

def main():
    """Função principal de execução"""
    print("=" * 70)
    print("🤖 MENTOR E LEITOR DE ENDPOINTS - Network Server Scanner")
    print("=" * 70)
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🎯 Servidor alvo: {SERVER_IP} ({SERVER_NAME})")
    print(f"👤 Usuário: {DOMAIN}\\{USERNAME}")
    print("=" * 70)
    
    scanner = ServerScanner()
    scanner.stats['tempo_inicio'] = datetime.now()
    
    try:
        # 1. Conectar ao servidor
        if not scanner.conectar():
            print("\n❌ Falha na conexão. Abortando.")
            return
        
        # 2. Listar compartilhamentos
        shares = scanner.listar_compartilhamentos()
        
        if not shares:
            print("\n⚠️  Nenhum compartilhamento encontrado.")
            return
        
        # 3. Mapear cada compartilhamento (departamento)
        for share in shares:
            print(f"\n{'='*70}")
            print(f"📂 Mapeando compartilhamento: {share}")
            print(f"{'='*70}")
            
            scanner.stats['departamentos'] += 1
            
            # Mapear estrutura
            arquivos = scanner.mapear_estrutura(share)
            
            print(f"\n✅ Compartilhamento '{share}': {len(arquivos)} arquivos encontrados")
            
            # Enviar em lotes
            for i in range(0, len(arquivos), BATCH_SIZE):
                lote = arquivos[i:i+BATCH_SIZE]
                scanner.processar_lote_arquivos(lote, departamento_id=scanner.stats['departamentos'])
        
        # 4. Finalizar
        scanner.stats['tempo_fim'] = datetime.now()
        scanner.gerar_relatorio()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Raspagem interrompida pelo usuário")
    except Exception as e:
        print(f"\n❌ ERRO GERAL: {e}")
        import traceback
        traceback.print_exc()
    finally:
        scanner.desconectar()


# ========================================
# EXECUÇÃO
# ========================================

if __name__ == "__main__":
    print("\n🚀 Iniciando raspagem de servidor SMB/Windows...")
    print("⚡ Usando autenticação NTLM\n")
    main()
