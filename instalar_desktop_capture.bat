@echo off
REM ========================================
REM Instalador Automático - Desktop Capture
REM Comet Vision - Manus
REM ========================================

echo.
echo ========================================
echo  INSTALADOR DESKTOP CAPTURE
echo  Comet Vision - Manus
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.8+ de: https://www.python.org/downloads/
    echo Certifique-se de marcar "Add Python to PATH" durante a instalacao.
    echo.
    pause
    exit /b 1
)

echo [OK] Python encontrado:
python --version
echo.

REM Verificar se pip está instalado
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] pip nao encontrado!
    echo.
    echo Reinstale o Python e certifique-se de incluir pip.
    echo.
    pause
    exit /b 1
)

echo [OK] pip encontrado:
pip --version
echo.

REM Instalar dependências
echo ========================================
echo  INSTALANDO DEPENDENCIAS...
echo ========================================
echo.

pip install -r requirements_desktop_capture.txt

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao instalar dependencias!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo.
echo 1. Edite desktop_capture.py e configure a URL da API:
echo    - Para uso local: API_URL = "http://localhost:3000"
echo    - Para uso remoto: API_URL = "https://seu-servidor.manus.space"
echo.
echo 2. Execute o script de captura:
echo    python desktop_capture.py
echo.
echo 3. (Opcional) Configure agendamento automatico:
echo    - Execute: setup_scheduler.bat
echo.
pause
