const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config(); // carrega variáveis do .env local (ignorado no render)

app.get('/api/contatos', async (req, res) => {
  try {
    const token = process.env.AGENDOR_TOKEN;
    if (!token) return res.status(500).json({ error: 'Token não configurado.' });

    const response = await axios.get('https://api.agendor.com.br/v3/people', {
      headers: {
        Authorization: `Token ${token}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro na requisição:', error.message);
    res.status(500).json({ error: 'Erro ao buscar contatos do Agendor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
