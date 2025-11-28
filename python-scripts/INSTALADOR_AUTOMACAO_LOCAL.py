#!/usr/bin/env python3
"""
Instalador Automático de Automação Local
Configura o script de automação local para rodar automaticamente no boot
Suporta: Windows, macOS, Linux

Uso:
    python INSTALADOR_AUTOMACAO_LOCAL.py --server http://localhost:3000 --token SEU_TOKEN
"""

import os
import sys
import platform
import subprocess
import argparse
from pathlib import Path

class InstaladorAutomacao:
    """Instalador multiplataforma"""
    
    def __init__(self, server_url: str, api_token: str = None):
        self.server_url = server_url
        self.api_token = api_token
        self.sistema = platform.system()
        self.script_dir = Path(__file__).parent
        self.script_path = self.script_dir / 'automacao_local_generica.py'
    
    def instalar(self):
        """Instala automação local no sistema"""
        print(f'🚀 Instalando Automação Local')
        print(f'Sistema: {self.sistema}')
        print(f'Servidor: {self.server_url}')
        print()
        
        if self.sistema == 'Windows':
            return self.instalar_windows()
        elif self.sistema == 'Darwin':  # macOS
            return self.instalar_macos()
        elif self.sistema == 'Linux':
            return self.instalar_linux()
        else:
            print(f'❌ Sistema não suportado: {self.sistema}')
            return False
    
    def instalar_windows(self):
        """Instala no Windows (Task Scheduler)"""
        print('📦 Instalando no Windows...')
        
        try:
            # Criar arquivo .bat para executar o script
            bat_path = self.script_dir / 'automacao_local.bat'
            
            bat_content = f'''@echo off
python "{self.script_path}" --server "{self.server_url}" --token "{self.api_token or ''}"
'''
            
            with open(bat_path, 'w') as f:
                f.write(bat_content)
            
            print(f'✅ Arquivo .bat criado: {bat_path}')
            
            # Criar tarefa no Task Scheduler
            task_name = 'AutomacaoLocal'
            
            # XML da tarefa
            task_xml = f'''<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>{bat_path}</Command>
    </Exec>
  </Actions>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
  </Settings>
</Task>'''
            
            xml_path = self.script_dir / 'task.xml'
            with open(xml_path, 'w', encoding='utf-16') as f:
                f.write(task_xml)
            
            # Registrar tarefa
            cmd = f'schtasks /create /tn "{task_name}" /xml "{xml_path}" /f'
            subprocess.run(cmd, shell=True, check=True)
            
            print(f'✅ Tarefa agendada criada: {task_name}')
            print()
            print('🎉 Instalação concluída!')
            print(f'A automação local será executada automaticamente no login.')
            print()
            print('Comandos úteis:')
            print(f'  Iniciar agora:  schtasks /run /tn "{task_name}"')
            print(f'  Parar:          schtasks /end /tn "{task_name}"')
            print(f'  Desinstalar:    schtasks /delete /tn "{task_name}" /f')
            
            return True
            
        except Exception as e:
            print(f'❌ Erro na instalação: {e}')
            return False
    
    def instalar_macos(self):
        """Instala no macOS (LaunchAgent)"""
        print('🍎 Instalando no macOS...')
        
        try:
            # Criar arquivo plist
            plist_name = 'com.automacao.local.plist'
            plist_path = Path.home() / 'Library' / 'LaunchAgents' / plist_name
            
            plist_path.parent.mkdir(parents=True, exist_ok=True)
            
            plist_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.automacao.local</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>{self.script_path}</string>
        <string>--server</string>
        <string>{self.server_url}</string>
        <string>--token</string>
        <string>{self.api_token or ''}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{Path.home()}/Library/Logs/automacao_local.log</string>
    <key>StandardErrorPath</key>
    <string>{Path.home()}/Library/Logs/automacao_local_error.log</string>
</dict>
</plist>'''
            
            with open(plist_path, 'w') as f:
                f.write(plist_content)
            
            print(f'✅ LaunchAgent criado: {plist_path}')
            
            # Carregar LaunchAgent
            subprocess.run(['launchctl', 'load', str(plist_path)], check=True)
            
            print(f'✅ LaunchAgent carregado')
            print()
            print('🎉 Instalação concluída!')
            print(f'A automação local será executada automaticamente no login.')
            print()
            print('Comandos úteis:')
            print(f'  Parar:          launchctl unload {plist_path}')
            print(f'  Iniciar:        launchctl load {plist_path}')
            print(f'  Ver logs:       tail -f ~/Library/Logs/automacao_local.log')
            
            return True
            
        except Exception as e:
            print(f'❌ Erro na instalação: {e}')
            return False
    
    def instalar_linux(self):
        """Instala no Linux (systemd)"""
        print('🐧 Instalando no Linux...')
        
        try:
            # Criar arquivo de serviço systemd
            service_name = 'automacao-local.service'
            service_path = Path.home() / '.config' / 'systemd' / 'user' / service_name
            
            service_path.parent.mkdir(parents=True, exist_ok=True)
            
            service_content = f'''[Unit]
Description=Automação Local
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 {self.script_path} --server "{self.server_url}" --token "{self.api_token or ''}"
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
'''
            
            with open(service_path, 'w') as f:
                f.write(service_content)
            
            print(f'✅ Serviço systemd criado: {service_path}')
            
            # Recarregar systemd
            subprocess.run(['systemctl', '--user', 'daemon-reload'], check=True)
            
            # Habilitar serviço
            subprocess.run(['systemctl', '--user', 'enable', service_name], check=True)
            
            # Iniciar serviço
            subprocess.run(['systemctl', '--user', 'start', service_name], check=True)
            
            print(f'✅ Serviço habilitado e iniciado')
            print()
            print('🎉 Instalação concluída!')
            print(f'A automação local está rodando agora.')
            print()
            print('Comandos úteis:')
            print(f'  Status:         systemctl --user status {service_name}')
            print(f'  Parar:          systemctl --user stop {service_name}')
            print(f'  Reiniciar:      systemctl --user restart {service_name}')
            print(f'  Ver logs:       journalctl --user -u {service_name} -f')
            print(f'  Desinstalar:    systemctl --user disable {service_name}')
            
            return True
            
        except Exception as e:
            print(f'❌ Erro na instalação: {e}')
            print()
            print('💡 Dica: Certifique-se de que systemd está instalado.')
            print('   Alternativamente, adicione ao crontab:')
            print(f'   @reboot python3 {self.script_path} --server "{self.server_url}" --token "{self.api_token or ""}"')
            return False


def main():
    parser = argparse.ArgumentParser(description='Instalador de Automação Local')
    parser.add_argument('--server', required=True, help='URL do servidor')
    parser.add_argument('--token', help='Token de autenticação (opcional)')
    
    args = parser.parse_args()
    
    instalador = InstaladorAutomacao(args.server, args.token)
    
    sucesso = instalador.instalar()
    
    sys.exit(0 if sucesso else 1)


if __name__ == '__main__':
    main()
