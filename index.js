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
  res.status(200).send('API do SmartPlug para Agendor v3 está no ar.');
});

// --- ROTAS DE PESSOAS ---

// Rota para BUSCAR um contato existente no Agendor
app.get('/api/contato', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Parâmetro "email" é obrigatório.' });
  if (!AGENDOR_API_KEY) return res.status(500).json({ error: 'Erro de configuração: AGENDOR_API_KEY ausente.' });
  try {
    const response = await axios.get(`https://api.agendor.com.br/v3/people?email=${email}`, {
      headers: { 'Authorization': `Token ${AGENDOR_API_KEY}` }
    });
    if (response.data?.data?.length > 0) return res.json(response.data.data[0]);
    return res.status(404).json({ error: 'Contato não encontrado.' });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({ error: 'Erro ao buscar contato no Agendor.' });
  }
});

// Rota para CRIAR um novo contato no Agendor (versão corrigida)
app.post('/api/criar-contato', async (req, res) => {
  // Adicionamos 'organizationId' aos dados recebidos
  const { name, email, organizationName, organizationId, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  }
  if (!AGENDOR_API_KEY) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: AGENDOR_API_KEY ausente.' });
  }

  // Monta o corpo da requisição inicial
  const payload = {
    name: name,
    email: email,
    contact: { whatsapp: phone || null }
  };

  // --- INÍCIO DA CORREÇÃO ---
  // Adiciona a organização SOMENTE se um nome ou ID for fornecido e não estiver vazio
  if (organizationId) {
    payload.organization = { id: organizationId };
  } else if (organizationName && organizationName.trim() !== '') {
    payload.organization = { name: organizationName.trim() };
  }
  // --- FIM DA CORREÇÃO ---

  try {
    const response = await axios.post('https://api.agendor.com.br/v3/people', payload, {
      headers: {
        'Authorization': `Token ${AGENDOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return res.status(201).json(response.data);
  } catch (error) {
    console.error('Erro ao criar contato no Agendor:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    // Tenta retornar uma mensagem de erro mais específica da API do Agendor
    let message = (error.response?.data?.errors || ['Erro ao criar contato no Agendor.']).join(', ');
    if (status === 409) {
        message = 'Um contato com este email já existe no Agendor.';
    }
    return res.status(status).json({ error: message });
  }
});


// --- ROTAS DE EMPRESAS ---

// Rota para BUSCAR uma empresa pelo nome
app.get('/api/empresa', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Parâmetro "name" é obrigatório.' });
    if (!AGENDOR_API_KEY) return res.status(500).json({ error: 'Erro de configuração: AGENDOR_API_KEY ausente.' });
    try {
        const response = await axios.get(`https://api.agendor.com.br/v3/organizations?name=${name}`, {
            headers: { 'Authorization': `Token ${AGENDOR_API_KEY}` }
        });
        if (response.data?.data?.length > 0) return res.json(response.data.data[0]);
        return res.status(404).json({ error: 'Empresa não encontrada.' });
    } catch (error) {
        const status = error.response?.status || 500;
        return res.status(status).json({ error: 'Erro ao buscar empresa no Agendor.' });
    }
});

// Rota para CRIAR uma nova empresa
app.post('/api/criar-empresa', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
    if (!AGENDOR_API_KEY) return res.status(500).json({ error: 'Erro de configuração: AGENDOR_API_KEY ausente.' });
    const payload = { name };
    try {
        const response = await axios.post('https://api.agendor.com.br/v3/organizations', payload, {
            headers: { 'Authorization': `Token ${AGENDOR_API_KEY}`, 'Content-Type': 'application/json' }
        });
        return res.status(201).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = status === 409 ? 'Uma empresa com este nome já existe.' : 'Erro ao criar empresa no Agendor.';
        return res.status(status).json({ error: message });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor v3 rodando na porta ${PORT}`);
});
