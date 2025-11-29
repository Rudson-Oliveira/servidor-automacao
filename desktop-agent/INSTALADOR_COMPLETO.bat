@echo off
setlocal enabledelayedexpansion
title Desktop Agent - Instalador Automatico
color 0A

echo ========================================
echo   DESKTOP AGENT - INSTALADOR COMPLETO
echo   Sistema de Automacao - Controle Remoto
echo ========================================
echo.
echo Verificando sistema...
echo.

REM ========================================
REM PASSO 1: Verificar se Python esta instalado
REM ========================================
python --version >nul 2>&1
if errorlevel 1 (
    echo [!] Python NAO encontrado!
    echo.
    echo Baixando Python 3.11.9 automaticamente...
    echo.
    
    REM Criar pasta temporaria
    if not exist "%TEMP%\desktop-agent-install" mkdir "%TEMP%\desktop-agent-install"
    cd /d "%TEMP%\desktop-agent-install"
    
    REM Baixar Python usando PowerShell
    echo Baixando instalador do Python...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe' -OutFile 'python-installer.exe'}"
    
    if errorlevel 1 (
        echo [ERRO] Falha ao baixar Python!
        echo.
        echo Por favor, baixe manualmente em:
        echo https://www.python.org/downloads/
        pause
        exit /b 1
    )
    
    echo.
    echo Instalando Python 3.11.9...
    echo IMPORTANTE: Instalacao automatica com PATH configurado
    echo.
    
    REM Instalar Python silenciosamente com PATH
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    
    REM Aguardar instalacao
    timeout /t 30 /nobreak >nul
    
    echo.
    echo Python instalado! Reiniciando verificacao...
    echo.
    
    REM Limpar arquivo temporario
    del python-installer.exe
    
    REM Voltar para diretorio original
    cd /d "%~dp0"
    
    REM Verificar novamente
    python --version >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Python ainda nao esta disponivel!
        echo Por favor, reinicie o computador e execute novamente.
        pause
        exit /b 1
    )
)

echo [OK] Python encontrado
python --version
echo.

REM ========================================
REM PASSO 2: Verificar/Instalar pip
REM ========================================
pip --version >nul 2>&1
if errorlevel 1 (
    echo [!] pip nao encontrado. Instalando...
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

REM ========================================
REM PASSO 3: Baixar agent.py do servidor
REM ========================================
echo Baixando Desktop Agent do servidor...
echo.

REM Criar arquivo agent.py usando PowerShell
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/api/download/agent.py' -OutFile 'agent.py'}"

if errorlevel 1 (
    echo [AVISO] Falha ao baixar do servidor. Criando arquivo local...
    echo.
    
    REM Criar agent.py localmente
    (
        echo #!/usr/bin/env python3
        echo """Desktop Agent - Sistema de Automacao Remota"""
        echo import asyncio, websockets, json, logging, subprocess, platform, os, base64
        echo from datetime import datetime
        echo from io import BytesIO
        echo.
        echo TOKEN = "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e"
        echo SERVER_URL = "wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent"
        echo DEVICE_NAME = platform.node^(^)
        echo PLATFORM = platform.system^(^)
        echo VERSION = "1.0.0"
        echo.
        echo logging.basicConfig^(level=logging.INFO, format='%%(asctime^)s - %%(levelname^)s - %%(message^)s'^)
        echo logger = logging.getLogger^(__name__^)
        echo.
        echo class DesktopAgent:
        echo     def __init__^(self^): self.ws = None; self.agent_id = None; self.running = True
        echo     async def connect^(self^):
        echo         try:
        echo             logger.info^(f"Conectando ao servidor: {SERVER_URL}"^)
        echo             self.ws = await websockets.connect^(SERVER_URL^)
        echo             await self.authenticate^(^)
        echo             await self.process_messages^(^)
        echo         except Exception as e: logger.error^(f"Erro: {e}"^); await asyncio.sleep^(5^); await self.connect^(^)
        echo     async def authenticate^(self^):
        echo         await self.ws.send^(json.dumps^({"type": "auth", "token": TOKEN, "device_name": DEVICE_NAME, "platform": PLATFORM, "version": VERSION}^)^)
        echo         data = json.loads^(await self.ws.recv^(^)^)
        echo         if data.get^("type"^) == "auth_success": self.agent_id = data.get^("agent_id"^); logger.info^(f"Autenticado! Agent ID: {self.agent_id}"^)
        echo     async def process_messages^(self^):
        echo         async for msg in self.ws:
        echo             data = json.loads^(msg^)
        echo             if data.get^("type"^) == "command": await self.execute_command^(data^)
        echo     async def execute_command^(self, cmd^): logger.info^(f"Comando recebido: {cmd.get^('command_type'^)}"^)
        echo.
        echo async def main^(^): agent = DesktopAgent^(^); await agent.connect^(^)
        echo if __name__ == "__main__": asyncio.run^(main^(^)^)
    ) > agent.py
)

echo [OK] agent.py criado
echo.

REM ========================================
REM PASSO 4: Instalar dependencias
REM ========================================
echo Instalando dependencias Python...
echo.
pip install websockets pillow psutil pywin32 --quiet --disable-pip-version-check

if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas
echo.

REM ========================================
REM PASSO 5: Criar atalho na area de trabalho
REM ========================================
echo Criando atalho na area de trabalho...

set SCRIPT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop

REM Criar arquivo .vbs para criar atalho
(
    echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
    echo sLinkFile = "%DESKTOP%\Desktop Agent.lnk"
    echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
    echo oLink.TargetPath = "python"
    echo oLink.Arguments = """%SCRIPT_DIR%agent.py"""
    echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
    echo oLink.Description = "Desktop Agent - Controle Remoto"
    echo oLink.IconLocation = "C:\Windows\System32\shell32.dll,13"
    echo oLink.Save
) > create_shortcut.vbs

cscript //nologo create_shortcut.vbs
del create_shortcut.vbs

echo [OK] Atalho criado na area de trabalho
echo.

REM ========================================
REM CONCLUSAO
REM ========================================
color 0B
echo ========================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo O Desktop Agent foi instalado em:
echo %SCRIPT_DIR%
echo.
echo Um atalho foi criado na sua area de trabalho.
echo.
echo Para iniciar o Desktop Agent:
echo 1. Clique duas vezes no atalho "Desktop Agent"
echo    OU
echo 2. Execute: python agent.py
echo.
echo ========================================
echo.
pause

REM Perguntar se deseja iniciar agora
set /p START="Deseja iniciar o Desktop Agent agora? (S/N): "
if /i "%START%"=="S" (
    echo.
    echo Iniciando Desktop Agent...
    echo.
    start "Desktop Agent" python agent.py
    echo.
    echo Desktop Agent iniciado em uma nova janela!
    echo.
)

echo Instalacao finalizada. Pressione qualquer tecla para sair.
pause >nul
exit /b 0
