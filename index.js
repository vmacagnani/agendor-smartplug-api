import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DOS MIDDLEWARES ---
// Habilita o CORS para permitir que o frontend acesse a API
app.use(cors());
// Habilita o Express para conseguir ler o corpo de requisições em formato JSON
app.use(express.json());


// --- VARIÁVEIS DE AMBIENTE ---
const AGENDOR_API_KEY = process.env.AGENDOR_API_KEY;
const PORT = process.env.PORT || 3000;


// --- ROTAS DA API ---

// Rota de teste para verificar se a API está online
app.get('/', (req, res) => {
  res.status(200).send('API do SmartPlug para Agendor está no ar.');
});

// Rota para BUSCAR um contato existente no Agendor
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

// Rota para CRIAR um novo contato no Agendor
app.post('/api/criar-contato', async (req, res) => {
  const { name, email, organizationName, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  }

  if (!AGENDOR_API_KEY) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: AGENDOR_API_KEY ausente.' });
  }

  const agendorPayload = {
    name: name,
    email: email,
    organization: { name: organizationName || '' },
    contact: { whatsapp: phone || null }
  };

  try {
    const response = await axios.post('https://api.agendor.com.br/v3/people', agendorPayload, {
      headers: {
        'Authorization': `Token ${AGENDOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Erro ao criar contato no Agendor:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    let message = 'Erro ao conectar à API do Agendor.';
    if (status === 409) { // 409 Conflict (email duplicado)
        message = 'Um contato com este email já existe no Agendor.';
    } else if (error.response?.data?.error) {
        message = error.response.data.error;
    }
    return res.status(status).json({ error: message });
  }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
