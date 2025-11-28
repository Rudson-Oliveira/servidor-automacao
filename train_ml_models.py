#!/usr/bin/env python3
"""
Script para treinar modelos ML de predição de anomalias
Coleta dados históricos e treina modelos LSTM para CPU e memória
"""

import requests
import json
import time
from datetime import datetime

# Configuração
API_BASE_URL = "http://localhost:3000"
API_KEY = "comet_key_1732727893481_a1b2c3d4e5f6"

def train_model(metric_name: str, component: str = "system"):
    """Treina modelo ML para uma métrica específica"""
    print(f"\n{'='*60}")
    print(f"🧠 Treinando modelo ML para: {metric_name}")
    print(f"{'='*60}")
    
    url = f"{API_BASE_URL}/api/trpc/ml.train"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }
    
    payload = {
        "metricName": metric_name,
        "component": component
    }
    
    try:
        print(f"📡 Enviando requisição para {url}...")
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Modelo treinado com sucesso!")
            print(f"📊 Resultado:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return result
        else:
            print(f"❌ Erro ao treinar modelo: {response.status_code}")
            print(f"Resposta: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print(f"⏱️ Timeout ao treinar modelo (pode estar processando em background)")
        return None
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return None

def get_ml_predictions(metric_name: str, component: str = "system"):
    """Busca predições do modelo ML"""
    print(f"\n🔮 Buscando predições para: {metric_name}")
    
    url = f"{API_BASE_URL}/api/trpc/ml.predict"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }
    
    payload = {
        "metricName": metric_name,
        "component": component
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Predições obtidas!")
            print(f"📈 Resultado:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            return result
        else:
            print(f"⚠️ Modelo ainda não treinado ou sem dados suficientes")
            return None
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return None

def main():
    print("="*60)
    print("🚀 TREINAMENTO DE MODELOS ML - SISTEMA DE AUTOMAÇÃO")
    print("="*60)
    print(f"⏰ Início: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Lista de métricas para treinar
    metrics = [
        {"name": "cpu_usage", "component": "system"},
        {"name": "memory_usage", "component": "system"}
    ]
    
    results = []
    
    for metric in metrics:
        result = train_model(metric["name"], metric["component"])
        if result:
            results.append({
                "metric": metric["name"],
                "status": "success",
                "result": result
            })
            
            # Aguardar um pouco entre treinamentos
            print("\n⏳ Aguardando 5 segundos antes do próximo treinamento...")
            time.sleep(5)
            
            # Buscar predições
            get_ml_predictions(metric["name"], metric["component"])
        else:
            results.append({
                "metric": metric["name"],
                "status": "failed"
            })
    
    # Resumo final
    print("\n" + "="*60)
    print("📊 RESUMO DO TREINAMENTO")
    print("="*60)
    
    success_count = sum(1 for r in results if r["status"] == "success")
    total_count = len(results)
    
    print(f"✅ Modelos treinados com sucesso: {success_count}/{total_count}")
    print(f"⏰ Fim: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if success_count == total_count:
        print("\n🎉 TODOS OS MODELOS FORAM TREINADOS COM SUCESSO!")
        print("🔮 Sistema agora pode fazer predições de anomalias")
        print("🛡️ Auto-healing preventivo ativado")
    else:
        print("\n⚠️ Alguns modelos falharam no treinamento")
        print("💡 Verifique se há dados históricos suficientes")

if __name__ == "__main__":
    main()
