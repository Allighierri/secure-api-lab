'use strict';

const express = require('express');
const { documents, employees } = require('./data');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World! The server is running.');
});

app.get('/documents', (req, res) => {
  res.status(200).json(documents);
});

app.post('/documents', (req, res) => {
  const newDocument = { ...req.body, id: Date.now() };
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

app.get('/employees', (req, res) => {
  res.status(200).json(employees);
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
