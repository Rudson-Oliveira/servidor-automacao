/**
 * Teste de Health Endpoint
 * Valida se o servidor está respondendo corretamente
 */

import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'https://servidor-automacao.onrender.com';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connected: boolean;
  };
}

async function testHealth(): Promise<void> {
  console.log('🧪 Testando Health Endpoint...\n');
  console.log(`📍 URL: ${SERVER_URL}/api/health\n`);

  try {
    const startTime = Date.now();
    const response = await fetch(`${SERVER_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`⏱️  Tempo de resposta: ${responseTime}ms`);
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as HealthResponse;

    // Validações
    console.log('✅ VALIDAÇÕES:');
    console.log(`   Status: ${data.status === 'ok' ? '✅' : '❌'} ${data.status}`);
    console.log(`   Timestamp: ${data.timestamp}`);
    console.log(`   Uptime: ${Math.floor(data.uptime / 1000)}s`);
    console.log(`   Memória: ${data.memory.percentage.toFixed(2)}% (${data.memory.used}MB / ${data.memory.total}MB)`);
    console.log(`   Database: ${data.database.connected ? '✅ Conectado' : '❌ Desconectado'}\n`);

    // Verificações críticas
    const checks = {
      statusOk: data.status === 'ok',
      hasTimestamp: !!data.timestamp,
      hasUptime: data.uptime > 0,
      memoryValid: data.memory.percentage >= 0 && data.memory.percentage <= 100,
      databaseConnected: data.database.connected,
      responseTimeFast: responseTime < 5000, // < 5s
    };

    const allPassed = Object.values(checks).every((v) => v === true);

    console.log('📋 RESULTADO:');
    console.log(`   Status OK: ${checks.statusOk ? '✅' : '❌'}`);
    console.log(`   Timestamp válido: ${checks.hasTimestamp ? '✅' : '❌'}`);
    console.log(`   Uptime válido: ${checks.hasUptime ? '✅' : '❌'}`);
    console.log(`   Memória válida: ${checks.memoryValid ? '✅' : '❌'}`);
    console.log(`   Database conectado: ${checks.databaseConnected ? '✅' : '❌'}`);
    console.log(`   Tempo de resposta OK: ${checks.responseTimeFast ? '✅' : '❌'}\n`);

    if (allPassed) {
      console.log('🎉 TESTE PASSOU! Servidor está saudável.\n');
      process.exit(0);
    } else {
      console.error('❌ TESTE FALHOU! Alguns checks falharam.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERRO AO TESTAR HEALTH ENDPOINT:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Executar teste
testHealth();
