const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Página HTML que será renderizada no SmartPlug
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>SmartPlug + Agendor</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .item { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h2>Contatos do Agendor:</h2>
        <div id="output">Carregando...</div>

        <script>
          fetch("/api/contatos")
            .then(res => res.json())
            .then(data => {
              const container = document.getElementById('output');
              container.innerHTML = "";

              if (data.length === 0) {
                container.innerHTML = "Nenhum contato encontrado.";
              } else {
                data.forEach(contato => {
                  const div = document.createElement('div');
                  div.className = 'item';
                  div.textContent = contato.nome + " - " + contato.email;
                  container.appendChild(div);
                });
              }
            })
            .catch(() => {
              document.getElementById('output').innerText = "Erro ao carregar dados.";
            });
        </script>
      </body>
    </html>
  `);
});

// API simulando retorno do Agendor
app.get('/api/contatos', (req, res) => {
  // Aqui você pode integrar com a API real do Agendor se quiser
  const contatosFake = [
    { nome: "Vinícius Macagnani", email: "vinicius@email.com" },
    { nome: "Cliente Exemplo", email: "exemplo@cliente.com" }
  ];
  res.json(contatosFake);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
