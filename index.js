import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('API Agendor SmartPlug Online');
});

app.get('/api/contatos', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro "email" é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.agendor.com.br/v3/persons/search?term=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Token ${process.env.AGENDOR_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Agendor: ${response.statusText}`);
    }

    const data = await response.json();
    const contato = data.data.find(person => person.email === email);

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json({ data: contato });
  } catch (error) {
    console.error('Erro na requisição ao Agendor:', error.message);
    res.status(500).json({ error: 'Erro interno ao buscar contato' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
