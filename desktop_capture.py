#!/usr/bin/env python3
"""
Script de Captura de Área de Trabalho para Comet Vision
Captura screenshots, lista programas abertos e envia para API Manus
"""

import os
import sys
import json
import base64
import requests
import subprocess
from datetime import datetime
from io import BytesIO

try:
    from PIL import ImageGrab, Image
    import psutil
except ImportError:
    print("❌ ERRO: Bibliotecas necessárias não instaladas")
    print("\nPor favor, execute:")
    print("  pip install pillow psutil requests")
    sys.exit(1)

# ========================================
# CONFIGURAÇÕES
# ========================================

# URL da API Manus (altere para sua URL)
# Para uso local, deixe como localhost:3000
# Para uso remoto, substitua pela URL do seu servidor publicado
API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"

# Chave de API (se necessário)
API_KEY = None  # Defina se usar autenticação

# Diretório para salvar screenshots localmente (opcional)
SAVE_LOCAL = True
LOCAL_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "comet_captures")

# ========================================
# FUNÇÕES DE CAPTURA
# ========================================

def capturar_screenshot():
    """
    Captura screenshot da área de trabalho completa
    Retorna: PIL Image
    """
    try:
        screenshot = ImageGrab.grab()
        print(f"✅ Screenshot capturado: {screenshot.size[0]}x{screenshot.size[1]}")
        return screenshot
    except Exception as e:
        print(f"❌ Erro ao capturar screenshot: {e}")
        return None


