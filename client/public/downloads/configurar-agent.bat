@echo off
chcp 65001 >nul
cls

echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║     🖥️  CONFIGURAÇÃO AUTOMÁTICA DO DESKTOP AGENT         ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

cd /d C:\Users\rudpa\DesktopAgent

echo 📝 Criando arquivo de configuração...
echo.

(
echo {
echo   "server": {
echo     "url": "wss://3001-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer",
echo     "max_reconnect_attempts": 10
echo   },
echo   "agent": {
echo     "token": "DESKTOP_AGENT_REGISTER_TOKEN",
echo     "device_name": "PC-Rudson",
echo     "platform": "Windows 11",
echo     "version": "1.0.0"
echo   },
echo   "heartbeat": {
echo     "interval": 30,
echo     "timeout": 90
echo   }
echo }
) > config.json

echo ✅ Arquivo config.json criado com sucesso!
echo.
echo 🚀 Iniciando Desktop Agent...
echo.

python agent.py

pause
