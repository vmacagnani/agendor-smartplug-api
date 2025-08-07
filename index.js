import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env (para desenvolvimento local)
dotenv.config();

const app = express();
// Habilita o CORS para permitir que o Freshdesk acesse sua API
app.use(cors());

// Obtém as variáveis de ambiente
const AGENDOR_API_KEY = process.env.AGENDOR_API_KEY;
const PORT = process.env.PORT || 3000;

// Rota de teste para verificar se a API está online
app.get('/', (req, res) => {
  res.status(200).send('API do SmartPlug para Agendor está no ar e pronta para receber chamadas.');
});

// Rota principal que busca o contato no Agendor
app.get('/api/contato', async (req, res) => {
  const { email } = req.query;

  // 1. Validação do parâmetro de email
  if (!email) {
    return res.status(400).json({ error: 'Parâmetro "email" é obrigatório na consulta.' });
  }
  
  // 2. Validação da chave de API
  if (!AGENDOR_API_KEY) {
    console.error('Erro fatal: A variável de ambiente AGENDOR_API_KEY não está configurada no servidor.');
    return res.status(500).json({ error: 'Erro de configuração no servidor: chave de API ausente.' });
  }

  // 3. Chamada para a API do Agendor
  try {
    const response = await axios.get(`https://api.agendor.com.br/v3/people?email=${email}`, {
      headers: {
        'Authorization': `Token ${AGENDOR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 4. Tratamento da resposta do Agendor
    if (response.data && response.data.data && response.data.data.length > 0) {
      // Retorna o primeiro contato encontrado com aquele email
      return res.json(response.data.data[0]);
    } else {
      // Nenhum contato encontrado
      return res.status(404).json({ error: 'Contato não encontrado no Agendor.' });
    }

  } catch (error) {
    // 5. Tratamento de erros da chamada
    console.error('Erro ao buscar dados no Agendor:', error.response?.data || error.message);
    
    if (error.response) {
        // O Agendor respondeu com um status de erro (4xx, 5xx)
        if (error.response.status === 401) {
             return res.status(401).json({ error: 'Token de autenticação do Agendor é inválido ou expirou.' });
        }
         return res.status(error.response.status).json({ error: `Erro na API do Agendor: ${error.response.data?.error || error.message}` });
    } else {
        // Erro de rede ou outro problema que impediu a comunicação com o Agendor
        return res.status(500).json({ error: 'Não foi possível conectar à API do Agendor.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
