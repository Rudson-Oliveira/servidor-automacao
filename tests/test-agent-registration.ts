/**
 * Teste de Registro de Desktop Agent
 * Valida se o endpoint de registro está funcionando
 */

import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'https://servidor-automacao.onrender.com';
const REGISTER_TOKEN = process.env.DESKTOP_AGENT_REGISTER_TOKEN || 'manus-agent-register-2024';

interface RegisterResponse {
  success: boolean;
  agentId: number;
  token: string;
  message: string;
}

async function testAgentRegistration(): Promise<void> {
  console.log('🧪 Testando Registro de Desktop Agent...\n');
  console.log(`📍 URL: ${SERVER_URL}/api/desktop-agent/register\n`);

  try {
    const deviceName = `Test-Agent-${Date.now()}`;
    const platform = 'Windows';
    const version = '2.1.0';

    console.log('📤 Enviando requisição de registro...');
    console.log(`   Device Name: ${deviceName}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   Version: ${version}\n`);

    const startTime = Date.now();
    const response = await fetch(`${SERVER_URL}/api/desktop-agent/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Register-Token': REGISTER_TOKEN,
      },
      body: JSON.stringify({
        deviceName,
        platform,
        version,
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`⏱️  Tempo de resposta: ${responseTime}ms`);
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as RegisterResponse;

    // Validações
    console.log('✅ VALIDAÇÕES:');
    console.log(`   Success: ${data.success ? '✅' : '❌'} ${data.success}`);
    console.log(`   Agent ID: ${data.agentId}`);
    console.log(`   Token gerado: ${data.token.substring(0, 16)}...${data.token.substring(data.token.length - 16)}`);
    console.log(`   Token length: ${data.token.length} caracteres`);
    console.log(`   Message: ${data.message}\n`);

    // Verificações críticas
    const checks = {
      successTrue: data.success === true,
      hasAgentId: typeof data.agentId === 'number' && data.agentId > 0,
      hasToken: typeof data.token === 'string' && data.token.length === 64,
      tokenIsHex: /^[0-9a-f]{64}$/.test(data.token),
      hasMessage: typeof data.message === 'string' && data.message.length > 0,
      responseTimeFast: responseTime < 10000, // < 10s
    };

    const allPassed = Object.values(checks).every((v) => v === true);

    console.log('📋 RESULTADO:');
    console.log(`   Success = true: ${checks.successTrue ? '✅' : '❌'}`);
    console.log(`   Agent ID válido: ${checks.hasAgentId ? '✅' : '❌'}`);
    console.log(`   Token válido (64 chars): ${checks.hasToken ? '✅' : '❌'}`);
    console.log(`   Token é hexadecimal: ${checks.tokenIsHex ? '✅' : '❌'}`);
    console.log(`   Mensagem válida: ${checks.hasMessage ? '✅' : '❌'}`);
    console.log(`   Tempo de resposta OK: ${checks.responseTimeFast ? '✅' : '❌'}\n`);

    if (allPassed) {
      console.log('🎉 TESTE PASSOU! Registro de agent funcionando.\n');
      console.log('📝 PRÓXIMO PASSO:');
      console.log('   Use este token para conectar um Desktop Agent real:\n');
      console.log(`   Token: ${data.token}\n`);
      process.exit(0);
    } else {
      console.error('❌ TESTE FALHOU! Alguns checks falharam.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERRO AO TESTAR REGISTRO DE AGENT:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Executar teste
testAgentRegistration();
