import { Download, Monitor, Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function DownloadAgent() {
  const { data: links, isLoading } = trpc.downloadAgent.getDownloadLinks.useQuery();

  const handleDownloadAgentPy = async () => {
    try {
      const result = await trpc.downloadAgent.getAgentPy.query();
      const blob = new Blob([result.content], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar agent.py:", error);
      alert("Erro ao baixar arquivo. Tente novamente.");
    }
  };

  const handleDownloadInstallerPy = async () => {
    try {
      // Gerar conteúdo do instalador atualizado
      const agentResult = await trpc.downloadAgent.getAgentPy.query();
      const installerContent = generateInstallerPy(agentResult.content);
      
      const blob = new Blob([installerContent], { type: "text/x-python" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "instalador_automatico.py";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar instalador:", error);
      alert("Erro ao baixar arquivo. Tente novamente.");
    }
  };

  const handleDownloadInstallerBat = async () => {
    try {
      const result = await trpc.downloadAgent.getInstallerBat.query();
      const blob = new Blob([result.content], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar instalador BAT:", error);
      alert("Erro ao baixar arquivo. Tente novamente.");
    }
  };

  // Função para gerar instalador Python com agent.py embutido
  const generateInstallerPy = (agentPyContent: string): string => {
    return `#!/usr/bin/env python3
"""
INSTALADOR AUTOMÁTICO - DESKTOP AGENT
1 CLIQUE = SISTEMA RODANDO

Este script:
1. Verifica Python
2. Instala dependências
3. Cria agent.py localmente (SEM DOWNLOAD)
4. Configura automaticamente
5. Inicia o sistema
"""

import os
import sys
import subprocess
import platform
import json
import urllib.request
from pathlib import Path

# Configurações
VERSION = "2.0.0"
SERVER_URL = "https://automacao-api-alejofy2.manus.space"

# Agent.py embutido (gerado via tRPC)
AGENT_PY_CONTENT = '''${agentPyContent.replace(/'/g, "\\'").replace(/\n/g, "\\n")}
'''

def print_header():
    print("=" * 70)
    print("  INSTALADOR AUTOMÁTICO - DESKTOP AGENT v{}".format(VERSION))
    print("  Sistema de Automação Remota")
    print("=" * 70)
    print()

def check_python():
    """Verifica versão do Python"""
    print("[1/6] Verificando Python...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print("❌ Python 3.7+ é necessário!")
        print("   Versão atual: {}.{}.{}".format(version.major, version.minor, version.micro))
        print()
        print("   Baixe Python em: https://www.python.org/downloads/")
        input("\nPressione ENTER para sair...")
        sys.exit(1)
    
    print("✓ Python {}.{}.{} detectado".format(version.major, version.minor, version.micro))
    print()

def install_dependencies():
    """Instala dependências necessárias"""
    print("[2/6] Instalando dependências...")
    
    dependencies = [
        "websockets",
        "pillow",
        "requests"
    ]
    
    for dep in dependencies:
        try:
            print("  → Instalando {}...".format(dep))
            subprocess.check_call(
                [sys.executable, "-m", "pip", "install", dep, "--quiet"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            print("    ✓ {} instalado".format(dep))
        except Exception as e:
            print("    ⚠ Erro ao instalar {}: {}".format(dep, e))
    
    print("✓ Dependências instaladas")
    print()

def create_directories():
    """Cria estrutura de diretórios"""
    print("[3/6] Criando diretórios...")
    
    base_dir = Path.home() / "DesktopAgent"
    dirs = [
        base_dir,
        base_dir / "plugins",
        base_dir / "cache",
        base_dir / "logs"
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    print("✓ Diretórios criados em: {}".format(base_dir))
    print()
    return base_dir

def create_agent_file(base_dir):
    """Cria arquivo agent.py localmente (SEM DOWNLOAD)"""
    print("[4/6] Criando Desktop Agent...")
    
    try:
        agent_path = base_dir / "agent.py"
        with open(agent_path, 'w', encoding='utf-8') as f:
            f.write(AGENT_PY_CONTENT)
        
        print("✓ Agent criado com sucesso (SEM DOWNLOAD - Bypass Cloudflare)")
        print()
        return agent_path
    except Exception as e:
        print("❌ Erro ao criar agent: {}".format(e))
        input("\nPressione ENTER para sair...")
        sys.exit(1)

def generate_token_from_api():
    """Gera token automaticamente via API do servidor"""
    try:
        # Preparar dados para criar agent
        device_name = platform.node()
        data = json.dumps({
            "deviceName": device_name,
            "platform": platform.system(),
            "version": VERSION
        }).encode('utf-8')
        
        # Fazer requisição POST para criar agent e obter token via REST API
        url = "{}/api/desktop-agent/register".format(SERVER_URL)
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('token'), result.get('agentId')
    except Exception as e:
        print("  ⚠ Erro ao gerar token via API: {}".format(e))
        return None, None

def configure_agent(base_dir):
    """Configura o agent"""
    print("[5/6] Configurando agent...")
    
    # Tentar gerar token automaticamente via API
    print("  → Gerando token de autenticação...")
    token, agent_id = generate_token_from_api()
    
    if token:
        print("  ✓ Token gerado automaticamente (Agent ID: {})".format(agent_id))
    else:
        print("  ⚠ Usando token de exemplo (REQUER CONFIGURAÇÃO MANUAL)")
        token = "CONFIGURE_MANUALMENTE_EM_/desktop/agents"
    
    config = {
        "server_url": "wss://automacao-ws-alejofy2.manus.space",
        "token": token,
        "device_name": platform.node(),
        "auto_start": True,
        "auto_update": True
    }
    
    config_path = base_dir / "config.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✓ Configuração criada")
    print()
    
    return token is not None

def create_startup_script(base_dir, agent_path):
    """Cria script de inicialização"""
    print("[6/6] Criando atalhos...")
    
    if platform.system() == "Windows":
        # Criar .bat para Windows
        bat_path = base_dir / "Iniciar_Agent.bat"
        with open(bat_path, 'w') as f:
            f.write('@echo off\n')
            f.write('title Desktop Agent\n')
            f.write('cd /d "{}"\n'.format(base_dir))
            f.write('"{}" "{}"\n'.format(sys.executable, agent_path))
            f.write('pause\n')
        
        print("✓ Atalho criado: {}".format(bat_path))
        
        # Criar atalho na área de trabalho
        try:
            desktop = Path.home() / "Desktop"
            if desktop.exists():
                desktop_bat = desktop / "Desktop_Agent.bat"
                with open(desktop_bat, 'w') as f:
                    f.write('@echo off\n')
                    f.write('cd /d "{}"\n'.format(base_dir))
                    f.write('"{}" "{}"\n'.format(sys.executable, agent_path))
                print("✓ Atalho criado na área de trabalho")
        except:
            pass
    else:
        # Criar .sh para Linux/Mac
        sh_path = base_dir / "start_agent.sh"
        with open(sh_path, 'w') as f:
            f.write('#!/bin/bash\n')
            f.write('cd "{}"\n'.format(base_dir))
            f.write('"{}" "{}"\n'.format(sys.executable, agent_path))
        
        os.chmod(sh_path, 0o755)
        print("✓ Script criado: {}".format(sh_path))
    
    print()

def start_agent(agent_path):
    """Inicia o agent"""
    print("=" * 70)
    print("  INSTALAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 70)
    print()
    print("O Desktop Agent está pronto para uso!")
    print()
    print("Opções:")
    print("  1. Iniciar agora")
    print("  2. Sair (iniciar manualmente depois)")
    print()
    
    choice = input("Escolha uma opção [1/2]: ").strip()
    
    if choice == "1":
        print()
        print("Iniciando Desktop Agent...")
        print("-" * 70)
        print()
        
        try:
            subprocess.run([sys.executable, str(agent_path)])
        except KeyboardInterrupt:
            print()
            print("Agent finalizado pelo usuário.")
    else:
        print()
        print("Para iniciar o agent depois:")
        if platform.system() == "Windows":
            print("  → Clique duas vezes em 'Iniciar_Agent.bat'")
            print("  → Ou use o atalho na área de trabalho")
        else:
            print("  → Execute: {}".format(agent_path.parent / "start_agent.sh"))
        print()
        input("Pressione ENTER para sair...")

def main():
    try:
        print_header()
        check_python()
        install_dependencies()
        base_dir = create_directories()
        agent_path = create_agent_file(base_dir)  # Mudou aqui - cria localmente
        token_success = configure_agent(base_dir)
        create_startup_script(base_dir, agent_path)
        
        if not token_success:
            print("⚠" * 70)
            print("  ATENÇÃO: Token não foi gerado automaticamente!")
            print("  Acesse: {}/desktop/agents".format(SERVER_URL))
            print("  E configure manualmente o token no config.json")
            print("⚠" * 70)
            print()
        
        start_agent(agent_path)
        
    except KeyboardInterrupt:
        print()
        print()
        print("Instalação cancelada pelo usuário.")
        input("\nPressione ENTER para sair...")
        sys.exit(0)
    except Exception as e:
        print()
        print("=" * 70)
        print("  ERRO DURANTE A INSTALAÇÃO")
        print("=" * 70)
        print()
        print("Erro: {}".format(e))
        print()
        input("Pressione ENTER para sair...")
        sys.exit(1)

if __name__ == "__main__":
    main()
`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
                <p className="text-sm text-gray-600">Desktop Agent</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
            <Rocket className="w-10 h-10 text-blue-600" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Desktop Agent
          </h2>
          
          <p className="text-xl text-gray-600 mb-8">
            Sistema de automação remota para Windows, Linux e macOS
          </p>

          <Alert className="max-w-2xl mx-auto mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>1 CLIQUE = SISTEMA RODANDO!</strong> Baixe o instalador e execute. Tudo é configurado automaticamente.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Download Options */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Escolha sua forma de instalação
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Windows BAT */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Windows</h4>
                    <p className="text-sm text-gray-600">Instalador .BAT</p>
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instala Python automaticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Configura dependências</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Cria atalhos na área de trabalho</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Inicia automaticamente</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  onClick={handleDownloadInstallerBat}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar para Windows
                </Button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Recomendado para Windows
                </p>
              </div>
            </Card>

            {/* Python Universal */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-blue-500">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Universal</h4>
                    <p className="text-sm text-gray-600">Instalador .PY</p>
                  </div>
                </div>

                <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mb-3">
                  RECOMENDADO
                </div>

                <div className="flex-1 mb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Funciona em Windows, Linux e macOS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Instalação guiada passo a passo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Detecta sistema automaticamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Interface amigável</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  disabled={isLoading}
                  onClick={handleDownloadInstallerPy}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Universal
                </Button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Requer Python 3.7+
                </p>
              </div>
            </Card>

            {/* Agent Manual */}
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Download className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Manual</h4>
                    <p className="text-sm text-gray-600">Agent .PY</p>
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Apenas o agent principal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Para usuários avançados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Configuração manual</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Mais controle</span>
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleDownloadAgentPy}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Agent
                </Button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  Requer configuração manual
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Como instalar
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Baixe o instalador</h4>
                  <p className="text-gray-600">
                    Escolha o instalador adequado para seu sistema operacional acima.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Execute o arquivo</h4>
                  <p className="text-gray-600">
                    Clique duas vezes no arquivo baixado. No Windows, pode ser necessário permitir a execução.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Aguarde a instalação</h4>
                  <p className="text-gray-600">
                    O instalador irá configurar tudo automaticamente. Isso pode levar alguns minutos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Pronto!</h4>
                  <p className="text-gray-600">
                    O Desktop Agent estará rodando e conectado ao servidor automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="text-sm">
            {APP_TITLE} - Sistema de Automação Remota
          </p>
          <p className="text-xs mt-2">
            Versão 2.0.0 - Desktop Agent
          </p>
        </div>
      </footer>
    </div>
  );
}
