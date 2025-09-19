import express from 'express';
import path from 'node:path';
import fs from 'node:fs';

// Servidor simples para servir arquivos estáticos publicamente
const app = express();
const PORT = 8080;

// Servir arquivos estáticos
app.use('/files', express.static('uploads'));

// Rota para servir arquivos com CORS
app.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join('uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ error: 'Arquivo não encontrado' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor de arquivos rodando em http://localhost:${PORT}`);
  console.log(`📁 Acesse arquivos em: http://localhost:${PORT}/file/nome-do-arquivo`);
});


