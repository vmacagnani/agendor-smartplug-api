import express from 'express';
import cors from 'cors'; // <--- Adicione isso
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // <--- E isso aqui

app.get('/api/contato', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Email é obrigatório' });
  }

  try {
    const response = await fetch(`https://api.agendor.com.br/v3/people?email=${encodeURIComponent(email)}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.AGENDOR_API_TOKEN}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data || !data.data || data.data.length === 0) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    const contato = data.data[0];

    res.json({
      name: contato.name,
      email: contato.email,
      contact: contato.phones?.[0]?.number || '',
      organization: contato.organization,
      role: contato.role
    });
  } catch (error) {
    console.error('Erro na requisição ao Agendor:', error);
    res.status(500).json({ error: 'Erro interno ao buscar contato' });
  }
});

app.get('/', (req, res) => {
  res.send('API Agendor OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
