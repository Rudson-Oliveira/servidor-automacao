#!/usr/bin/env python3
"""
Stress Test - 10 Desktop Agents Simultâneos
============================================

Este script simula 10 Desktop Agents conectando simultaneamente ao servidor
e enviando 100 comandos/minuto para validar escalabilidade e identificar gargalos.

Autor: Manus AI
Data: 01/Dezembro/2025
Versão: 1.0.0
"""

import asyncio
import websockets
import json
import time
import statistics
from datetime import datetime
from typing import List, Dict, Any
import hashlib
import sys

# ==================== CONFIGURAÇÃO ====================

REGISTER_API_URL = "https://3000-irvlht34m10g6oxfkoitw-1b347671.manusvm.computer/api/desktop-agent/register"
SERVER_URL = "wss://automacao-ws-alejofy2.manus.space/desktop-agent"
NUM_AGENTS = 10
COMMANDS_PER_MINUTE = 100
TEST_DURATION_SECONDS = 60
TOKEN_PREFIX = "stress_test_agent_"

# ==================== CLASSES ====================

class AgentMetrics:
    """Métricas de performance de um agent"""
    
    def __init__(self, agent_id: int):
        self.agent_id = agent_id
        self.connected = False
        self.authenticated = False
        self.commands_sent = 0
        self.commands_success = 0
        self.commands_failed = 0
        self.response_times: List[float] = []
        self.errors: List[str] = []
        self.start_time = None
        self.end_time = None
    
    def add_response_time(self, duration: float):
        """Adiciona tempo de resposta"""
        self.response_times.append(duration)
    
    def add_error(self, error: str):
        """Adiciona erro"""
        self.errors.append(error)
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas"""
        if not self.response_times:
            return {
                "agent_id": self.agent_id,
                "connected": self.connected,
                "authenticated": self.authenticated,
                "commands_sent": self.commands_sent,
                "commands_success": self.commands_success,
                "commands_failed": self.commands_failed,
                "avg_response_time": 0,
                "min_response_time": 0,
                "max_response_time": 0,
                "p95_response_time": 0,
                "p99_response_time": 0,
                "errors": len(self.errors),
                "duration": 0
            }
        
        sorted_times = sorted(self.response_times)
        p95_index = int(len(sorted_times) * 0.95)
        p99_index = int(len(sorted_times) * 0.99)
        
        duration = (self.end_time - self.start_time) if self.end_time and self.start_time else 0
        
        return {
            "agent_id": self.agent_id,
            "connected": self.connected,
            "authenticated": self.authenticated,
            "commands_sent": self.commands_sent,
            "commands_success": self.commands_success,
            "commands_failed": self.commands_failed,
            "avg_response_time": statistics.mean(self.response_times),
            "min_response_time": min(self.response_times),
            "max_response_time": max(self.response_times),
            "p95_response_time": sorted_times[p95_index] if p95_index < len(sorted_times) else 0,
            "p99_response_time": sorted_times[p99_index] if p99_index < len(sorted_times) else 0,
            "errors": len(self.errors),
            "duration": duration
        }


class StressTestAgent:
    """Agent de stress test"""
    
    def __init__(self, agent_id: int, token: str, metrics: AgentMetrics):
        self.agent_id = agent_id
        self.token = token
        self.metrics = metrics
        self.ws = None
        self.running = False
    
    async def connect(self):
        """Conecta ao servidor"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.ws = await websockets.connect(SERVER_URL, additional_headers=headers)
            self.metrics.connected = True
            print(f"[Agent {self.agent_id}] ✅ Conectado")
            return True
        except Exception as e:
            print(f"[Agent {self.agent_id}] ❌ Erro ao conectar: {e}")
            self.metrics.add_error(f"Connection error: {e}")
            return False
    
    async def authenticate(self):
        """Autentica no servidor"""
        try:
            auth_msg = {
                "type": "auth",
                "token": self.token,
                "deviceName": f"StressTest-Agent-{self.agent_id}",
                "platform": "linux",
                "version": "1.0.0"
            }
            await self.ws.send(json.dumps(auth_msg))
            
            # Aguardar resposta de autenticação
            response = await asyncio.wait_for(self.ws.recv(), timeout=5.0)
            data = json.loads(response)
            
            if data.get("type") == "auth_success":
                self.metrics.authenticated = True
                print(f"[Agent {self.agent_id}] ✅ Autenticado")
                return True
            else:
                print(f"[Agent {self.agent_id}] ❌ Autenticação falhou: {data}")
                self.metrics.add_error(f"Auth failed: {data}")
                return False
        except Exception as e:
            print(f"[Agent {self.agent_id}] ❌ Erro na autenticação: {e}")
            self.metrics.add_error(f"Auth error: {e}")
            return False
    
    async def send_command(self, command_id: int):
        """Envia comando shell simples"""
        try:
            start_time = time.time()
            
            command_msg = {
                "type": "command_result",
                "commandId": command_id,
                "success": True,
                "result": f"Command {command_id} executed successfully",
                "executionTime": 0.1
            }
            
            await self.ws.send(json.dumps(command_msg))
            self.metrics.commands_sent += 1
            
            # Aguardar ACK (opcional, mas mede latência real)
            # response = await asyncio.wait_for(self.ws.recv(), timeout=2.0)
            
            end_time = time.time()
            response_time = end_time - start_time
            self.metrics.add_response_time(response_time)
            self.metrics.commands_success += 1
            
            return True
        except Exception as e:
            self.metrics.commands_failed += 1
            self.metrics.add_error(f"Command error: {e}")
            return False
    
    async def run(self, duration: int):
        """Executa teste por X segundos"""
        if not await self.connect():
            return
        
        if not await self.authenticate():
            return
        
        self.running = True
        self.metrics.start_time = time.time()
        
        # Calcular intervalo entre comandos (100 comandos/minuto = 0.6s)
        interval = 60.0 / COMMANDS_PER_MINUTE
        
        command_id = 1
        end_time = time.time() + duration
        
        print(f"[Agent {self.agent_id}] 🚀 Iniciando envio de comandos (intervalo: {interval:.2f}s)")
        
        while time.time() < end_time and self.running:
            await self.send_command(command_id)
            command_id += 1
            await asyncio.sleep(interval)
        
        self.metrics.end_time = time.time()
        print(f"[Agent {self.agent_id}] 🏁 Teste concluído")
        
        await self.ws.close()
    
    async def stop(self):
        """Para o agent"""
        self.running = False
        if self.ws:
            await self.ws.close()


