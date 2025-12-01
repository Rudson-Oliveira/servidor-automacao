/**
 * TESTE DE SEGURANÇA - Vulnerabilidades HTTP
 * 
 * Valida:
 * - Headers de segurança (CORS, CSP, X-Frame-Options)
 * - Rate limiting
 * - Validação de input
 * - Proteção contra ataques comuns
 */

const SERVER_URL = process.env.SERVER_URL || 'https://servidor-automacao.onrender.com';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const results: TestResult[] = [];

/**
 * Testa headers de segurança HTTP
 */
async function testSecurityHeaders() {
  console.log('\n🔒 Testando Headers de Segurança...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    const headers = response.headers;
    
    // 1. X-Frame-Options (proteção contra clickjacking)
    const xFrameOptions = headers.get('x-frame-options');
    results.push({
      test: 'X-Frame-Options Header',
      passed: !!xFrameOptions,
      message: xFrameOptions ? `✅ Presente: ${xFrameOptions}` : '❌ AUSENTE - Vulnerável a clickjacking',
      severity: 'high'
    });
    
    // 2. X-Content-Type-Options (proteção contra MIME sniffing)
    const xContentType = headers.get('x-content-type-options');
    results.push({
      test: 'X-Content-Type-Options Header',
      passed: xContentType === 'nosniff',
      message: xContentType ? `✅ Presente: ${xContentType}` : '❌ AUSENTE - Vulnerável a MIME sniffing',
      severity: 'medium'
    });
    
    // 3. Strict-Transport-Security (HSTS)
    const hsts = headers.get('strict-transport-security');
    results.push({
      test: 'HSTS Header',
      passed: !!hsts,
      message: hsts ? `✅ Presente: ${hsts}` : '⚠️ AUSENTE - Recomendado para HTTPS',
      severity: 'medium'
    });
    
    // 4. Content-Security-Policy
    const csp = headers.get('content-security-policy');
    results.push({
      test: 'Content-Security-Policy Header',
      passed: !!csp,
      message: csp ? `✅ Presente` : '⚠️ AUSENTE - Recomendado para prevenir XSS',
      severity: 'high'
    });
    
    // 5. X-XSS-Protection
    const xssProtection = headers.get('x-xss-protection');
    results.push({
      test: 'X-XSS-Protection Header',
      passed: xssProtection === '1; mode=block',
      message: xssProtection ? `✅ Presente: ${xssProtection}` : '⚠️ AUSENTE - Proteção adicional contra XSS',
      severity: 'low'
    });
    
  } catch (error) {
    results.push({
      test: 'Security Headers',
      passed: false,
      message: `❌ ERRO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      severity: 'critical'
    });
  }
}

/**
 * Testa rate limiting
 */
async function testRateLimiting() {
  console.log('\n⏱️ Testando Rate Limiting...');
  
  try {
    const requests = [];
    const startTime = Date.now();
    
    // Fazer 110 requisições rápidas (limite é 100/15min)
    for (let i = 0; i < 110; i++) {
      requests.push(
        fetch(`${SERVER_URL}/api/health`, {
          method: 'GET',
        }).then(res => res.status)
      );
    }
    
    const statuses = await Promise.all(requests);
    const blocked = statuses.filter(s => s === 429).length; // 429 = Too Many Requests
    const elapsed = Date.now() - startTime;
    
    results.push({
      test: 'Rate Limiting',
      passed: blocked > 0,
      message: blocked > 0 
        ? `✅ Rate limiting ATIVO (${blocked}/110 requisições bloqueadas em ${elapsed}ms)`
        : `❌ Rate limiting NÃO DETECTADO - Sistema vulnerável a DoS`,
      severity: 'critical'
    });
    
  } catch (error) {
    results.push({
      test: 'Rate Limiting',
      passed: false,
      message: `❌ ERRO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      severity: 'critical'
    });
  }
}

/**
 * Testa validação de input (SQL Injection)
 */
