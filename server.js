'use strict';

const express = require('express');
const { users, documents, employees } = require('./data');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

function authMiddleware(req, res, next) {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];
  const user = users.find(user => user.login === login && user.password === password);
  if (!user) {
    return res.status(401).json({
      message: 'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.',
    });
  }
  req.user = user;
  next();
}

function adminOnlyMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
}

app.get('/', (req, res) => {
  res.send('Hello World! The server is running.');
});

app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

app.post('/documents', authMiddleware, (req, res) => {
  const newDocument = { ...req.body, id: Date.now() };
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
