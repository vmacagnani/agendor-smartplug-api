import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const app = express();
app.use(cors());

const { AGENDOR_API_KEY, JWT_SECRET, PORT = 3000 } = process.env;

app.get('/smartplug', async (req, res) => {
  // 1. Validar se os segredos estão configurados no servidor
  if (!AGENDOR_API_KEY || !JWT_SECRET) {
    return res.status(500).send('Erro de configuração no servidor: Chaves de API ou JWT ausentes.');
  }

  // 2. Receber e validar o token do Freshdesk
  const { signed_token } = req.query;
  if (!signed_token) {
    return res.status(400).send('Token do Freshdesk não recebido.');
  }

  try {
    // 3. Decodificar o token para obter os dados do usuário
    const decoded = jwt.verify(signed_token, JWT_SECRET);
    const userEmail = decoded?.context?.user?.email;

    if (!userEmail) {
      return res.send('<p>Email do cliente não encontrado no token.</p>');
    }

    // 4. Buscar os dados no Agendor com o email obtido
    const agendorResponse = await axios.get(`https://api.agendor.com.br/v3/people?email=${userEmail}`, {
      headers: { 'Authorization': `Token ${AGENDOR_API_KEY}` }
    });

    const contactData = agendorResponse.data?.data?.[0];

    if (!contactData) {
      return res.send(`<p>Cliente com email ${userEmail} não encontrado no Agendor.</p>`);
    }

    // 5. Montar e enviar o HTML final como resposta
    const orgName = contactData.organization?.name || 'N/A';
    const phone = contactData.contact?.whatsapp || contactData.contact?.mobile || 'N/A';

    const finalHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><style>body{font-family:-apple-system,sans-serif;padding:15px;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:8px;border:1px solid #e1e1e1;text-align:left;word-break:break-all}th{background-color:#f8f8f8;width:30%}</style></head>
      <body>
        <h4>Cliente no Agendor</h4>
        <table>
          <tr><th>Nome</th><td>${contactData.name || 'N/A'}</td></tr>
          <tr><th>Email</th><td>${contactData.email || 'N/A'}</td></tr>
          <tr><th>Telefone</th><td>${phone}</td></tr>
          <tr><th>Empresa</th><td>${orgName}</td></tr>
        </table>
      </body>
      </html>
    `;
    res.send(finalHtml);

  } catch (error) {
    console.error('Erro no processo:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).send('Erro: A Chave Secreta JWT está incorreta.');
    }
    if (error.response) { // Erro da API do Agendor
        return res.status(404).send(`Cliente com email não encontrado no Agendor.`);
    }
    return res.status(500).send('Ocorreu um erro interno.');
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
