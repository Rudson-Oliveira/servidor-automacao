#!/usr/bin/env python3
"""
CONFIGURADOR DE AGENDAMENTO AUTOMÁTICO
Configura o Task Scheduler do Windows para executar capturas automaticamente
"""

import os
import sys
import subprocess
from pathlib import Path

print("=" * 70)
print("⏰ CONFIGURADOR DE AGENDAMENTO AUTOMÁTICO")
print("   Desktop Capture - Execução a cada 30 minutos")
print("=" * 70)
print()

# Verificar se está no Windows
if sys.platform != 'win32':
    print("❌ Este script funciona apenas no Windows!")
    input("Pressione ENTER para sair...")
    sys.exit(1)

# Verificar se C:\Comet existe
comet_dir = Path("C:/Comet")
if not comet_dir.exists():
    print("❌ Pasta C:\\Comet não encontrada!")
    print("   Execute primeiro: INSTALADOR_COMPLETO_DESKTOP_CAPTURE.py")
    input("Pressione ENTER para sair...")
    sys.exit(1)

desktop_capture = comet_dir / "desktop_capture.py"
if not desktop_capture.exists():
    print("❌ Arquivo desktop_capture.py não encontrado!")
    input("Pressione ENTER para sair...")
    sys.exit(1)

print("✅ Arquivos encontrados!")
print()

# Criar arquivo .bat para executar o script
print("📝 Criando arquivo executável...")

bat_file = comet_dir / "executar_captura.bat"
bat_content = f'''@echo off
cd /d C:\\Comet
python desktop_capture.py
'''

with open(bat_file, "w") as f:
    f.write(bat_content)

print(f"✅ Criado: {bat_file}")
print()

# Criar tarefa no Task Scheduler
print("⏰ Configurando Task Scheduler...")
print()

task_name = "DesktopCapture_Comet"
python_exe = sys.executable

# XML da tarefa
task_xml = f'''<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Captura automática de tela a cada 30 minutos para Comet Vision</Description>
    <Author>Comet Desktop Capture</Author>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <Repetition>
        <Interval>PT30M</Interval>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2025-01-01T00:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT5M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>{python_exe}</Command>
      <Arguments>C:\\Comet\\desktop_capture.py</Arguments>
      <WorkingDirectory>C:\\Comet</WorkingDirectory>
    </Exec>
  </Actions>
</Task>'''

# Salvar XML
xml_file = comet_dir / "task_schedule.xml"
with open(xml_file, "w", encoding="utf-16") as f:
    f.write(task_xml)

print(f"✅ XML criado: {xml_file}")
print()

# Registrar tarefa
print("📋 Registrando tarefa no Windows...")
print()

try:
    # Deletar tarefa existente (se houver)
    subprocess.run(
        ["schtasks", "/Delete", "/TN", task_name, "/F"],
        capture_output=True,
        check=False
    )
    
    # Criar nova tarefa
    resultado = subprocess.run(
        ["schtasks", "/Create", "/TN", task_name, "/XML", str(xml_file)],
        capture_output=True,
        text=True
    )
    
    if resultado.returncode == 0:
        print("✅ Tarefa registrada com sucesso!")
    else:
        print("⚠️  Erro ao registrar tarefa:")
        print(resultado.stderr)
        print()
        print("💡 SOLUÇÃO ALTERNATIVA:")
        print("   1. Abra o 'Agendador de Tarefas' do Windows")
        print("   2. Clique em 'Importar Tarefa'")
        print(f"   3. Selecione: {xml_file}")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    print()
    print("💡 Execute este script como ADMINISTRADOR")

print()
print("=" * 70)
print("✅ CONFIGURAÇÃO CONCLUÍDA!")
print("=" * 70)
print()
print("⏰ AGENDAMENTO CONFIGURADO:")
print("   • Frequência: A cada 30 minutos")
print("   • Início: Imediatamente")
print("   • Execução: Em segundo plano")
print()
print("🔍 VERIFICAR STATUS:")
print("   1. Abra o 'Agendador de Tarefas' do Windows")
print("   2. Procure por: DesktopCapture_Comet")
print("   3. Clique com botão direito → 'Executar' para testar")
print()
print("🛑 DESATIVAR:")
print("   1. Agendador de Tarefas")
print("   2. Clique com botão direito em 'DesktopCapture_Comet'")
print("   3. Selecione 'Desabilitar' ou 'Excluir'")
print()
print("=" * 70)
print()
input("Pressione ENTER para finalizar...")
