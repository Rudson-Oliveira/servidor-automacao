@echo off
REM ========================================
REM Configurador de Agendamento Automático
REM Task Scheduler - Windows
REM ========================================

echo.
echo ========================================
echo  CONFIGURADOR DE AGENDAMENTO AUTOMATICO
echo  Comet Vision - Desktop Capture
echo ========================================
echo.

REM Verificar se está rodando como administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Este script precisa ser executado como Administrador!
    echo.
    echo Clique com botao direito e selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [OK] Executando como Administrador
echo.

REM Obter diretório atual
set "SCRIPT_DIR=%~dp0"
set "PYTHON_SCRIPT=%SCRIPT_DIR%desktop_scheduler.py"

REM Verificar se o script Python existe
if not exist "%PYTHON_SCRIPT%" (
    echo [ERRO] Arquivo desktop_scheduler.py nao encontrado!
    echo.
    echo Certifique-se de que este arquivo .bat esta no mesmo diretorio que desktop_scheduler.py
    echo.
    pause
    exit /b 1
)

echo [OK] Script Python encontrado: %PYTHON_SCRIPT%
echo.

REM Obter caminho do Python
for /f "tokens=*" %%i in ('where python') do set PYTHON_PATH=%%i

if "%PYTHON_PATH%"=="" (
    echo [ERRO] Python nao encontrado no PATH!
    echo.
    echo Instale Python e certifique-se de adiciona-lo ao PATH.
    echo.
    pause
    exit /b 1
)

echo [OK] Python encontrado: %PYTHON_PATH%
echo.

REM Nome da tarefa
set "TASK_NAME=Comet_Desktop_Capture"

REM Verificar se tarefa já existe
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] Tarefa "%TASK_NAME%" ja existe!
    echo.
    choice /C SN /M "Deseja substituir a tarefa existente?"
    if errorlevel 2 (
        echo.
        echo Operacao cancelada pelo usuario.
        pause
        exit /b 0
    )
    
    echo.
    echo Removendo tarefa existente...
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
)

echo.
echo ========================================
echo  CRIANDO TAREFA AGENDADA
echo ========================================
echo.

REM Criar tarefa que inicia com o Windows
schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "\"%PYTHON_PATH%\" \"%PYTHON_SCRIPT%\"" ^
    /sc onlogon ^
    /rl highest ^
    /f

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao criar tarefa agendada!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  TAREFA CRIADA COM SUCESSO!
echo ========================================
echo.
echo Nome da tarefa: %TASK_NAME%
echo Script: %PYTHON_SCRIPT%
echo Gatilho: Ao fazer login no Windows
echo.
echo A tarefa sera executada automaticamente quando voce fizer login.
echo.
echo Para gerenciar a tarefa:
echo 1. Abra o "Agendador de Tarefas" do Windows
echo 2. Procure por "%TASK_NAME%"
echo 3. Clique com botao direito para Executar, Desabilitar ou Excluir
echo.
echo Para iniciar a tarefa agora:
choice /C SN /M "Deseja iniciar a captura automatica agora?"
if errorlevel 2 (
    echo.
    echo Tarefa configurada. Sera iniciada no proximo login.
    pause
    exit /b 0
)

echo.
echo Iniciando tarefa...
schtasks /run /tn "%TASK_NAME%"

echo.
echo ========================================
echo  TAREFA INICIADA!
echo ========================================
echo.
echo O script esta rodando em segundo plano.
echo.
echo Para ver os logs:
echo - Abra: %USERPROFILE%\Desktop\comet_captures\scheduler.log
echo.
echo Para parar a tarefa:
echo - Abra o Agendador de Tarefas
echo - Procure por "%TASK_NAME%"
echo - Clique com botao direito e selecione "Finalizar"
echo.
pause
