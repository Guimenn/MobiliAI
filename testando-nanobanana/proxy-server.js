import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

// Servidor proxy que funciona como URL pública
const app = express();
const PORT = 8080;

// Middleware para CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Rota para servir arquivos com URL pública
app.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ error: 'Arquivo não encontrado' });
  }
});

// Rota para servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server funcionando' });
});

app.listen(PORT, () => {
  console.log(`🌐 Proxy server rodando em http://localhost:${PORT}`);
  console.log(`📁 Arquivos acessíveis em: http://localhost:${PORT}/file/nome-do-arquivo`);
});