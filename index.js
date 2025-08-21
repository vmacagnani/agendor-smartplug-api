import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const AGENDOR_API_KEY = process.env.AGENDOR_API_KEY;
const PORT = process.env.PORT || 3000;

// --- ROTAS DE TESTE E PESSOAS (EXISTENTES) ---
app.get('/', (req, res) => res.status(200).send('API do SmartPlug para Agendor v2 está no ar.'));

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

app.post('/api/criar-contato', async (req, res) => {
  const { name, email, organizationName, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  if (!AGENDOR_API_KEY) return res.status(500).json({ error: 'Erro de configuração: AGENDOR_API_KEY ausente.' });
  const payload = { name, email, organization: { name: organizationName || '' }, contact: { whatsapp: phone || null } };
  try {
    const response = await axios.post('https://api.agendor.com.br/v3/people', payload, {
      headers: { 'Authorization': `Token ${AGENDOR_API_KEY}`, 'Content-Type': 'application/json' }
    });
    return res.status(201).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = status === 409 ? 'Um contato com este email já existe.' : 'Erro ao criar contato no Agendor.';
    return res.status(status).json({ error: message });
  }
});

// --- NOVAS ROTAS PARA EMPRESAS ---

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
  console.log(`Servidor v2 rodando na porta ${PORT}`);
});
