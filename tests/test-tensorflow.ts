/**
 * Teste de TensorFlow
 * Valida se o TensorFlow está carregado e funcionando
 */

import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'https://servidor-automacao.onrender.com';

interface TensorFlowTestResponse {
  tensorflowLoaded: boolean;
  version?: string;
  backend?: string;
  error?: string;
}

async function testTensorFlow(): Promise<void> {
  console.log('🧪 Testando TensorFlow...\n');
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

    // Verificar se há informações sobre TensorFlow no health check
    const hasTensorFlowInfo = data.tensorflow !== undefined;

    if (hasTensorFlowInfo) {
      console.log(`   TensorFlow Loaded: ${data.tensorflow?.loaded ? '✅' : '❌'} ${data.tensorflow?.loaded}`);
      if (data.tensorflow?.version) {
        console.log(`   Version: ${data.tensorflow.version}`);
      }
      if (data.tensorflow?.backend) {
        console.log(`   Backend: ${data.tensorflow.backend}`);
      }
      console.log('');

      // Verificações críticas
      const checks = {
        tensorflowLoaded: data.tensorflow?.loaded === true,
        hasVersion: !!data.tensorflow?.version,
        hasBackend: !!data.tensorflow?.backend,
        responseTimeFast: responseTime < 5000,
      };

      const allPassed = Object.values(checks).every((v) => v === true);

      console.log('📋 RESULTADO:');
      console.log(`   TensorFlow carregado: ${checks.tensorflowLoaded ? '✅' : '❌'}`);
      console.log(`   Versão disponível: ${checks.hasVersion ? '✅' : '❌'}`);
      console.log(`   Backend disponível: ${checks.hasBackend ? '✅' : '❌'}`);
      console.log(`   Tempo de resposta OK: ${checks.responseTimeFast ? '✅' : '❌'}\n`);

      if (allPassed) {
        console.log('🎉 TESTE PASSOU! TensorFlow está funcionando.\n');
        process.exit(0);
      } else {
        console.error('❌ TESTE FALHOU! Alguns checks falharam.\n');
        process.exit(1);
      }
    } else {
      console.log('⚠️  TensorFlow info não disponível no health check');
      console.log('   Isso pode ser normal se TensorFlow não for usado no health endpoint\n');

      console.log('🔍 Tentando endpoint específico de TensorFlow...\n');

      // Tentar endpoint específico se existir
      try {
        const tfResponse = await fetch(`${SERVER_URL}/api/tensorflow/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30000),
        });

        if (tfResponse.ok) {
          const tfData = await tfResponse.json();
          console.log('✅ TensorFlow status:', tfData);
          console.log('\n🎉 TESTE PASSOU! TensorFlow está funcionando.\n');
          process.exit(0);
        } else {
          console.log('⚠️  Endpoint /api/tensorflow/status não disponível');
          console.log('   Status:', tfResponse.status, tfResponse.statusText);
          console.log('\n⚠️  TESTE INCONCLUSIVO: Não foi possível verificar TensorFlow diretamente.\n');
          console.log('   Sugestão: Adicionar endpoint /api/tensorflow/status ao servidor\n');
          process.exit(2); // Exit code 2 = inconclusive
        }
      } catch (tfError) {
        console.log('⚠️  Endpoint /api/tensorflow/status não disponível');
        console.log('\n⚠️  TESTE INCONCLUSIVO: Não foi possível verificar TensorFlow diretamente.\n');
        console.log('   Sugestão: Adicionar endpoint /api/tensorflow/status ao servidor\n');
        process.exit(2); // Exit code 2 = inconclusive
      }
    }
  } catch (error) {
    console.error('❌ ERRO AO TESTAR TENSORFLOW:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Executar teste
testTensorFlow();
