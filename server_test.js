// server_test.js — servidor mínimo para testar porta 7000
const http = require('http');
const PORT = 7000;
const manifest = { id: 'test', name: 'test-manifest' };

const server = http.createServer((req, res) => {
  console.log(new Date().toISOString(), req.method, req.url);
  if (req.url === '/manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(manifest));
  } else {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server rodando em http://0.0.0.0:${PORT}/manifest.json`);
});
