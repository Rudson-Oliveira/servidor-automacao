/**
 * Teste de Conexão com Banco de Dados
 * Valida se o banco de dados está conectado e respondendo
 */

import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'https://servidor-automacao.onrender.com';

interface DatabaseTestResponse {
  connected: boolean;
  tablesCount?: number;
  error?: string;
}

async function testDatabase(): Promise<void> {
  console.log('🧪 Testando Conexão com Banco de Dados...\n');
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

    const data = await response.json();

    // Validações
    console.log('✅ VALIDAÇÕES:');
    console.log(`   Database Connected: ${data.database?.connected ? '✅' : '❌'} ${data.database?.connected}`);

    if (data.database?.connected) {
      console.log('   ✅ Banco de dados está conectado e respondendo\n');

      // Tentar fazer uma query simples via endpoint de skills
      console.log('🔍 Testando query simples (GET /api/skills)...\n');

      const skillsStartTime = Date.now();
      const skillsResponse = await fetch(`${SERVER_URL}/api/skills`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });

      const skillsEndTime = Date.now();
      const skillsResponseTime = skillsEndTime - skillsStartTime;

      console.log(`⏱️  Tempo de resposta (skills): ${skillsResponseTime}ms`);
      console.log(`📊 Status HTTP: ${skillsResponse.status} ${skillsResponse.statusText}\n`);

      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        console.log(`✅ Query executada com sucesso!`);
        console.log(`   Skills encontradas: ${Array.isArray(skillsData) ? skillsData.length : 'N/A'}\n`);

        // Verificações críticas
        const checks = {
          databaseConnected: data.database?.connected === true,
          querySuccessful: skillsResponse.ok,
          hasData: Array.isArray(skillsData) && skillsData.length > 0,
          responseTimeFast: responseTime < 5000,
          queryTimeFast: skillsResponseTime < 10000,
        };

        const allPassed = Object.values(checks).every((v) => v === true);

        console.log('📋 RESULTADO:');
        console.log(`   Database conectado: ${checks.databaseConnected ? '✅' : '❌'}`);
        console.log(`   Query executada: ${checks.querySuccessful ? '✅' : '❌'}`);
        console.log(`   Dados retornados: ${checks.hasData ? '✅' : '❌'}`);
        console.log(`   Health response rápido: ${checks.responseTimeFast ? '✅' : '❌'}`);
        console.log(`   Query response rápido: ${checks.queryTimeFast ? '✅' : '❌'}\n`);

        if (allPassed) {
          console.log('🎉 TESTE PASSOU! Banco de dados está funcionando perfeitamente.\n');
          process.exit(0);
        } else {
          console.error('❌ TESTE FALHOU! Alguns checks falharam.\n');
          process.exit(1);
        }
      } else {
        console.error('❌ Query falhou:', await skillsResponse.text());
        process.exit(1);
      }
    } else {
      console.error('❌ Banco de dados NÃO está conectado!\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERRO AO TESTAR BANCO DE DADOS:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Executar teste
testDatabase();