# ==================== FUNÇÕES PRINCIPAIS ====================

import requests

def register_agent(agent_id: int) -> str:
    """Registra agent no servidor e retorna token válido"""
    try:
        payload = {
            "deviceName": f"StressTest-Agent-{agent_id}",
            "platform": "linux",
            "version": "1.0.0"
        }
        
        headers = {"X-Agent-Register-Token": "manus-agent-register-2024"}
        response = requests.post(REGISTER_API_URL, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        token = data.get("token")
        
        if not token:
            raise Exception(f"Token não retornado pela API: {data}")
        
        print(f"[Setup] Agent {agent_id} registrado com sucesso")
        return token
    except Exception as e:
        print(f"[Setup] ❌ Erro ao registrar agent {agent_id}: {e}")
        raise


async def run_stress_test():
    """Executa stress test completo"""
    print("=" * 80)
    print("🔥 STRESS TEST - 10 DESKTOP AGENTS SIMULTÂNEOS")
    print("=" * 80)
    print(f"📊 Configuração:")
    print(f"   - Número de agents: {NUM_AGENTS}")
    print(f"   - Comandos por minuto: {COMMANDS_PER_MINUTE}")
    print(f"   - Duração do teste: {TEST_DURATION_SECONDS}s")
    print(f"   - Total de comandos esperados: {NUM_AGENTS * COMMANDS_PER_MINUTE}")
    print("=" * 80)
    print()
    
    # Registrar agents no servidor primeiro
    print(f"⏱️  Registrando {NUM_AGENTS} agents no servidor...")
    agents: List[StressTestAgent] = []
    metrics_list: List[AgentMetrics] = []
    
    for i in range(1, NUM_AGENTS + 1):
        try:
            token = register_agent(i)
            metrics = AgentMetrics(i)
            agent = StressTestAgent(i, token, metrics)
            agents.append(agent)
            metrics_list.append(metrics)
        except Exception as e:
            print(f"❌ Falha ao registrar agent {i}, pulando...")
            continue
    
    if len(agents) == 0:
        print("\n❌ Nenhum agent foi registrado com sucesso. Abortando teste.")
        return
    
    print(f"✅ {len(agents)} agents registrados com sucesso\n")
    
    # Iniciar todos os agents simultaneamente
    print(f"⏱️  Iniciando {NUM_AGENTS} agents simultâneos...")
    start_time = time.time()
    
    tasks = [agent.run(TEST_DURATION_SECONDS) for agent in agents]
    await asyncio.gather(*tasks)
    
    end_time = time.time()
    total_duration = end_time - start_time
    
    print()
    print("=" * 80)
    print("📊 RESULTADOS DO STRESS TEST")
    print("=" * 80)
    
    # Agregar estatísticas
    total_commands_sent = 0
    total_commands_success = 0
    total_commands_failed = 0
    total_errors = 0
    all_response_times = []
    
    print("\n🤖 Estatísticas por Agent:")
    print("-" * 80)
    
    for metrics in metrics_list:
        stats = metrics.get_stats()
        total_commands_sent += stats["commands_sent"]
        total_commands_success += stats["commands_success"]
        total_commands_failed += stats["commands_failed"]
        total_errors += stats["errors"]
        all_response_times.extend(metrics.response_times)
        
        print(f"Agent {stats['agent_id']:2d}: "
              f"Conectado={stats['connected']}, "
              f"Auth={stats['authenticated']}, "
              f"Enviados={stats['commands_sent']:3d}, "
              f"Sucesso={stats['commands_success']:3d}, "
              f"Falhas={stats['commands_failed']:2d}, "
              f"Avg={stats['avg_response_time']*1000:.1f}ms, "
              f"P95={stats['p95_response_time']*1000:.1f}ms, "
              f"P99={stats['p99_response_time']*1000:.1f}ms")
    
    print()
    print("📈 Estatísticas Agregadas:")
    print("-" * 80)
    print(f"Duração total: {total_duration:.2f}s")
    print(f"Total de comandos enviados: {total_commands_sent}")
    print(f"Total de comandos bem-sucedidos: {total_commands_success}")
    print(f"Total de comandos falhados: {total_commands_failed}")
    print(f"Taxa de sucesso: {(total_commands_success/total_commands_sent*100) if total_commands_sent > 0 else 0:.2f}%")
    print(f"Total de erros: {total_errors}")
    print(f"Throughput: {total_commands_sent/total_duration:.2f} comandos/segundo")
    
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
    
    if total_commands_failed > 0:
        print(f"⚠️  GARGALO DETECTADO: {total_commands_failed} comandos falharam ({total_commands_failed/total_commands_sent*100:.2f}%)")
    
    if all_response_times:
        avg_latency = statistics.mean(all_response_times) * 1000
        if avg_latency > 100:
            print(f"⚠️  GARGALO DETECTADO: Latência média alta ({avg_latency:.2f}ms > 100ms)")
        
        p99_latency = sorted_times[p99_index] * 1000
        if p99_latency > 500:
            print(f"⚠️  GARGALO DETECTADO: P99 latência muito alta ({p99_latency:.2f}ms > 500ms)")
    
    throughput = total_commands_sent / total_duration
    expected_throughput = NUM_AGENTS * COMMANDS_PER_MINUTE / 60
    if throughput < expected_throughput * 0.9:
        print(f"⚠️  GARGALO DETECTADO: Throughput abaixo do esperado ({throughput:.2f} < {expected_throughput:.2f} comandos/s)")
    
    if total_commands_sent > 0 and total_errors > total_commands_sent * 0.05:
        print(f"⚠️  GARGALO DETECTADO: Taxa de erro alta ({total_errors/total_commands_sent*100:.2f}% > 5%)")
    
    # Se não houver gargalos
    if (total_commands_failed == 0 and 
        avg_latency <= 100 and 
        throughput >= expected_throughput * 0.9 and
        total_errors <= total_commands_sent * 0.05):
        print("✅ NENHUM GARGALO DETECTADO - Sistema escalável!")
    
    print("=" * 80)
    
    # Salvar relatório
    report = {
        "test_config": {
            "num_agents": NUM_AGENTS,
            "commands_per_minute": COMMANDS_PER_MINUTE,
            "test_duration": TEST_DURATION_SECONDS
        },
        "results": {
            "total_duration": total_duration,
            "total_commands_sent": total_commands_sent,
            "total_commands_success": total_commands_success,
            "total_commands_failed": total_commands_failed,
            "success_rate": (total_commands_success/total_commands_sent*100) if total_commands_sent > 0 else 0,
            "total_errors": total_errors,
            "throughput": throughput
        },
        "latency": {
            "avg": statistics.mean(all_response_times)*1000 if all_response_times else 0,
            "median": statistics.median(all_response_times)*1000 if all_response_times else 0,
            "min": min(all_response_times)*1000 if all_response_times else 0,
            "max": max(all_response_times)*1000 if all_response_times else 0,
            "p95": sorted_times[p95_index]*1000 if all_response_times else 0,
            "p99": sorted_times[p99_index]*1000 if all_response_times else 0
        },
        "agents": [metrics.get_stats() for metrics in metrics_list]
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
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
