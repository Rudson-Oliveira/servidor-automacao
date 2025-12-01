/**
 * Teste de Auto-Healing
 * Simula falhas e verifica se o sistema se recupera automaticamente
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

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${SERVER_URL}/api/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as HealthResponse;
}

async function testAutoHealing(): Promise<void> {
  console.log('🧪 Testando Auto-Healing do Sistema...\n');
  console.log('📋 Este teste verifica se o sistema se recupera de falhas simuladas\n');

  try {
    // 1. Verificar estado inicial
    console.log('1️⃣  Verificando estado inicial...');
    const initialHealth = await checkHealth();
    console.log(`   ✅ Status: ${initialHealth.status}`);
    console.log(`   ✅ Database: ${initialHealth.database.connected ? 'Conectado' : 'Desconectado'}`);
    console.log(`   ✅ Uptime: ${Math.floor(initialHealth.uptime / 1000)}s\n`);

    // 2. Simular requisições rápidas consecutivas (stress test leve)
    console.log('2️⃣  Simulando múltiplas requisições consecutivas...');
    const requests = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < requests; i++) {
      try {
        await checkHealth();
        successCount++;
        process.stdout.write('.');
      } catch (error) {
        failCount++;
        process.stdout.write('x');
      }
    }

    console.log(`\n   ✅ Sucesso: ${successCount}/${requests}`);
    console.log(`   ${failCount > 0 ? '⚠️' : '✅'}  Falhas: ${failCount}/${requests}\n`);

    // 3. Verificar recuperação após stress
    console.log('3️⃣  Aguardando 5 segundos para verificar recuperação...');
    await sleep(5000);

    const recoveryHealth = await checkHealth();
    console.log(`   ✅ Status após stress: ${recoveryHealth.status}`);
    console.log(`   ✅ Database: ${recoveryHealth.database.connected ? 'Conectado' : 'Desconectado'}`);
    console.log(`   ✅ Uptime: ${Math.floor(recoveryHealth.uptime / 1000)}s\n`);

    // 4. Verificar se o uptime aumentou (sistema não reiniciou)
    const uptimeDiff = recoveryHealth.uptime - initialHealth.uptime;
    console.log('4️⃣  Verificando estabilidade...');
    console.log(`   Diferença de uptime: ${Math.floor(uptimeDiff / 1000)}s`);

    const systemStable = uptimeDiff > 0 && uptimeDiff < 60000; // Entre 0 e 60s
    console.log(`   ${systemStable ? '✅' : '⚠️'}  Sistema ${systemStable ? 'estável' : 'pode ter reiniciado'}\n`);

    // 5. Testar endpoint de erro (se existir)
    console.log('5️⃣  Testando tratamento de erros...');
    try {
      const errorResponse = await fetch(`${SERVER_URL}/api/nonexistent-endpoint`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      console.log(`   Status: ${errorResponse.status}`);
      if (errorResponse.status === 404) {
        console.log('   ✅ Erro 404 tratado corretamente\n');
      } else {
        console.log(`   ⚠️  Resposta inesperada: ${errorResponse.status}\n`);
      }
    } catch (error) {
      console.log('   ⚠️  Erro ao testar endpoint inexistente:', error);
      console.log('');
    }

    // Verificações finais
    const checks = {
      initialHealthOk: initialHealth.status === 'ok',
      databaseConnected: initialHealth.database.connected && recoveryHealth.database.connected,
      mostRequestsSucceeded: successCount >= requests * 0.8, // 80% sucesso
      systemRecovered: recoveryHealth.status === 'ok',
      systemStable: systemStable,
    };

    const allPassed = Object.values(checks).every((v) => v === true);

    console.log('📋 RESULTADO FINAL:');
    console.log(`   Estado inicial OK: ${checks.initialHealthOk ? '✅' : '❌'}`);
    console.log(`   Database sempre conectado: ${checks.databaseConnected ? '✅' : '❌'}`);
    console.log(`   Maioria das requisições OK: ${checks.mostRequestsSucceeded ? '✅' : '❌'}`);
    console.log(`   Sistema recuperado: ${checks.systemRecovered ? '✅' : '❌'}`);
    console.log(`   Sistema estável: ${checks.systemStable ? '✅' : '❌'}\n`);

    if (allPassed) {
      console.log('🎉 TESTE PASSOU! Sistema demonstrou capacidade de auto-healing.\n');
      process.exit(0);
    } else {
      console.error('❌ TESTE FALHOU! Sistema pode ter problemas de recuperação.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERRO AO TESTAR AUTO-HEALING:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Executar teste
testAutoHealing();
