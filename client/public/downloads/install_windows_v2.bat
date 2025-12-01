@echo off
chcp 65001 > nul
cls

echo ============================================================
echo.
echo      INSTALADOR DESKTOP AGENT - WINDOWS v2.1
echo      Correcao UTF-8 Aplicada
echo.
echo ============================================================
echo.

REM Verificar Python
echo [INFO] Verificando instalacao do Python...
python --version > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo [INFO] Baixe Python em: https://www.python.org/downloads/
    echo [INFO] Durante instalacao, marque "Add Python to PATH"
    pause
    exit /b 1
)

echo [OK] Python encontrado
python --version
echo.

REM Criar diretório
echo [INFO] Criando diretorio C:\Manus\Desktop-Agent...
if not exist "C:\Manus\Desktop-Agent" mkdir "C:\Manus\Desktop-Agent"
echo [OK] Diretorio criado
echo.

REM Instalar dependências
echo [INFO] Instalando dependencias...
python -m pip install --upgrade pip > nul 2>&1
pip install websocket-client pillow requests > nul 2>&1
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

REM Baixar arquivos
echo [INFO] Baixando arquivos do servidor...

REM Baixar agent.py corrigido
powershell -Command "Invoke-WebRequest -Uri 'https://automacao-api-alejofy2.manus.space/api/download-secure/agent.py?token=manus-agent-download-2024' -OutFile 'C:\Manus\Desktop-Agent\agent.py'"
if errorlevel 1 (
    echo [ERRO] Falha ao baixar agent.py
    pause
    exit /b 1
)
echo [OK] agent.py baixado (versao corrigida UTF-8)

REM Baixar config.json
powershell -Command "Invoke-WebRequest -Uri 'https://automacao-api-alejofy2.manus.space/api/download-secure/config.json?token=manus-agent-download-2024' -OutFile 'C:\Manus\Desktop-Agent\config.json'"
if errorlevel 1 (
    echo [ERRO] Falha ao baixar config.json
    pause
    exit /b 1
)
echo [OK] config.json baixado
echo.

REM Criar executável
echo [INFO] Criando executavel iniciar_agent.bat...
(
echo @echo off
echo chcp 65001 ^> nul
echo cd /d C:\Manus\Desktop-Agent
echo python agent.py
echo pause
) > "C:\Manus\Desktop-Agent\iniciar_agent.bat"
echo [OK] Executavel criado
echo.

REM Criar atalho na área de trabalho
echo [INFO] Criando atalho na area de trabalho...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Desktop Agent.lnk'); $Shortcut.TargetPath = 'C:\Manus\Desktop-Agent\iniciar_agent.bat'; $Shortcut.WorkingDirectory = 'C:\Manus\Desktop-Agent'; $Shortcut.IconLocation = 'C:\Windows\System32\shell32.dll,13'; $Shortcut.Save()"
echo [OK] Atalho criado
echo.

echo ============================================================
echo.
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo.
echo ============================================================
echo.
echo [OK] Desktop Agent instalado em: C:\Manus\Desktop-Agent
echo [OK] Atalho criado na area de trabalho
echo.
echo COMO USAR:
echo 1. Clique duas vezes no atalho "Desktop Agent" na area de trabalho
echo 2. Ou execute: C:\Manus\Desktop-Agent\iniciar_agent.bat
echo.
echo CORRECOES APLICADAS:
echo - UTF-8 configurado automaticamente
echo - Banner ASCII compativel com Windows
echo - Emojis removidos
echo - Tratamento de erro de encoding
echo.
pause
