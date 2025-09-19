import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { processImageWithPrompt } from './index.js';
import { config } from './config.js';

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Rota principal - servir HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Rota para processar imagem com URL
app.post('/api/process-url', async (req, res) => {
  try {
    const { prompt, imageUrl, outputFormat = 'jpg' } = req.body;
    
    if (!prompt || !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt e URL da imagem são obrigatórios' 
      });
    }

    console.log(`🚀 Processando imagem: ${imageUrl}`);
    console.log(`📝 Prompt: ${prompt}`);
    
    const result = await processImageWithPrompt(prompt, imageUrl, outputFormat);
    
    if (result.success) {
      res.json({
        success: true,
        imageUrl: result.imageUrl,
        localFile: result.localFile,
        message: 'Imagem processada com sucesso!'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro na rota /api/process-url:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para processar imagem com upload
app.post('/api/process-upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhuma imagem foi enviada' 
      });
    }

    const { prompt, outputFormat = 'jpg' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt é obrigatório' 
      });
    }

    // Criar URL pública para a imagem (usando servidor de arquivos)
    const imageUrl = `http://localhost:8080/file/${req.file.filename}`;
    
    console.log(`🚀 Processando upload: ${req.file.filename}`);
    console.log(`📝 Prompt: ${prompt}`);
    
    const result = await processImageWithPrompt(prompt, imageUrl, outputFormat);
    
    if (result.success) {
      res.json({
        success: true,
        imageUrl: result.imageUrl,
        localFile: result.localFile,
        message: 'Imagem processada com sucesso!'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erro na rota /api/process-upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Servir arquivos de upload
app.use('/uploads', express.static('uploads'));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Uploads salvos em: ${path.join(process.cwd(), 'uploads')}`);
});
