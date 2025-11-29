@echo off
REM ========================================
REM INSTALADOR AUTOMÁTICO - DESKTOP AGENT
REM 1 CLIQUE = SISTEMA RODANDO
REM ========================================

title Instalador Desktop Agent

echo.
echo ======================================================================
echo   INSTALADOR AUTOMATICO - DESKTOP AGENT
echo   Sistema de Automacao Remota
echo ======================================================================
echo.

REM Verificar se Python está instalado
echo [1/7] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Python nao encontrado!
    echo.
    echo   Baixando Python automaticamente...
    echo   Aguarde...
    
    REM Baixar Python embeddable
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-embed-amd64.zip' -OutFile '%TEMP%\python.zip'}"
    
    echo   Extraindo Python...
    powershell -Command "& {Expand-Archive -Path '%TEMP%\python.zip' -DestinationPath '%USERPROFILE%\DesktopAgent\python' -Force}"
    
    set PYTHON_PATH=%USERPROFILE%\DesktopAgent\python\python.exe
    echo   √ Python instalado em: %PYTHON_PATH%
) else (
    set PYTHON_PATH=python
    echo   √ Python encontrado
)
echo.

REM Criar diretórios
echo [2/7] Criando diretorios...
if not exist "%USERPROFILE%\DesktopAgent" mkdir "%USERPROFILE%\DesktopAgent"
if not exist "%USERPROFILE%\DesktopAgent\plugins" mkdir "%USERPROFILE%\DesktopAgent\plugins"
if not exist "%USERPROFILE%\DesktopAgent\cache" mkdir "%USERPROFILE%\DesktopAgent\cache"
if not exist "%USERPROFILE%\DesktopAgent\logs" mkdir "%USERPROFILE%\DesktopAgent\logs"
echo   √ Diretorios criados
echo.

REM Instalar pip
echo [3/7] Configurando pip...
%PYTHON_PATH% -m ensurepip --default-pip >nul 2>&1
%PYTHON_PATH% -m pip install --upgrade pip --quiet >nul 2>&1
echo   √ pip configurado
echo.

REM Instalar dependências
echo [4/7] Instalando dependencias...
echo   - websockets
%PYTHON_PATH% -m pip install websockets --quiet
echo   - pillow
%PYTHON_PATH% -m pip install pillow --quiet
echo   - requests
%PYTHON_PATH% -m pip install requests --quiet
echo   √ Dependencias instaladas
echo.

REM Baixar agent
echo [5/7] Baixando Desktop Agent...
powershell -Command "& {try { Invoke-WebRequest -Uri 'https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/api/download-agent/agent' -OutFile '%USERPROFILE%\DesktopAgent\agent.py' } catch { exit 1 }}"

if %errorlevel% neq 0 (
    echo   ! Servidor offline, usando versao local...
    copy "%~dp0agent_v2.py" "%USERPROFILE%\DesktopAgent\agent.py" >nul
)
echo   √ Agent baixado
echo.

REM Criar configuração
echo [6/7] Criando configuracao...
(
echo {
echo   "server_url": "wss://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/ws/desktop-agent",
echo   "token": "86fa95160005ff2e3e971acf9d8620abaa4a27bc064e7b8a41980dbde6ea990e",
echo   "device_name": "%COMPUTERNAME%",
echo   "auto_start": true,
echo   "auto_update": true
echo }
) > "%USERPROFILE%\DesktopAgent\config.json"
echo   √ Configuracao criada
echo.

REM Criar atalho de inicialização
echo [7/7] Criando atalhos...
(
echo @echo off
echo title Desktop Agent
echo cd /d "%USERPROFILE%\DesktopAgent"
echo "%PYTHON_PATH%" agent.py
echo pause
) > "%USERPROFILE%\DesktopAgent\Iniciar_Agent.bat"

REM Criar atalho na área de trabalho
copy "%USERPROFILE%\DesktopAgent\Iniciar_Agent.bat" "%USERPROFILE%\Desktop\Desktop_Agent.bat" >nul 2>&1
echo   √ Atalhos criados
echo.

echo ======================================================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo ======================================================================
echo.
echo O Desktop Agent esta pronto para uso!
echo.
echo Atalhos criados:
echo   - Area de trabalho: Desktop_Agent.bat
echo   - Pasta do agent: %USERPROFILE%\DesktopAgent\Iniciar_Agent.bat
echo.
echo.
echo Deseja iniciar o agent agora? [S/N]
set /p START_NOW=

if /i "%START_NOW%"=="S" (
    echo.
    echo Iniciando Desktop Agent...
    echo ----------------------------------------------------------------------
    echo.
    cd /d "%USERPROFILE%\DesktopAgent"
    "%PYTHON_PATH%" agent.py
) else (
    echo.
    echo Para iniciar o agent depois:
    echo   - Clique duas vezes em "Desktop_Agent.bat" na area de trabalho
    echo   - Ou execute: %USERPROFILE%\DesktopAgent\Iniciar_Agent.bat
    echo.
    pause
)
