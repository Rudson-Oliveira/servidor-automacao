@echo off
chcp 65001 >nul
title Instalador Desktop Agent - Servidor de Automação
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  🚀 INSTALADOR DESKTOP AGENT - SERVIDOR DE AUTOMAÇÃO  🚀    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Verificando Python...
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Python não encontrado!
    echo.
    echo Por favor, instale Python primeiro:
    echo 👉 https://www.python.org/downloads/
    echo.
    echo IMPORTANTE: Marque a opção "Add Python to PATH" durante a instalação!
    echo.
    pause
    exit /b 1
)

echo ✅ Python encontrado!
echo.
echo Iniciando instalação...
echo.

REM Executar o instalador Python
python "%~dp0instalador_automatico.py"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro durante a instalação!
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Instalação concluída!
echo.
pause
