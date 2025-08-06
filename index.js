import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('🟢 API SmartPlug Agendor está online!');
});

app.get('/api/contato', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro "email" é obrigatório' });
  }

  try {
    const response = await fetch('https://api.agendor.com.br/v3/people', {
      headers: {
        Authorization: `Token ${process.env.AGENDOR_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API do Agendor: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const contato = data.data.find(pessoa => pessoa.email === email);

    if (!contato) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json(contato);
  } catch (error) {
    console.error('Erro na requisição ao Agendor:', error.message);
    res.status(500).json({ error: 'Erro interno ao buscar contato' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
