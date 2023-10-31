const express = require('express');
const app = express();
const cors = require('cors');
const mysql = require('mysql2');
const { format } = require('date-fns');
const basicAuth = require("basic-auth");
const dotenv = require("dotenv"); 
const axios = require("axios");


app.use(cors());
app.use(express.json());
dotenv.config();

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
          if (!novoStatus) {
            console.log(novoStatus);
            servicenow(processo);
          }
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


async function servicenow (processo) {
  const dataHoraAtual = new Date();
  const date = format(dataHoraAtual, 'dd/MM/yyyy HH:mm:ss');
  const config = {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.AUTH_USERNAME}:${process.env.AUTH_PASSWORD}`).toString('base64'),
        'Content-Type': 'application/json'
      }
  };

  const callerId = "31dedd3a1b42f1d034255311604bcb70";

  const data = { 
      callerId, 
      short_description: "UFJF - Grupo 1 - (Lucas e Augusto) - Incidente hackaton", 
      description: `incidente criado automático - ${processo.nome} - hospedado em ${processo.ic} - virtualizado por AWS0001 - criticidade: ${processo.criticidade}`,
      category:"software",
      work_notes: `Data de parada: ${date}`
  }

  try {
      const response = await axios.post(`https://4matttecnologiadainformacaoltdademo3.service-now.com/api/now/table/incident`,data,config);
      console.log(response.data.result);
  } catch (error) {
      console.log(error);
      
  }
} 


app.listen(3001);