def listar_programas_abertos():
    """
    Lista todos os programas/processos em execução
    Retorna: lista de dicionários com informações dos processos
    """
    programas = []
    
    try:
        for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info', 'cpu_percent']):
            try:
                info = proc.info
                
                # Filtrar apenas processos com janelas (ignorar serviços do sistema)
                if info['name'] and not info['name'].startswith('svchost'):
                    programas.append({
                        'pid': info['pid'],
                        'nome': info['name'],
                        'usuario': info['username'],
                        'memoria_mb': round(info['memory_info'].rss / 1024 / 1024, 2) if info['memory_info'] else 0,
                        'cpu_percent': info['cpu_percent'] if info['cpu_percent'] else 0,
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        # Ordenar por uso de memória (maiores primeiro)
        programas.sort(key=lambda x: x['memoria_mb'], reverse=True)
        
        print(f"✅ {len(programas)} programas detectados")
        return programas[:50]  # Retornar apenas os 50 maiores
        
    except Exception as e:
        print(f"❌ Erro ao listar programas: {e}")
        return []


def obter_janelas_ativas():
    """
    Obtém informações sobre janelas ativas (Windows only)
    Retorna: lista de janelas
    """
    janelas = []
    
    try:
        if sys.platform == 'win32':
            import win32gui
            import win32process
            
            def callback(hwnd, windows):
                if win32gui.IsWindowVisible(hwnd):
                    titulo = win32gui.GetWindowText(hwnd)
                    if titulo:
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        try:
                            processo = psutil.Process(pid)
                            windows.append({
                                'titulo': titulo,
                                'processo': processo.name(),
                                'pid': pid,
                            })
                        except:
                            pass
                return True
            
            win32gui.EnumWindows(callback, janelas)
            print(f"✅ {len(janelas)} janelas ativas detectadas")
        else:
            print("⚠️ Detecção de janelas disponível apenas no Windows")
            
    except ImportError:
        print("⚠️ pywin32 não instalado (detecção de janelas desabilitada)")
        print("   Instale com: pip install pywin32")
    except Exception as e:
        print(f"❌ Erro ao obter janelas: {e}")
    
    return janelas


def imagem_para_base64(imagem):
    """
    Converte PIL Image para base64
    """
    buffered = BytesIO()
    imagem.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str


def salvar_local(imagem, programas, janelas):
    """
    Salva screenshot e dados localmente
    """
    if not SAVE_LOCAL:
        return None
    
    try:
        # Criar diretório se não existir
        os.makedirs(LOCAL_DIR, exist_ok=True)
        
        # Nome do arquivo com timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        img_path = os.path.join(LOCAL_DIR, f"screenshot_{timestamp}.png")
        json_path = os.path.join(LOCAL_DIR, f"dados_{timestamp}.json")
        
        # Salvar imagem
        imagem.save(img_path)
        
        # Salvar dados JSON
        dados = {
            'timestamp': timestamp,
            'screenshot': img_path,
            'programas': programas,
            'janelas': janelas,
        }
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(dados, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Dados salvos localmente:")
        print(f"   Imagem: {img_path}")
        print(f"   JSON: {json_path}")
        
        return img_path
        
    except Exception as e:
        print(f"❌ Erro ao salvar localmente: {e}")
        return None


def enviar_para_api(imagem, programas, janelas):
    """
    Envia screenshot e dados para API Manus
    """
    try:
        # Preparar dados
        payload = {
            'timestamp': datetime.now().isoformat(),
            'screenshot_base64': imagem_para_base64(imagem),
            'resolucao': {
                'largura': imagem.size[0],
                'altura': imagem.size[1],
            },
            'programas': programas,
            'janelas': janelas,
            'total_programas': len(programas),
            'total_janelas': len(janelas),
        }
        
        # Headers
        headers = {
            'Content-Type': 'application/json',
        }
        
        if API_KEY:
            headers['Authorization'] = f'Bearer {API_KEY}'
        
        # Enviar para API (endpoint tRPC)
        print(f"\n📤 Enviando para API: {API_URL}/api/trpc/desktop.capturar")
        response = requests.post(
            f"{API_URL}/api/trpc/desktop.capturar",
            json={"json": payload},  # tRPC espera formato {"json": dados}
            headers=headers,
            timeout=30,
        )
        
        if response.status_code == 200:
            print("✅ Dados enviados com sucesso!")
            resultado = response.json()
            print(f"   ID da captura: {resultado.get('id', 'N/A')}")
            return True
        else:
            print(f"❌ Erro ao enviar: {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão: API não está acessível")
        print(f"   Verifique se o servidor está rodando em: {API_URL}")
        return False
    except Exception as e:
        print(f"❌ Erro ao enviar para API: {e}")
        return False


# ========================================
# FUNÇÃO PRINCIPAL
# ========================================

def main():
    """
    Função principal
    """
    print("=" * 70)
    print("🖥️  COMET VISION - CAPTURA DE ÁREA DE TRABALHO")
    print("=" * 70)
    print()
    
    # 1. Capturar screenshot
    print("📸 Capturando screenshot...")
    imagem = capturar_screenshot()
    
    if not imagem:
        print("❌ Falha ao capturar screenshot. Abortando.")
        return
    
    print()
    
    # 2. Listar programas
    print("📋 Listando programas abertos...")
    programas = listar_programas_abertos()
    print()
    
    # 3. Obter janelas ativas
    print("🪟 Detectando janelas ativas...")
    janelas = obter_janelas_ativas()
    print()
    
    # 4. Salvar localmente
    if SAVE_LOCAL:
        print("💾 Salvando dados localmente...")
        salvar_local(imagem, programas, janelas)
        print()
    
    # 5. Enviar para API
    print("🌐 Enviando para API Manus...")
    sucesso = enviar_para_api(imagem, programas, janelas)
    
    print()
    print("=" * 70)
    
    if sucesso:
        print("✅ CAPTURA CONCLUÍDA COM SUCESSO!")
    else:
        print("⚠️  CAPTURA CONCLUÍDA (dados salvos localmente, mas API não recebeu)")
    
    print("=" * 70)
    
    # Resumo
    print("\n📊 RESUMO:")
    print(f"   Screenshot: {imagem.size[0]}x{imagem.size[1]} pixels")
    print(f"   Programas detectados: {len(programas)}")
    print(f"   Janelas ativas: {len(janelas)}")
    
    if programas:
        print(f"\n🔝 TOP 5 PROGRAMAS (por uso de memória):")
        for i, prog in enumerate(programas[:5], 1):
            print(f"   {i}. {prog['nome']} - {prog['memoria_mb']} MB")
    
    if janelas:
        print(f"\n🪟 JANELAS ABERTAS:")
        for i, jan in enumerate(janelas[:10], 1):
            print(f"   {i}. {jan['titulo'][:60]} ({jan['processo']})")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Captura cancelada pelo usuário")
    except Exception as e:
        print(f"\n❌ ERRO FATAL: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\n" + "=" * 70)
        input("\nPressione ENTER para fechar...")
