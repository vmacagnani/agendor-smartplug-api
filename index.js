const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('API Agendor SmartPlug Online');
});

app.get('/api/contatos', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro email é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.agendor.com.br/v3/persons/search?term=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Token ${process.env.AGENDOR_TOKEN}`
      }
    });

    const data = await response.json();
    res.json({ data: data.data });
  } catch (error) {
    console.error('Erro na requisição ao Agendor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
