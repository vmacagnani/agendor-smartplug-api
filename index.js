import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();

// --- CONFIGURAÇÃO DOS MIDDLEWARES ---
app.use(cors());
app.use(express.json());


// --- VARIÁVEIS DE AMBIENTE ---
const AGENDOR_API_KEY = process.env.AGENDOR_API_KEY;
const PORT = process.env.PORT || 3000;


// --- ROTAS DA API ---
app.get('/', (req, res) => {
  res.status(200).send('API do SmartPlug para Agendor v3 está no ar.');
});

// --- ROTAS DE PESSOAS ---
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

// Rota para CRIAR um novo contato no Agendor
app.post('/api/criar-contato', async (req, res) => {
  const { name, email, organizationName, phone, ownerUserEmail } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  }
  if (!AGENDOR_API_KEY) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: AGENDOR_API_KEY ausente.' });
  }

  try {
    let organizationId = null;

    if (organizationName && organizationName.trim() !== '') {
      const trimmedOrgName = organizationName.trim();
      try {
        const searchResponse = await axios.get(`https://api.agendor.com.br/v3/organizations?name=${encodeURIComponent(trimmedOrgName)}`, {
          headers: { 'Authorization': `Token ${AGENDOR_API_KEY}` }
        });
        if (searchResponse.data?.data?.length > 0) {
          organizationId = searchResponse.data.data[0].id;
        }
      } catch (searchError) {
        if (searchError.response?.status !== 404) console.error("Erro ao buscar empresa:", searchError.message);
      }
      if (!organizationId) {
        try {
          const createResponse = await axios.post('https://api.agendor.com.br/v3/organizations', { name: trimmedOrgName }, {
            headers: { 'Authorization': `Token ${AGENDOR_API_KEY}`, 'Content-Type': 'application/json' }
          });
          const createdOrg = createResponse.data.data || createResponse.data.organization || createResponse.data;
          organizationId = createdOrg.id;
        } catch (createError) {
            if(createError.response?.status === 409) {
                const raceSearchResponse = await axios.get(`https://api.agendor.com.br/v3/organizations?name=${encodeURIComponent(trimmedOrgName)}`, {
                    headers: { 'Authorization': `Token ${AGENDOR_API_KEY}` }
                });
                if (raceSearchResponse.data?.data?.length > 0) {
                    organizationId = raceSearchResponse.data.data[0].id;
                } else {
                    throw new Error('Falha ao encontrar empresa após conflito.');
                }
            } else {
                throw createError;
            }
        }
      }
    }

    const payload = {
      name: name,
      contact: { 
        email: email,
        whatsapp: phone || null 
      }
    };
    
    if (organizationId) {
      payload.organization = parseInt(organizationId, 10);
    }
    
    // A documentação permite enviar o email do responsável diretamente.
    if (ownerUserEmail) {
        payload.ownerUser = ownerUserEmail;
    }

    const response = await axios.post('https://api.agendor.com.br/v3/people', payload, {
      headers: { 'Authorization': `Token ${AGENDOR_API_KEY}`, 'Content-Type': 'application/json' }
    });
    
    const createdData = response.data.data || response.data;
    return res.status(201).json(createdData);

  } catch (error) {
    console.error('Erro no processo de criar contato:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    let message = (error.response?.data?.errors || ['Erro ao criar contato no Agendor.']).join(', ');
    if (status === 409) {
        message = 'Um contato com este email já existe no Agendor.';
    }
    return res.status(status).json({ error: message });
  }
});


// --- ROTAS DE EMPRESAS ---
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

app.post('/api/criar-empresa', async (req, res) => {
    // Adiciona 'description' aos dados recebidos do corpo da requisição
    const { name, cnpj, ownerUserEmail, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
    if (!AGENDOR_API_KEY) return res.status(500).json({ error: 'Erro de configuração: AGENDOR_API_KEY ausente.' });
    
    const payload = { name };
    if (cnpj) payload.cnpj = cnpj;
    if (ownerUserEmail) {
        payload.ownerUser = ownerUserEmail;
    }
    // Adiciona a descrição ao payload se ela for enviada
    if (description) {
        payload.description = description;
    }

    try {
        const response = await axios.post('https://api.agendor.com.br/v3/organizations', payload, {
            headers: { 'Authorization': `Token ${AGENDOR_API_KEY}`, 'Content-Type': 'application/json' }
        });
        
        const createdData = response.data.data || response.data.organization || response.data;
        return res.status(201).json(createdData);

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
