import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API SmartPlug - Agendor');
});

app.get('/api/contato', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro "email" é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.agendor.com.br/v3/people?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Token ${process.env.AGENDOR_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do Agendor: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json(data.data[0]);
  } catch (error) {
    console.error('Erro na requisição ao Agendor:', error.message);
    res.status(500).json({ error: 'Erro interno ao buscar contato' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
 
