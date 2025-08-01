const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const AGENDOR_TOKEN = process.env.AGENDOR_TOKEN;

app.get("/", (req, res) => {
  res.send("API funcionando! Use /buscar-cliente?email=...");
});

app.get("/buscar-cliente", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Parâmetro 'email' é obrigatório." });
  }

  try {
    // Busca genérica com parte do e-mail
    const searchResponse = await axios.get("https://api.agendor.com.br/v3/search/people", {
      params: { q: email },
      headers: {
        Authorization: `Token ${AGENDOR_TOKEN}`
      }
    });

    const resultados = searchResponse.data?.data || [];

    // Procura exata pelo e-mail
    const cliente = resultados.find(pessoa =>
      pessoa.emails?.some(e => e.address.toLowerCase() === email.toLowerCase())
    );

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente não encontrado",
        message: `Nenhum cliente com o e-mail ${email} foi encontrado.`
      });
    }

    return res.json({
      nome: cliente.name,
      empresa: cliente.organization?.name || "Sem empresa associada",
      telefone: cliente.phones?.[0]?.number || "Sem telefone",
      email: cliente.emails?.[0]?.address || email,
      tags: cliente.tags || [],
      observacoes: cliente.notes || "",
      id: cliente.id
    });

  } catch (err) {
    console.error("Erro na requisição:", err.message);
    return res.status(500).json({
      error: "Erro ao buscar cliente",
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
