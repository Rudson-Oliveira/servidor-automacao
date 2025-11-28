#!/usr/bin/env node

/**
 * Script para gerar executável Windows (.exe)
 * 
 * Usa @yao-pkg/pkg para empacotar Node.js + aplicação em um único .exe
 * 
 * Uso:
 *   node scripts/build-exe.js
 *   pnpm build:exe
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const VERSION = "1.0.0";
const APP_NAME = "servidor-automacao";
const OUTPUT_DIR = path.join(__dirname, "..", "dist", "installers");
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${APP_NAME}-setup-${VERSION}.exe`);

console.log("🚀 Iniciando build do executável Windows...\n");

// Criar diretório de output
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Diretório criado: ${OUTPUT_DIR}`);
}

// Configuração do pkg
const pkgConfig = {
  targets: ["node22-win-x64"], // Windows 64-bit, Node.js 22
  output: OUTPUT_FILE,
  compress: "GZip", // Comprimir para reduzir tamanho
};

console.log("📦 Configuração do pkg:");
console.log(JSON.stringify(pkgConfig, null, 2));
console.log("");

// Comando pkg
const pkgCommand = `npx pkg . --targets ${pkgConfig.targets.join(",")} --output ${pkgConfig.output} --compress ${pkgConfig.compress}`;

console.log("🔨 Executando pkg...");
console.log(`Comando: ${pkgCommand}\n`);

const buildProcess = exec(pkgCommand, {
  cwd: path.join(__dirname, ".."),
  maxBuffer: 10 * 1024 * 1024, // 10MB buffer
});

buildProcess.stdout.on("data", (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on("data", (data) => {
  process.stderr.write(data);
});

buildProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Build concluído com sucesso!");
    
    // Verificar tamanho do arquivo
    if (fs.existsSync(OUTPUT_FILE)) {
      const stats = fs.statSync(OUTPUT_FILE);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`\n📊 Informações do executável:`);
      console.log(`   Arquivo: ${OUTPUT_FILE}`);
      console.log(`   Tamanho: ${sizeMB} MB`);
      console.log(`   Versão: ${VERSION}`);
      
      // Criar cópia sem versão no nome (fallback)
      const fallbackFile = path.join(OUTPUT_DIR, `${APP_NAME}-setup.exe`);
      fs.copyFileSync(OUTPUT_FILE, fallbackFile);
      console.log(`\n✅ Cópia criada: ${fallbackFile}`);
      
      console.log(`\n🎉 Executável pronto para distribuição!`);
      console.log(`\n📥 Usuários podem baixar em:`);
      console.log(`   http://localhost:3000/download`);
      console.log(`   http://localhost:3000/api/download/installer-windows.exe`);
    } else {
      console.error("\n❌ Erro: Arquivo executável não foi criado!");
      process.exit(1);
    }
  } else {
    console.error(`\n❌ Build falhou com código ${code}`);
    process.exit(code);
  }
});

buildProcess.on("error", (error) => {
  console.error(`\n❌ Erro ao executar pkg: ${error.message}`);
  process.exit(1);
});
