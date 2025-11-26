@echo off
chcp 65001 >nul
echo ======================================================================
echo 🔧 CORREÇÃO AUTOMÁTICA - desktop_capture.py
echo ======================================================================
echo.

echo 📝 Corrigindo arquivo C:\Comet\desktop_capture.py...
echo.

cd C:\Comet

:: Fazer backup
echo 💾 Criando backup...
copy desktop_capture.py desktop_capture.py.backup >nul
echo ✅ Backup criado: desktop_capture.py.backup
echo.

:: Corrigir linha do endpoint
echo 🔧 Corrigindo endpoint da API...
powershell -Command "(Get-Content desktop_capture.py) -replace '/api/desktop/capturar', '/api/trpc/desktop.capturar' | Set-Content desktop_capture_temp.py"
move /Y desktop_capture_temp.py desktop_capture.py >nul
echo ✅ Endpoint corrigido: /api/trpc/desktop.capturar
echo.

:: Corrigir formato JSON
echo 🔧 Corrigindo formato JSON para tRPC...
powershell -Command "(Get-Content desktop_capture.py) -replace 'json=payload,', 'json={\"\"json\"\": payload},' | Set-Content desktop_capture_temp.py"
move /Y desktop_capture_temp.py desktop_capture.py >nul
echo ✅ Formato JSON corrigido
echo.

:: Corrigir URL da API
echo 🔧 Configurando URL da API...
powershell -Command "(Get-Content desktop_capture.py) -replace 'API_URL = \"\"http://localhost:3000\"\"', 'API_URL = \"\"https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer\"\"' | Set-Content desktop_capture_temp.py"
move /Y desktop_capture_temp.py desktop_capture.py >nul
echo ✅ URL configurada
echo.

echo ======================================================================
echo ✅ CORREÇÃO CONCLUÍDA!
echo ======================================================================
echo.
echo 📂 Arquivo corrigido: C:\Comet\desktop_capture.py
echo 💾 Backup salvo em: C:\Comet\desktop_capture.py.backup
echo.
echo 🚀 PRÓXIMO PASSO:
echo    Execute: python desktop_capture.py
echo.
echo ======================================================================
echo.
pause
