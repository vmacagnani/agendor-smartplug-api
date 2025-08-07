import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Configuração de CORS para permitir que qualquer origem acesse a API
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
}));

// Obtém as variáveis de ambiente
const AGENDOR_API_KEY = process.env.AGENDOR_API_KEY;
const PORT = process.env.PORT || 3000;

// Rota de teste para verificar se a API está online
app.get('/', (req, res) => {
  res.status(200).send('API do SmartPlug para Agendor está no ar.');
});

// Rota principal que busca o contato no Agendor
app.get('/api/contato', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro "email" é obrigatório.' });
  }

  if (!AGENDOR_API_KEY) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: AGENDOR_API_KEY ausente.' });
  }

  try {
    const response = await axios.get(`https://api.agendor.com.br/v3/people?email=${email}`, {
      headers: {
        'Authorization': `Token ${AGENDOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      return res.json(response.data.data[0]);
    } else {
      return res.status(404).json({ error: 'Contato não encontrado no Agendor.' });
    }

  } catch (error) {
    console.error('Erro ao buscar no Agendor:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Erro ao conectar à API do Agendor.';
    return res.status(status).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
