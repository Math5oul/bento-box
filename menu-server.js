const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

const DATA_PATH = path.join(__dirname, 'src', 'assets', 'data', 'menu-data.json');

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Servidor de cardápio rodando em http://localhost:${PORT}/api/menu`);
});
