import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Download, CheckCircle2, XCircle, AlertCircle, ExternalLink, Copy, Check, Zap, Package, Globe } from "lucide-react";
import { toast } from "sonner";

export default function InstalarDesktopAgent() {
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const TOKEN = "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e";
  const SERVER_URL = window.location.origin;

  const copyToken = () => {
    navigator.clipboard.writeText(TOKEN);
    setCopied(true);
    toast.success("Token copiado para área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} baixado com sucesso!`);
  };

  const downloadBatFile = () => {
    const batContent = `@echo off
echo ========================================
echo INSTALADOR DO DESKTOP AGENT
echo Sistema de Automacao - Controle Remoto
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.11 ou superior:
    echo https://www.python.org/downloads/
    echo.
    echo IMPORTANTE: Marque a opcao "Add Python to PATH" durante a instalacao
    pause
    exit /b 1
)

echo [OK] Python encontrado
python --version
echo.

REM Verificar se pip está instalado
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] pip nao encontrado!
    echo.
    echo Instalando pip...
    python -m ensurepip --upgrade
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar pip
        pause
        exit /b 1
    )
)

echo [OK] pip encontrado
pip --version
echo.

REM Instalar dependências
echo Instalando dependencias...
echo.
pip install websockets pillow psutil pywin32
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo ========================================
echo INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Proximo passo:
echo 1. Execute: python agent.py
echo.
pause`;

    downloadFile("INSTALAR_DESKTOP_AGENT.bat", batContent);
  };

  const downloadAgentPy = () => {
    const agentContent = `#!/usr/bin/env python3
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
TOKEN = "${TOKEN}"
SERVER_URL = "${SERVER_URL.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/desktop-agent"
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
    
    asyncio.run(main())`;

    downloadFile("agent.py", agentContent);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🚀 Instalação do Desktop Agent
          </h1>
          <p className="text-slate-600">
            Configure o controle remoto do seu computador em 3 passos simples
          </p>
        </div>

        {/* Passo 1: Verificar Python */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Passo 1
                  </Badge>
                  Verificar Python
                </CardTitle>
                <CardDescription>
                  Certifique-se de que o Python 3.11+ está instalado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verificação Automática</AlertTitle>
              <AlertDescription>
                Abra o <strong>Prompt de Comando</strong> e digite: <code className="bg-slate-100 px-2 py-1 rounded">python --version</code>
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Python Instalado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Se você ver algo como "Python 3.11.0", está tudo certo!
                  </p>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Continuar para Passo 2
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Python NÃO Instalado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Se aparecer erro, você precisa instalar o Python primeiro.
                  </p>
                  <Button
                    onClick={() => window.open("https://www.python.org/downloads/", "_blank")}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Baixar Python 3.11+
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    ⚠️ IMPORTANTE: Marque "Add Python to PATH" durante a instalação!
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Passo 2: Baixar Arquivos */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Passo 2
                  </Badge>
                  Baixar Arquivos de Instalação
                </CardTitle>
                <CardDescription>
                  Baixe os 2 arquivos necessários para instalar o Desktop Agent
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">1. Instalador (BAT)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Script que instala automaticamente todas as dependências Python necessárias.
                  </p>
                  <Button onClick={downloadBatFile} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar INSTALAR_DESKTOP_AGENT.bat
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">2. Desktop Agent (PY)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Código principal do Desktop Agent já configurado com seu token único.
                  </p>
                  <Button onClick={downloadAgentPy} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar agent.py
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Seu Token de Autenticação</AlertTitle>
              <AlertDescription>
                <div className="flex items-center gap-2 mt-2">
                  <code className="bg-slate-100 px-3 py-2 rounded text-xs flex-1 overflow-x-auto">
                    {TOKEN}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyToken}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs mt-2 text-slate-500">
                  Este token já está incluído no arquivo agent.py. Não é necessário configurar nada!
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Passo 3: Executar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Passo 3
                  </Badge>
                  Executar Desktop Agent
                </CardTitle>
                <CardDescription>
                  Siga as instruções abaixo para iniciar o Desktop Agent
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    1
                  </span>
                  Executar Instalador
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  Clique com botão direito em <code className="bg-white px-2 py-1 rounded">INSTALAR_DESKTOP_AGENT.bat</code> e selecione <strong>"Executar como administrador"</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Isso instalará: websockets, pillow, psutil, pywin32
                </p>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    2
                  </span>
                  Executar Desktop Agent
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  Abra o <strong>Prompt de Comando</strong> na pasta onde salvou os arquivos e execute:
                </p>
                <code className="bg-white px-3 py-2 rounded block text-sm">
                  python agent.py
                </code>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  Conexão Bem-Sucedida
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  Você verá estas mensagens se tudo estiver funcionando:
                </p>
                <div className="bg-white p-3 rounded text-xs font-mono space-y-1">
                  <div className="text-green-600">✓ Conexão WebSocket estabelecida</div>
                  <div className="text-green-600">✓ Autenticação bem-sucedida! Agent ID: X</div>
                  <div className="text-green-600">✓ Heartbeat enviado</div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Próximo Passo</AlertTitle>
                <AlertDescription>
                  Após conectar, acesse o <strong>Dashboard de Controle</strong> para validar a conexão e testar comandos remotos.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => window.open("/desktop", "_blank")}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Abrir Dashboard de Controle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
