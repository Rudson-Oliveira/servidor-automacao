#!/usr/bin/env python3
"""
Script de Agendamento Automático - Desktop Capture
Executa capturas periódicas e gera relatórios de produtividade
"""

import os
import sys
import time
import json
import schedule
from datetime import datetime, timedelta
from collections import defaultdict

# Importar funções do desktop_capture
try:
    from desktop_capture import (
        capturar_screenshot,
        listar_programas_abertos,
        obter_janelas_ativas,
        salvar_local,
        enviar_para_api,
    )
except ImportError:
    print("❌ ERRO: Não foi possível importar desktop_capture.py")
    print("Certifique-se de que desktop_capture.py está no mesmo diretório.")
    sys.exit(1)

# ========================================
# CONFIGURAÇÕES
# ========================================

# Intervalo entre capturas (em minutos)
INTERVALO_CAPTURA = 30  # Capturar a cada 30 minutos

# Gerar relatório semanal automaticamente?
GERAR_RELATORIO_SEMANAL = True

# Dia da semana para gerar relatório (0=Segunda, 6=Domingo)
DIA_RELATORIO = 0  # Segunda-feira

# Hora para gerar relatório (formato 24h)
HORA_RELATORIO = "09:00"

# Diretório para relatórios
RELATORIO_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "comet_relatorios")

# Arquivo de log de execuções
LOG_FILE = os.path.join(os.path.expanduser("~"), "Desktop", "comet_captures", "scheduler.log")

# ========================================
# FUNÇÕES
# ========================================

