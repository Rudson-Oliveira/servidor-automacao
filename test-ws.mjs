import WebSocket from 'ws';

console.log('🧪 Testando WebSocket Server na porta 3001...\n');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Conexão estabelecida com sucesso!');
  ws.send(JSON.stringify({ type: 'auth', token: 'token_invalido' }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('📥 Mensagem recebida:', JSON.stringify(msg, null, 2));
  
  if (msg.type === 'welcome') {
    console.log('✅ Servidor enviou mensagem de boas-vindas!');
  } else if (msg.type === 'error') {
    console.log('✅ Servidor rejeitou token inválido corretamente!');
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 100);
  }
});

ws.on('error', (err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Conexão fechada');
});

setTimeout(() => {
  console.error('❌ Timeout: servidor não respondeu');
  ws.close();
  process.exit(1);
}, 3000);
