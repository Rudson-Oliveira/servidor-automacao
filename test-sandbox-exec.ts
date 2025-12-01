import { executarScriptPythonSeguro } from "./server/_core/python-validator";
import { readFileSync } from "fs";

async function testarSandbox() {
  console.log("🧪 Testando execução em sandbox...\n");

  const script = readFileSync("/home/ubuntu/test-sandbox-simple.py", "utf8");
  const resultado = await executarScriptPythonSeguro(script, [], 10);

  console.log("✅ Sucesso:", resultado.sucesso);
  console.log("📤 Código:", resultado.codigo);
  console.log("⏱️  Tempo:", resultado.tempoExecucao + "ms");
  console.log("\n📄 STDOUT:");
  console.log(resultado.stdout);

  if (resultado.stderr) {
    console.log("\n⚠️  STDERR:");
    console.log(resultado.stderr);
  }

  if (resultado.erro) {
    console.log("\n❌ ERRO:");
    console.log(resultado.erro);
  }

  console.log("\n" + "=".repeat(60));
  console.log(resultado.sucesso ? "✅ SANDBOX FUNCIONANDO!" : "❌ SANDBOX COM PROBLEMAS");
  console.log("=".repeat(60));
}

testarSandbox().catch(console.error);
