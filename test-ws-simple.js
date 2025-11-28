const WebSocket = require('ws');

console.log('🧪 Testando WebSocket Server...\n');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Conexão estabelecida!');
  ws.send(JSON.stringify({ type: 'auth', token: 'test' }));
});

ws.on('message', (data) => {
  console.log('📥 Resposta:', data.toString());
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Timeout');
  process.exit(1);
}, 3000);
