const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const AGENDOR_TOKEN = process.env.AGENDOR_TOKEN;

app.get('/', (req, res) => {
  res.send('API funcionando! Use /buscar-cliente?email=...');
});

app.get('/buscar-cliente', async (req, res) => {
  const email = req.query.email;
  let page = 1;
  let achou = null;

  try {
    while (!achou) {
      const { data } = await axios.get('https://api.agendor.com.br/v3/people', {
        headers: {
          Authorization: `Token ${AGENDOR_TOKEN}`
        },
        params: { page }
      });

      if (data.data.length === 0) break;

      achou = data.data.find(p => p.email === email);
      if (achou) break;

      page++;
    }

    if (achou) {
      res.json({
        data: {
          name: achou.name,
          email: achou.email,
          organization: achou.organization?.name || "N/A",
          phone: achou.phones[0]?.number || "N/A"
        }
      });
    } else {
      res.json({
        data: {
          name: "Não encontrado",
          email: email,
          organization: "N/A",
          phone: "N/A"
        }
      });
    }

  } catch (err) {
    res.status(500).json({
      error: "Erro ao buscar cliente",
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
