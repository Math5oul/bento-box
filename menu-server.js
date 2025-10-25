const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3001;

const DATA_PATH = path.join(__dirname, 'src', 'assets', 'data', 'menu-data.json');
const IMAGES_BASE_PATH = path.join(__dirname, 'src', 'assets', 'images');

// Garante que a pasta de imagens existe
if (!fs.existsSync(IMAGES_BASE_PATH)) {
  fs.mkdirSync(IMAGES_BASE_PATH, { recursive: true });
}

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = req.params.productId || req.body.productId;
    const productPath = path.join(IMAGES_BASE_PATH, productId);

    // Cria a pasta do produto se não existir
    if (!fs.existsSync(productPath)) {
      fs.mkdirSync(productPath, { recursive: true });
    }

    cb(null, productPath);
  },
  filename: (req, file, cb) => {
    // Mantém a extensão original
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP, AVIF)!'));
    }
  },
});

app.use(cors());
app.use(express.json());

// Serve arquivos estáticos da pasta de imagens
app.use('/assets/images', express.static(IMAGES_BASE_PATH));

// Endpoint para obter o cardápio
app.get('/api/menu', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao ler o arquivo de dados.' });
    }
    const jsonData = JSON.parse(data);
    // Se já tem a estrutura { items: [] }, retorna diretamente
    // Senão, envolve em { items: [] }
    if (jsonData.items) {
      res.json(jsonData);
    } else {
      res.json({ items: jsonData });
    }
  });
});

// Endpoint para salvar o cardápio
app.post('/api/menu', (req, res) => {
  // Garantir que salvamos no formato correto { "items": [...] }
  const dataToSave = req.body.items ? req.body : { items: req.body };
  const newData = JSON.stringify(dataToSave, null, 2);

  fs.writeFile(DATA_PATH, newData, 'utf8', err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao salvar o arquivo de dados.' });
    }
    res.json({ success: true });
  });
});

// Endpoint para upload de imagens de um produto
app.post('/api/upload/:productId', upload.array('images', 10), (req, res) => {
  try {
    const files = req.files.map(file => {
      // Retorna o caminho relativo para usar no frontend
      return `assets/images/${req.params.productId}/${file.filename}`;
    });

    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para deletar produto e sua pasta de imagens
// Deletar produto e sua pasta de imagens
app.delete('/api/product/:productId', (req, res) => {
  const productId = req.params.productId;
  console.log('🗑️ Requisição DELETE recebida para productId:', productId);

  const imageFolderPath = path.join(__dirname, 'src', 'assets', 'images', productId);
  console.log('📂 Caminho da pasta:', imageFolderPath);
  console.log('📂 Pasta existe?', fs.existsSync(imageFolderPath));

  if (fs.existsSync(imageFolderPath)) {
    try {
      fs.rmSync(imageFolderPath, { recursive: true, force: true });
      console.log(`✅ Pasta de imagens do produto ${productId} deletada`);
      return res.json({ success: true, message: 'Pasta de imagens deletada com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao deletar pasta:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } else {
    console.log('⚠️ Pasta não encontrada');
    return res.status(404).json({ success: false, message: 'Pasta de imagens não encontrada' });
  }
});

// Renomear pasta de imagens de ID temporário para ID definitivo
app.post('/api/product/:tempId/rename/:newId', (req, res) => {
  const { tempId, newId } = req.params;
  console.log(`🔄 Renomeando pasta de ${tempId} para ${newId}`);

  const tempFolderPath = path.join(__dirname, 'src', 'assets', 'images', tempId);
  const newFolderPath = path.join(__dirname, 'src', 'assets', 'images', newId);

  console.log('📂 Pasta temp existe?', fs.existsSync(tempFolderPath));

  if (!fs.existsSync(tempFolderPath)) {
    console.log('⚠️ Pasta temporária não encontrada - nada a renomear');
    return res.status(404).json({ success: false, message: 'Pasta temporária não encontrada' });
  }

  try {
    fs.renameSync(tempFolderPath, newFolderPath);
    console.log(`✅ Pasta renomeada de ${tempId} para ${newId}`);

    // Retornar os novos caminhos das imagens
    const files = fs.readdirSync(newFolderPath);
    const newPaths = files.map(file => `assets/images/${newId}/${file}`);

    return res.json({ success: true, newPaths });
  } catch (error) {
    console.error('❌ Erro ao renomear pasta:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para deletar uma imagem específica
app.delete('/api/image', (req, res) => {
  const { imagePath } = req.body;

  if (!imagePath) {
    return res.status(400).json({ error: 'Caminho da imagem não fornecido.' });
  }

  // Remove o prefixo 'assets/images/' para obter o caminho no sistema de arquivos
  const relativePath = imagePath.replace('assets/images/', '');
  const fullPath = path.join(IMAGES_BASE_PATH, relativePath);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    res.json({ success: true, message: 'Imagem deletada.' });
  } else {
    res.status(404).json({ error: 'Imagem não encontrada.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de cardápio rodando em http://localhost:${PORT}/api/menu`);
  console.log(`Upload de imagens disponível em http://localhost:${PORT}/api/upload/:productId`);
});
