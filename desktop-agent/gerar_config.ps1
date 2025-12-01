# ========================================
# GERADOR DE CONFIG.JSON - WINDOWS SAFE
# ========================================
# Este script cria config.json SEM BOM (Byte Order Mark)
# Compatível com Python JSON parser

param(
    [string]$Token = "",
    [string]$DeviceName = "",
    [string]$ServerUrl = "wss://automacao-ws-alejofy2.manus.space/desktop-agent"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GERADOR DE CONFIG.JSON - WINDOWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detectar nome do dispositivo automaticamente se não fornecido
if ([string]::IsNullOrEmpty($DeviceName)) {
    $DeviceName = $env:COMPUTERNAME
}

# Solicitar token se não fornecido
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "[INFO] Token de autenticacao necessario" -ForegroundColor Yellow
    Write-Host "[INFO] Obtenha seu token em: https://automacao-api-alejofy2.manus.space/desktop/agents" -ForegroundColor Yellow
    Write-Host ""
    $Token = Read-Host "Digite o token (64 caracteres)"
    
    if ([string]::IsNullOrEmpty($Token)) {
        Write-Host "[ERRO] Token nao pode ser vazio!" -ForegroundColor Red
        Write-Host ""
        Read-Host "Pressione ENTER para sair"
        exit 1
    }
}

# Validar comprimento do token
if ($Token.Length -ne 64) {
    Write-Host "[AVISO] Token deve ter 64 caracteres (atual: $($Token.Length))" -ForegroundColor Yellow
    Write-Host "[INFO] Continuando mesmo assim..." -ForegroundColor Yellow
    Write-Host ""
}

# Detectar versão do Windows
$WindowsVersion = (Get-WmiObject -Class Win32_OperatingSystem).Caption

# Criar JSON manualmente (sem BOM)
$configJson = @"
{
  "server": {
    "url": "$ServerUrl",
    "max_reconnect_attempts": 10
  },
  "agent": {
    "token": "$Token",
    "device_name": "$DeviceName",
    "platform": "$WindowsVersion",
    "version": "2.1.0"
  },
  "heartbeat": {
    "interval": 30,
    "timeout": 90
  },
  "logging": {
    "level": "INFO"
  }
}
"@

# Caminho do arquivo
$configPath = Join-Path $PSScriptRoot "config.json"

try {
    # CRÍTICO: Usar UTF8Encoding sem BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($configPath, $configJson, $utf8NoBom)
    
    Write-Host "[OK] Config.json criado com sucesso!" -ForegroundColor Green
    Write-Host "[OK] Arquivo: $configPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "[INFO] Configuracao:" -ForegroundColor Cyan
    Write-Host "  - Dispositivo: $DeviceName" -ForegroundColor White
    Write-Host "  - Plataforma: $WindowsVersion" -ForegroundColor White
    Write-Host "  - Servidor: $ServerUrl" -ForegroundColor White
    Write-Host "  - Token: $($Token.Substring(0, 16))..." -ForegroundColor White
    Write-Host ""
    
    # Validar que foi criado sem BOM
    $bytes = [System.IO.File]::ReadAllBytes($configPath)
    $hasBom = ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    
    if ($hasBom) {
        Write-Host "[AVISO] Arquivo criado COM BOM (nao esperado)" -ForegroundColor Yellow
        Write-Host "[INFO] Agent.py deve conseguir ler mesmo assim" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Arquivo criado SEM BOM (correto!)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "[INFO] Proximo passo: Execute 'python agent.py'" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "[ERRO] Falha ao criar config.json: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

# Pausar se executado diretamente (não via script)
if ($Host.Name -eq "ConsoleHost") {
    Read-Host "Pressione ENTER para continuar"
}
