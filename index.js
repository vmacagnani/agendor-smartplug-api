const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/contato', async (req, res) => {
  const { email } = req.query;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  try {
    const response = await axios.get(`https://api.agendor.com.br/v3/people?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Token ${process.env.AGENDOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;

    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const contato = data.data[0];

    res.json({
      name: contato.name,
      email: contato.email,
      contact: contato.phones?.[0]?.number || '',
      organization: contato.organization || {},
      role: contato.role || ''
    });

  } catch (error) {
    console.error('Erro ao buscar no Agendor:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao buscar no Agendor' });
  }
});

app.get('/', (req, res) => {
  res.send('API Agendor está ativa.');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
