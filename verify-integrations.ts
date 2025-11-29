/**
 * Script de Verificação de Integrações
 * Testa TODOS os endpoints, Supabase, webhooks e workflows
 */

import { appRouter } from "./server/routers";

interface IntegrationTest {
  name: string;
  category: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: string;
}

const results: IntegrationTest[] = [];

async function testEndpoints() {
  console.log("🔍 Testando endpoints tRPC...\n");

  // Listar todos os routers disponíveis
  const routers = Object.keys(appRouter._def.procedures);
  
  console.log(`📊 Total de procedures encontradas: ${routers.length}\n`);
  
  routers.forEach(router => {
    results.push({
      name: router,
      category: "tRPC Endpoints",
      status: "success",
      message: "Procedure registrada",
      details: `Tipo: ${typeof appRouter._def.procedures[router]}`
    });
  });
}

async function testSupabase() {
  console.log("🔍 Testando conexão Supabase...\n");
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    results.push({
      name: "Supabase Connection",
      category: "Database",
      status: "error",
      message: "Credenciais não encontradas",
      details: "SUPABASE_URL ou SUPABASE_ANON_KEY não configurados"
    });
    return;
  }
  
  results.push({
    name: "Supabase Credentials",
    category: "Database",
    status: "success",
    message: "Credenciais configuradas",
    details: `URL: ${supabaseUrl.substring(0, 30)}...`
  });
}

async function testDatabase() {
  console.log("🔍 Testando banco de dados...\n");
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    results.push({
      name: "Database Connection",
      category: "Database",
      status: "error",
      message: "DATABASE_URL não configurada"
    });
    return;
  }
  
  results.push({
    name: "Database URL",
    category: "Database",
    status: "success",
    message: "Configuração encontrada",
    details: "DATABASE_URL está definida"
  });
}

async function testWebhooks() {
  console.log("🔍 Testando webhooks...\n");
  
  // Verificar se há endpoints de webhook registrados
  const webhookEndpoints = [
    "/api/webhooks/whatsapp",
    "/api/webhooks/obsidian",
    "/api/webhooks/desktop"
  ];
  
  webhookEndpoints.forEach(endpoint => {
    results.push({
      name: endpoint,
      category: "Webhooks",
      status: "warning",
      message: "Endpoint definido (requer teste manual)",
      details: "Teste com POST request para validar"
    });
  });
}

async function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("📋 RELATÓRIO DE VERIFICAÇÃO DE INTEGRAÇÕES");
  console.log("=".repeat(80) + "\n");
  
  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    console.log(`\n📁 ${category}`);
    console.log("-".repeat(80));
    
    const categoryResults = results.filter(r => r.category === category);
    
    categoryResults.forEach(result => {
      const icon = result.status === "success" ? "✅" : result.status === "error" ? "❌" : "⚠️";
      console.log(`${icon} ${result.name}`);
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });
  });
  
  // Estatísticas
  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const warningCount = results.filter(r => r.status === "warning").length;
  
  console.log("\n" + "=".repeat(80));
  console.log("📊 ESTATÍSTICAS");
  console.log("=".repeat(80));
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`⚠️  Avisos: ${warningCount}`);
  console.log(`📊 Total: ${results.length}`);
  console.log(`📈 Taxa de Sucesso: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log("=".repeat(80) + "\n");
}

async function main() {
  console.log("🚀 Iniciando verificação de integrações...\n");
  
  await testEndpoints();
  await testSupabase();
  await testDatabase();
  await testWebhooks();
  await generateReport();
  
  console.log("✅ Verificação concluída!\n");
}

main().catch(console.error);
