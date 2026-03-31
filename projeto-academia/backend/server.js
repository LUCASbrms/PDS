const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares (Configurações básicas)
app.use(cors());
app.use(express.json()); 

// Rota de teste
app.get('/', (req, res) => {
  res.send('Servidor da Academia rodando perfeitamente! 🚀');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});