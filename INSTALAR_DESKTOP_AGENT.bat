@echo off
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
echo 1. Edite o arquivo agent.py
echo 2. Configure o TOKEN e SERVER_URL
echo 3. Execute: python agent.py
echo.
pause
