import { createAgent } from './server/db-desktop-control.js';

// Criar agent de teste para o usuário admin (ID 1)
const agent = await createAgent(
  1, // userId
  'Desktop Agent Teste',
  'Linux Ubuntu 22.04',
  '1.0.0'
);

console.log('\n✅ Agent de teste criado com sucesso!\n');
console.log('📋 Informações do Agent:');
console.log(`   ID: ${agent.id}`);
console.log(`   Token: ${agent.token}`);
console.log(`   Device: ${agent.deviceName}`);
console.log(`   Platform: ${agent.platform}`);
console.log('\n💡 Use este token no config.json do Desktop Agent\n');

process.exit(0);
