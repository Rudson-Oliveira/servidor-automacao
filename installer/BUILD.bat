@echo off
REM ========================================
REM BUILD MANUS DESKTOP AGENT INSTALLER
REM ========================================

echo.
echo ========================================
echo  BUILD MANUS DESKTOP AGENT INSTALLER
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado
    echo Por favor, instale Python 3.8 ou superior
    pause
    exit /b 1
)

echo Python encontrado!
echo.

REM Executar script de build
python build_installer.py

if errorlevel 1 (
    echo.
    echo ERRO: Build falhou
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo O instalador esta em: dist\ManusDesktopAgentInstaller.exe
echo.

pause