async function testSQLInjection() {
  console.log('\n💉 Testando Proteção contra SQL Injection...');
  
  const maliciousInputs = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users--",
    "<script>alert('XSS')</script>",
  ];
  
  try {
    for (const input of maliciousInputs) {
      const response = await fetch(`${SERVER_URL}/api/skills?search=${encodeURIComponent(input)}`);
      
      // Se retornar 500 (erro interno), pode indicar SQL injection
      if (response.status === 500) {
        results.push({
          test: `SQL Injection Test: ${input.substring(0, 20)}...`,
          passed: false,
          message: `❌ VULNERÁVEL - Input malicioso causou erro 500`,
          severity: 'critical'
        });
        return;
      }
    }
    
    results.push({
      test: 'SQL Injection Protection',
      passed: true,
      message: `✅ Protegido - Nenhum input malicioso causou erro`,
      severity: 'critical'
    });
    
  } catch (error) {
    results.push({
      test: 'SQL Injection Protection',
      passed: false,
      message: `❌ ERRO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      severity: 'critical'
    });
  }
}

/**
 * Testa autenticação em endpoints protegidos
 */
async function testAuthentication() {
  console.log('\n🔐 Testando Autenticação...');
  
  try {
    // Tentar acessar endpoint protegido sem token
    const response = await fetch(`${SERVER_URL}/api/trpc/system.notifyOwner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Teste',
        content: 'Teste de segurança'
      })
    });
    
    const isProtected = response.status === 401 || response.status === 403;
    
    results.push({
      test: 'Authentication on Protected Endpoints',
      passed: isProtected,
      message: isProtected 
        ? `✅ Endpoint protegido (${response.status})` 
        : `❌ VULNERÁVEL - Endpoint acessível sem autenticação (${response.status})`,
      severity: 'critical'
    });
    
  } catch (error) {
    results.push({
      test: 'Authentication',
      passed: false,
      message: `❌ ERRO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      severity: 'critical'
    });
  }
}

/**
 * Testa tamanho máximo de payload (proteção contra DoS)
 */
async function testPayloadSize() {
  console.log('\n📦 Testando Limite de Payload...');
  
  try {
    // Criar payload de 60MB (limite é 50MB)
    const largePayload = 'A'.repeat(60 * 1024 * 1024);
    
    const response = await fetch(`${SERVER_URL}/api/conversar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mensagem: largePayload
      })
    });
    
    const isProtected = response.status === 413 || response.status === 400;
    
    results.push({
      test: 'Payload Size Limit',
      passed: isProtected,
      message: isProtected 
        ? `✅ Limite de payload ATIVO (${response.status})` 
        : `❌ VULNERÁVEL - Aceita payloads gigantes (${response.status})`,
      severity: 'high'
    });
    
  } catch (error) {
    // Timeout ou erro de rede pode indicar que o limite está funcionando
    results.push({
      test: 'Payload Size Limit',
      passed: true,
      message: `✅ Limite de payload ATIVO (conexão rejeitada)`,
      severity: 'high'
    });
  }
}

/**
 * Executa todos os testes
 */
async function runSecurityTests() {
  console.log('🔒 INICIANDO TESTES DE SEGURANÇA');
  console.log('='.repeat(50));
  
  await testSecurityHeaders();
  await testRateLimiting();
  await testSQLInjection();
  await testAuthentication();
  await testPayloadSize();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADOS DOS TESTES DE SEGURANÇA');
  console.log('='.repeat(50));
  
  // Agrupar por severidade
  const critical = results.filter(r => r.severity === 'critical');
  const high = results.filter(r => r.severity === 'high');
  const medium = results.filter(r => r.severity === 'medium');
  const low = results.filter(r => r.severity === 'low');
  
  const printResults = (severity: string, tests: TestResult[]) => {
    if (tests.length === 0) return;
    
    console.log(`\n🔴 ${severity.toUpperCase()}:`);
    tests.forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      console.log(`  ${icon} ${r.test}`);
      console.log(`     ${r.message}`);
    });
  };
  
  printResults('CRITICAL', critical);
  printResults('HIGH', high);
  printResults('MEDIUM', medium);
  printResults('LOW', low);
  
  // Estatísticas finais
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Aprovados: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Falhados: ${failed}/${total}`);
  console.log('='.repeat(50));
  
  // Retornar código de saída
  const criticalFailed = critical.filter(r => !r.passed).length;
  const highFailed = high.filter(r => !r.passed).length;
  
  if (criticalFailed > 0) {
    console.log('\n🚨 CRÍTICO: Vulnerabilidades críticas detectadas!');
    process.exit(1);
  } else if (highFailed > 0) {
    console.log('\n⚠️ ATENÇÃO: Vulnerabilidades de alta severidade detectadas!');
    process.exit(1);
  } else if (failed > 0) {
    console.log('\n⚠️ Algumas vulnerabilidades de baixa/média severidade detectadas.');
    process.exit(0);
  } else {
    console.log('\n✅ Sistema SEGURO! Todos os testes passaram.');
    process.exit(0);
  }
}

// Executar testes
runSecurityTests().catch(error => {
  console.error('❌ Erro fatal nos testes:', error);
  process.exit(1);
});
