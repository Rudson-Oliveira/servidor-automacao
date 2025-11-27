@echo off
chcp 65001 >nul
echo ========================================
echo 🤖 Instalador do Agente Local
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python não encontrado!
    echo 📥 Baixe e instale Python em: https://python.org
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Instalar dependências
echo 📦 Instalando dependências...
python -m pip install --upgrade pip
python -m pip install websockets

if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo ✅ Dependências instaladas
echo.

REM Solicitar token
echo 🔑 Cole o token de autenticação:
set /p TOKEN=Token: 

if "%TOKEN%"=="" (
    echo ❌ Token não pode estar vazio
    pause
    exit /b 1
)

REM Criar arquivo de configuração
echo TOKEN = "%TOKEN%" > config_agente.py
echo SERVIDOR_URL = "ws://localhost:3000/ws/agente" >> config_agente.py

echo ✅ Token configurado
echo.

REM Criar script de inicialização
echo @echo off > EXECUTAR_AGENTE.bat
echo python agente_local.py >> EXECUTAR_AGENTE.bat

echo ✅ Script de execução criado
echo.

REM Perguntar se deseja iniciar com Windows
echo 🚀 Deseja iniciar o agente automaticamente com o Windows? (S/N)
set /p AUTO_START=Resposta: 

if /i "%AUTO_START%"=="S" (
    echo 📝 Criando tarefa agendada...
    schtasks /create /tn "Agente Local Vercept" /tr "%CD%\EXECUTAR_AGENTE.bat" /sc onlogon /rl highest /f
    
    if %errorlevel% equ 0 (
        echo ✅ Agente configurado para iniciar com Windows
    ) else (
        echo ⚠️  Não foi possível criar tarefa agendada
    )
)

echo.
echo ========================================
echo ✅ Instalação concluída!
echo ========================================
echo.
echo Para executar o agente:
echo   1. Execute: EXECUTAR_AGENTE.bat
echo   2. Ou execute: python agente_local.py
echo.
echo 📚 Documentação: README_AGENTE.md
echo.
pause
