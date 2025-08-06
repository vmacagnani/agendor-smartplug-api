import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const AGENDOR_API_KEY = process.env.AGENDOR_API_KEY;
const PORT = process.env.PORT || 3000;

app.get('/api/contato', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro "email" é obrigatório.' });
  }

  try {
    const response = await axios.get(`https://api.agendor.com.br/v3/people?email=${email}`, {
      headers: {
        Authorization: `Token ${AGENDOR_API_KEY}`
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      return res.json(response.data.data[0]);
    } else {
      return res.status(404).json({ error: 'Contato não encontrado no Agendor.' });
    }
  } catch (error) {
    console.error('Erro ao buscar no Agendor:', error.response?.data || error.message);

    if (error.response?.data?.errors?.includes('Token could not be authenticated')) {
      return res.status(401).json({ error: 'Token do Agendor inválido.' });
    }

    return res.status(500).json({ error: 'Erro ao buscar no Agendor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
