const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'Desafio-4Matt',
});

connection.connect((err) => {
  if (err) throw err;
});


function convertStatus(status) {
  if (status === 0)
    return 'Parado';
  return 'Funcionando';
}

function unconvertStatus(status) {
  if (status === 'Parado')
    return 0;
  return 1;
}

function executeQuery(sql, filtro) {
  return new Promise((resolve, reject) => {
    connection.query(sql, filtro, (error, results, fields) => {
      if (error) throw error;
      for (let i = 0; i < results.length; i++) {
        results[i].status = convertStatus(results[i].status);
      }
      resolve(results);
    });
  });
}

app.get('/getTableData', (req, res) => {
  const { ic } = req.query;

  let sql = 'SELECT * FROM processo';
  let filtro = [];

  if (ic) {
    sql += ' WHERE ic = ?';
    filtro.push(ic);
  }

  executeQuery(sql, filtro)
    .then((results) => {
      res.send(results);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.patch('/alterarStatus', (req, res) => {
  const { id } = req.query;

  const processo = 'SELECT * FROM processo WHERE id = ?';
  executeQuery(processo, [id])
    .then((results) => {
      const status = unconvertStatus(results[0].status);
      const novoStatus = !status;

      const sql = 'UPDATE processo SET status = ? WHERE id = ?';

      executeQuery(sql, [novoStatus, id])
        .then(() => {
          res.json({ message: 'Status alterado com sucesso!' });
        })
        .catch(() => {
          res.json({ message: 'Erro ao alterar status!' });
        });
    })
    .catch(() => {
      res.json({ message: 'Erro ao alterar status!' });
    });
});

app.listen(3001);
