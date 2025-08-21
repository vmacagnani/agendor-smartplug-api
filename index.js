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

// Rota para CRIAR um novo contato no Agendor (versão com lógica de organização inteligente)
app.post('/api/criar-contato', async (req, res) => {
  const { name, email, organizationName, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e Email são obrigatórios.' });
  }
  if (!AGENDOR_API_KEY) {
    return res.status(500).json({ error: 'Erro de configuração no servidor: AGENDOR_API_KEY ausente.' });
  }

  try {
    let organizationId = null;

    // Se um nome de empresa foi fornecido, vamos encontrar ou criar o ID dela
    if (organizationName && organizationName.trim() !== '') {
      const trimmedOrgName = organizationName.trim();
      
      // 1. Tenta buscar a empresa pelo nome exato
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

      // 2. Se a empresa não foi encontrada, cria uma nova
      if (!organizationId) {
        try {
          const createResponse = await axios.post('https://api.agendor.com.br/v3/organizations', { name: trimmedOrgName }, {
            headers: { 'Authorization': `Token ${AGENDOR_API_KEY}`, 'Content-Type': 'application/json' }
          });
          const createdOrg = createResponse.data.data || createResponse.data.organization || createResponse.data;
          organizationId = createdOrg.id;
        } catch (createError) {
            // Se a criação falhar por conflito (outra pessoa criou ao mesmo tempo), tenta buscar novamente
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
                throw createError; // Lança outros erros de criação
            }
        }
      }
    }

    // 3. Agora, cria a pessoa com o ID da organização (se houver)
    const payload = {
      name: name,
      email: email,
      contact: { whatsapp: phone || null }
    };
    if (organizationId) {
      payload.organization = { id: organizationId };
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
    if (status === 409) { // Este 409 se refere a um email de pessoa duplicado
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
        
        // A resposta do Agendor pode estar aninhada em 'data' ou 'organization'.
        // Este código verifica todas as possibilidades e retorna o objeto correto.
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
