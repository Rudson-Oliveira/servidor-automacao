#!/usr/bin/env python3
"""
Stress Test - API REST (10 Workers Simultâneos)
================================================

Testa escalabilidade do servidor através de requisições REST simultâneas
ao invés de WebSocket (que requer infraestrutura externa).

Autor: Manus AI
Data: 01/Dezembro/2025
Versão: 1.0.0
"""

import asyncio
import aiohttp
import time
import statistics
from datetime import datetime
from typing import List, Dict, Any
import json

# ==================== CONFIGURAÇÃO ====================

BASE_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer"
NUM_WORKERS = 10
REQUESTS_PER_MINUTE = 100
TEST_DURATION_SECONDS = 60

# ==================== CLASSES ====================

class WorkerMetrics:
    """Métricas de performance de um worker"""
    
    def __init__(self, worker_id: int):
        self.worker_id = worker_id
        self.requests_sent = 0
        self.requests_success = 0
        self.requests_failed = 0
        self.response_times: List[float] = []
        self.errors: List[str] = []
        self.status_codes: Dict[int, int] = {}
        self.start_time = None
        self.end_time = None
    
    def add_response_time(self, duration: float, status_code: int):
        """Adiciona tempo de resposta"""
        self.response_times.append(duration)
        self.status_codes[status_code] = self.status_codes.get(status_code, 0) + 1
    
    def add_error(self, error: str):
        """Adiciona erro"""
        self.errors.append(error)
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas"""
        if not self.response_times:
            return {
                "worker_id": self.worker_id,
                "requests_sent": self.requests_sent,
                "requests_success": self.requests_success,
                "requests_failed": self.requests_failed,
                "avg_response_time": 0,
                "min_response_time": 0,
                "max_response_time": 0,
                "p95_response_time": 0,
                "p99_response_time": 0,
                "errors": len(self.errors),
                "status_codes": self.status_codes,
                "duration": 0
            }
        
        sorted_times = sorted(self.response_times)
        p95_index = int(len(sorted_times) * 0.95)
        p99_index = int(len(sorted_times) * 0.99)
        
        duration = (self.end_time - self.start_time) if self.end_time and self.start_time else 0
        
        return {
            "worker_id": self.worker_id,
            "requests_sent": self.requests_sent,
            "requests_success": self.requests_success,
            "requests_failed": self.requests_failed,
            "avg_response_time": statistics.mean(self.response_times),
            "min_response_time": min(self.response_times),
            "max_response_time": max(self.response_times),
            "p95_response_time": sorted_times[p95_index] if p95_index < len(sorted_times) else 0,
            "p99_response_time": sorted_times[p99_index] if p99_index < len(sorted_times) else 0,
            "errors": len(self.errors),
            "status_codes": self.status_codes,
            "duration": duration
        }


class StressTestWorker:
    """Worker de stress test"""
    
    def __init__(self, worker_id: int, metrics: WorkerMetrics):
        self.worker_id = worker_id
        self.metrics = metrics
        self.session = None
        self.running = False
    
    async def make_request(self, endpoint: str, method: str = "GET", data: dict = None):
        """Faz requisição HTTP"""
        try:
            start_time = time.time()
            
            url = f"{BASE_URL}{endpoint}"
            
            if method == "GET":
                async with self.session.get(url) as response:
                    await response.text()
                    status = response.status
            elif method == "POST":
                async with self.session.post(url, json=data) as response:
                    await response.text()
                    status = response.status
            else:
                raise Exception(f"Método não suportado: {method}")
            
            end_time = time.time()
            response_time = end_time - start_time
            
            self.metrics.requests_sent += 1
            self.metrics.add_response_time(response_time, status)
            
            if 200 <= status < 300:
                self.metrics.requests_success += 1
            else:
                self.metrics.requests_failed += 1
            
            return True
        except Exception as e:
            self.metrics.requests_sent += 1
            self.metrics.requests_failed += 1
            self.metrics.add_error(f"Request error: {e}")
            return False
    
    async def run(self, duration: int):
        """Executa teste por X segundos"""
        self.running = True
        self.metrics.start_time = time.time()
        
        # Criar sessão HTTP
        timeout = aiohttp.ClientTimeout(total=10)
        self.session = aiohttp.ClientSession(timeout=timeout)
        
        # Calcular intervalo entre requisições (100 req/minuto = 0.6s)
        interval = 60.0 / REQUESTS_PER_MINUTE
        
        end_time = time.time() + duration
        
        print(f"[Worker {self.worker_id}] 🚀 Iniciando requisições (intervalo: {interval:.2f}s)")
        
        # Mix de endpoints para testar diferentes partes do sistema
        endpoints = [
            ("/api/status", "GET", None),
            ("/api/skills", "GET", None),
            ("/api/historico", "GET", None),
            ("/api/conversar", "POST", {"mensagem": "teste", "contexto": "stress test"}),
        ]
        
        request_count = 0
        while time.time() < end_time and self.running:
            # Alternar entre endpoints
            endpoint, method, data = endpoints[request_count % len(endpoints)]
            await self.make_request(endpoint, method, data)
            request_count += 1
            await asyncio.sleep(interval)
        
        self.metrics.end_time = time.time()
        print(f"[Worker {self.worker_id}] 🏁 Teste concluído ({request_count} requisições)")
        
        await self.session.close()
    
    async def stop(self):
        """Para o worker"""
        self.running = False
        if self.session:
            await self.session.close()


# ==================== FUNÇÕES PRINCIPAIS ====================

async def run_stress_test():
    """Executa stress test completo"""
    print("=" * 80)
    print("🔥 STRESS TEST - 10 WORKERS SIMULTÂNEOS (API REST)")
    print("=" * 80)
    print(f"📊 Configuração:")
    print(f"   - Número de workers: {NUM_WORKERS}")
    print(f"   - Requisições por minuto: {REQUESTS_PER_MINUTE}")
    print(f"   - Duração do teste: {TEST_DURATION_SECONDS}s")
    print(f"   - Total de requisições esperadas: ~{NUM_WORKERS * REQUESTS_PER_MINUTE}")
    print("=" * 80)
    print()
    
    # Criar workers
    workers: List[StressTestWorker] = []
    metrics_list: List[WorkerMetrics] = []
    
    for i in range(1, NUM_WORKERS + 1):
        metrics = WorkerMetrics(i)
        worker = StressTestWorker(i, metrics)
        workers.append(worker)
        metrics_list.append(metrics)
    
    # Iniciar todos os workers simultaneamente
    print(f"⏱️  Iniciando {NUM_WORKERS} workers simultâneos...")
    start_time = time.time()
    
    tasks = [worker.run(TEST_DURATION_SECONDS) for worker in workers]
    await asyncio.gather(*tasks)
    
    end_time = time.time()
    total_duration = end_time - start_time
    
    print()
    print("=" * 80)
    print("📊 RESULTADOS DO STRESS TEST")
    print("=" * 80)
    
    # Agregar estatísticas
    total_requests_sent = 0
    total_requests_success = 0
    total_requests_failed = 0
    total_errors = 0
    all_response_times = []
    all_status_codes: Dict[int, int] = {}
    
    print("\n🤖 Estatísticas por Worker:")
    print("-" * 80)
    
    for metrics in metrics_list:
        stats = metrics.get_stats()
        total_requests_sent += stats["requests_sent"]
        total_requests_success += stats["requests_success"]
        total_requests_failed += stats["requests_failed"]
        total_errors += stats["errors"]
        all_response_times.extend(metrics.response_times)
        
        for code, count in stats["status_codes"].items():
            all_status_codes[code] = all_status_codes.get(code, 0) + count
        
        print(f"Worker {stats['worker_id']:2d}: "
              f"Enviados={stats['requests_sent']:3d}, "
              f"Sucesso={stats['requests_success']:3d}, "
              f"Falhas={stats['requests_failed']:2d}, "
              f"Avg={stats['avg_response_time']*1000:.1f}ms, "
              f"P95={stats['p95_response_time']*1000:.1f}ms, "
              f"P99={stats['p99_response_time']*1000:.1f}ms")
    
    print()
    print("📈 Estatísticas Agregadas:")
    print("-" * 80)
    print(f"Duração total: {total_duration:.2f}s")
    print(f"Total de requisições enviadas: {total_requests_sent}")
    print(f"Total de requisições bem-sucedidas: {total_requests_success}")
    print(f"Total de requisições falhadas: {total_requests_failed}")
    print(f"Taxa de sucesso: {(total_requests_success/total_requests_sent*100) if total_requests_sent > 0 else 0:.2f}%")
    print(f"Total de erros: {total_errors}")
    print(f"Throughput: {total_requests_sent/total_duration:.2f} req/segundo")
    
    print()
    print("📊 Status Codes:")
    print("-" * 80)
    for code in sorted(all_status_codes.keys()):
        count = all_status_codes[code]
        percentage = (count / total_requests_sent * 100) if total_requests_sent > 0 else 0
        print(f"  {code}: {count} ({percentage:.1f}%)")
    
    if all_response_times:
        sorted_times = sorted(all_response_times)
        p95_index = int(len(sorted_times) * 0.95)
        p99_index = int(len(sorted_times) * 0.99)
        
        print()
        print("⏱️  Latência:")
        print("-" * 80)
        print(f"Média: {statistics.mean(all_response_times)*1000:.2f}ms")
        print(f"Mediana: {statistics.median(all_response_times)*1000:.2f}ms")
        print(f"Mínima: {min(all_response_times)*1000:.2f}ms")
        print(f"Máxima: {max(all_response_times)*1000:.2f}ms")
        print(f"P95: {sorted_times[p95_index]*1000:.2f}ms")
        print(f"P99: {sorted_times[p99_index]*1000:.2f}ms")
    
    print()
    print("=" * 80)
    
    # Identificar gargalos
    print()
    print("🔍 ANÁLISE DE GARGALOS:")
    print("-" * 80)
    
    bottlenecks_found = False
    
    if total_requests_failed > 0:
        fail_rate = total_requests_failed/total_requests_sent*100 if total_requests_sent > 0 else 0
        print(f"⚠️  GARGALO DETECTADO: {total_requests_failed} requisições falharam ({fail_rate:.2f}%)")
        bottlenecks_found = True
    
    if all_response_times:
        avg_latency = statistics.mean(all_response_times) * 1000
        if avg_latency > 200:
            print(f"⚠️  GARGALO DETECTADO: Latência média alta ({avg_latency:.2f}ms > 200ms)")
            bottlenecks_found = True
        
        p99_latency = sorted_times[p99_index] * 1000
        if p99_latency > 1000:
            print(f"⚠️  GARGALO DETECTADO: P99 latência muito alta ({p99_latency:.2f}ms > 1000ms)")
            bottlenecks_found = True
    
    throughput = total_requests_sent / total_duration if total_duration > 0 else 0
    expected_throughput = NUM_WORKERS * REQUESTS_PER_MINUTE / 60
    if throughput < expected_throughput * 0.9:
        print(f"⚠️  GARGALO DETECTADO: Throughput abaixo do esperado ({throughput:.2f} < {expected_throughput:.2f} req/s)")
        bottlenecks_found = True
    
    if total_requests_sent > 0 and total_errors > total_requests_sent * 0.05:
        print(f"⚠️  GARGALO DETECTADO: Taxa de erro alta ({total_errors/total_requests_sent*100:.2f}% > 5%)")
        bottlenecks_found = True
    
    # Verificar distribuição de status codes
    error_codes = {k: v for k, v in all_status_codes.items() if k >= 400}
    if error_codes:
        error_count = sum(error_codes.values())
        error_rate = (error_count / total_requests_sent * 100) if total_requests_sent > 0 else 0
        if error_rate > 5:
            print(f"⚠️  GARGALO DETECTADO: Alta taxa de erros HTTP ({error_rate:.2f}% >= 5%)")
            bottlenecks_found = True
    
    # Se não houver gargalos
    if not bottlenecks_found:
        print("✅ NENHUM GARGALO DETECTADO - Sistema escalável!")
        print(f"   - Taxa de sucesso: {(total_requests_success/total_requests_sent*100) if total_requests_sent > 0 else 0:.2f}%")
        print(f"   - Latência média: {statistics.mean(all_response_times)*1000:.2f}ms")
        print(f"   - Throughput: {throughput:.2f} req/s")
    
    print("=" * 80)
    
    # Salvar relatório
    report = {
        "test_config": {
            "num_workers": NUM_WORKERS,
            "requests_per_minute": REQUESTS_PER_MINUTE,
            "test_duration": TEST_DURATION_SECONDS
        },
        "results": {
            "total_duration": total_duration,
            "total_requests_sent": total_requests_sent,
            "total_requests_success": total_requests_success,
            "total_requests_failed": total_requests_failed,
            "success_rate": (total_requests_success/total_requests_sent*100) if total_requests_sent > 0 else 0,
            "total_errors": total_errors,
            "throughput": throughput,
            "status_codes": all_status_codes
        },
        "latency": {
            "avg": statistics.mean(all_response_times)*1000 if all_response_times else 0,
            "median": statistics.median(all_response_times)*1000 if all_response_times else 0,
            "min": min(all_response_times)*1000 if all_response_times else 0,
            "max": max(all_response_times)*1000 if all_response_times else 0,
            "p95": sorted_times[p95_index]*1000 if all_response_times else 0,
            "p99": sorted_times[p99_index]*1000 if all_response_times else 0
        },
        "workers": [metrics.get_stats() for metrics in metrics_list]
    }
    
    report_file = f"stress-test-report-{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Relatório salvo em: {report_file}")
    print()


# ==================== MAIN ====================

if __name__ == "__main__":
    try:
        asyncio.run(run_stress_test())
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
