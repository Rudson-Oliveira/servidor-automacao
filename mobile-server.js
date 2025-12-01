const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Todas as rotas retornam o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mobile server running on port ${PORT}`);
  console.log(`📱 Access: http://localhost:${PORT}`);
});
