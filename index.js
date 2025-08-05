// index.js

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

// Carrega variáveis do ambiente (.env ou Render)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Rota principal de teste
app.get('/', (req, res) => {
  res.send('API SmartPlug com dados do Agendor está rodando!');
});

// Rota de contatos (API externa do Agendor)
app.get('/api/contatos', async (req, res) => {
  try {
    const response = await fetch('https://api.agendor.com.br/v3/people', {
      headers: {
        'Authorization': `Token ${process.env.AGENDOR_TOKEN}`
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao buscar contatos do Agendor' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro ao acessar a API do Agendor:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