def log_message(message):
    """
    Registra mensagem no log
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}\n"
    
    # Criar diretório se não existir
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    # Escrever no arquivo
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(log_entry)
    
    # Também imprimir no console
    print(log_entry.strip())


def executar_captura():
    """
    Executa uma captura completa
    """
    try:
        log_message("Iniciando captura automática...")
        
        # Capturar screenshot
        imagem = capturar_screenshot()
        if not imagem:
            log_message("❌ Falha ao capturar screenshot")
            return
        
        # Listar programas
        programas = listar_programas_abertos()
        
        # Obter janelas
        janelas = obter_janelas_ativas()
        
        # Salvar localmente
        salvar_local(imagem, programas, janelas)
        
        # Enviar para API
        sucesso = enviar_para_api(imagem, programas, janelas)
        
        if sucesso:
            log_message(f"✅ Captura concluída: {len(programas)} programas, {len(janelas)} janelas")
        else:
            log_message("⚠️ Captura salva localmente, mas API não recebeu")
        
    except Exception as e:
        log_message(f"❌ Erro durante captura: {e}")


def analisar_historico():
    """
    Analisa histórico de capturas locais
    Retorna estatísticas de uso
    """
    from PIL import Image
    import glob
    
    # Diretório de capturas
    captures_dir = os.path.join(os.path.expanduser("~"), "Desktop", "comet_captures")
    
    # Buscar arquivos JSON
    json_files = glob.glob(os.path.join(captures_dir, "dados_*.json"))
    
    if not json_files:
        return None
    
    # Estatísticas
    stats = {
        "total_capturas": len(json_files),
        "programas_count": defaultdict(int),
        "programas_memoria": defaultdict(list),
        "janelas_count": defaultdict(int),
        "periodo": {
            "inicio": None,
            "fim": None,
        },
    }
    
    for json_file in json_files:
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                dados = json.load(f)
            
            # Timestamp
            timestamp = dados.get("timestamp", "")
            if timestamp:
                if not stats["periodo"]["inicio"] or timestamp < stats["periodo"]["inicio"]:
                    stats["periodo"]["inicio"] = timestamp
                if not stats["periodo"]["fim"] or timestamp > stats["periodo"]["fim"]:
                    stats["periodo"]["fim"] = timestamp
            
            # Programas
            for prog in dados.get("programas", []):
                nome = prog.get("nome", "")
                stats["programas_count"][nome] += 1
                
                memoria = prog.get("memoria_mb", 0)
                if memoria:
                    stats["programas_memoria"][nome].append(memoria)
            
            # Janelas
            for jan in dados.get("janelas", []):
                processo = jan.get("processo", "")
                if processo:
                    stats["janelas_count"][processo] += 1
        
        except Exception as e:
            print(f"Erro ao processar {json_file}: {e}")
            continue
    
    return stats


def gerar_relatorio_semanal():
    """
    Gera relatório semanal de produtividade
    """
    try:
        log_message("Gerando relatório semanal...")
        
        # Analisar histórico
        stats = analisar_historico()
        
        if not stats:
            log_message("⚠️ Nenhum dado disponível para relatório")
            return
        
        # Criar diretório de relatórios
        os.makedirs(RELATORIO_DIR, exist_ok=True)
        
        # Nome do arquivo
        hoje = datetime.now().strftime("%Y%m%d")
        relatorio_file = os.path.join(RELATORIO_DIR, f"relatorio_semanal_{hoje}.txt")
        
        # Gerar conteúdo
        conteudo = []
        conteudo.append("=" * 70)
        conteudo.append("RELATÓRIO SEMANAL DE PRODUTIVIDADE - COMET VISION")
        conteudo.append("=" * 70)
        conteudo.append("")
        
        # Período
        conteudo.append(f"📅 PERÍODO:")
        conteudo.append(f"   Início: {stats['periodo']['inicio']}")
        conteudo.append(f"   Fim: {stats['periodo']['fim']}")
        conteudo.append("")
        
        # Total de capturas
        conteudo.append(f"📊 ESTATÍSTICAS GERAIS:")
        conteudo.append(f"   Total de capturas: {stats['total_capturas']}")
        conteudo.append("")
        
        # Top 10 programas mais usados
        conteudo.append("🔝 TOP 10 PROGRAMAS MAIS USADOS:")
        top_programas = sorted(
            stats['programas_count'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        for i, (nome, count) in enumerate(top_programas, 1):
            # Calcular média de memória
            memorias = stats['programas_memoria'].get(nome, [])
            media_memoria = sum(memorias) / len(memorias) if memorias else 0
            
            conteudo.append(f"   {i}. {nome}")
            conteudo.append(f"      Aparições: {count} vezes")
            conteudo.append(f"      Memória média: {media_memoria:.1f} MB")
            conteudo.append("")
        
        # Top 5 janelas mais abertas
        conteudo.append("🪟 TOP 5 JANELAS MAIS ABERTAS:")
        top_janelas = sorted(
            stats['janelas_count'].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        for i, (processo, count) in enumerate(top_janelas, 1):
            conteudo.append(f"   {i}. {processo} - {count} vezes")
        
        conteudo.append("")
        conteudo.append("=" * 70)
        conteudo.append(f"Relatório gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        conteudo.append("=" * 70)
        
        # Salvar arquivo
        with open(relatorio_file, "w", encoding="utf-8") as f:
            f.write("\n".join(conteudo))
        
        log_message(f"✅ Relatório salvo em: {relatorio_file}")
        
        # Também salvar em JSON para processamento posterior
        json_file = relatorio_file.replace(".txt", ".json")
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2, ensure_ascii=False, default=str)
        
        log_message(f"✅ Dados JSON salvos em: {json_file}")
        
    except Exception as e:
        log_message(f"❌ Erro ao gerar relatório: {e}")


# ========================================
# AGENDAMENTO
# ========================================

def configurar_agendamento():
    """
    Configura tarefas agendadas
    """
    # Captura periódica
    schedule.every(INTERVALO_CAPTURA).minutes.do(executar_captura)
    log_message(f"✅ Captura automática configurada: a cada {INTERVALO_CAPTURA} minutos")
    
    # Relatório semanal
    if GERAR_RELATORIO_SEMANAL:
        # Agendar para o dia da semana especificado
        if DIA_RELATORIO == 0:
            schedule.every().monday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        elif DIA_RELATORIO == 1:
            schedule.every().tuesday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        elif DIA_RELATORIO == 2:
            schedule.every().wednesday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        elif DIA_RELATORIO == 3:
            schedule.every().thursday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        elif DIA_RELATORIO == 4:
            schedule.every().friday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        elif DIA_RELATORIO == 5:
            schedule.every().saturday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        elif DIA_RELATORIO == 6:
            schedule.every().sunday.at(HORA_RELATORIO).do(gerar_relatorio_semanal)
        
        dias_semana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
        log_message(f"✅ Relatório semanal configurado: {dias_semana[DIA_RELATORIO]} às {HORA_RELATORIO}")


# ========================================
# MAIN
# ========================================

def main():
    """
    Função principal
    """
    print("=" * 70)
    print("🤖 COMET VISION - AGENDAMENTO AUTOMÁTICO")
    print("=" * 70)
    print()
    
    log_message("Iniciando scheduler...")
    
    # Configurar agendamento
    configurar_agendamento()
    
    # Executar primeira captura imediatamente
    log_message("Executando primeira captura...")
    executar_captura()
    
    print()
    print("=" * 70)
    print("✅ SCHEDULER ATIVO")
    print("=" * 70)
    print()
    print(f"⏰ Próximas capturas: a cada {INTERVALO_CAPTURA} minutos")
    print(f"📊 Relatório semanal: {'Habilitado' if GERAR_RELATORIO_SEMANAL else 'Desabilitado'}")
    print(f"📝 Logs: {LOG_FILE}")
    print()
    print("Pressione Ctrl+C para parar")
    print("=" * 70)
    print()
    
    # Loop principal
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Scheduler interrompido pelo usuário")
        log_message("Scheduler finalizado pelo usuário")


if __name__ == "__main__":
    # Instalar schedule se não estiver instalado
    try:
        import schedule
    except ImportError:
        print("❌ Biblioteca 'schedule' não instalada")
        print("\nInstalando...")
        os.system("pip install schedule")
        import schedule
    
    main()
