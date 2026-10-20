'use strict';

const express = require('express');
const { users, documents, employees } = require('./data');
const app = express();
const PORT = Number(process.env.PORT || 3000);
let lastDocumentId = Math.max(0, ...documents.map(document => document.id));

function loggingMiddleware(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

// Логер стоїть першим, щоб реєструвати також помилки парсингу JSON.
app.use(loggingMiddleware);
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
  const { title, content } = req.body || {};
  if (typeof title !== 'string' || !title.trim() ||
      typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      message: 'Bad Request. Fields "title" and "content" are required and must be non-empty strings.',
    });
  }
  // Два запити в одну мілісекунду також отримають різні ID.
  lastDocumentId = Math.max(Date.now(), lastDocumentId + 1);
  const newDocument = { id: lastDocumentId, title, content };
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

app.delete('/documents/:id', authMiddleware, (req, res) => {
  // Не перетворюємо "1abc" або "1.5" на ідентифікатор 1 через parseInt.
  const id = /^\d+$/.test(req.params.id) ? Number(req.params.id) : NaN;
  const index = Number.isSafeInteger(id)
    ? documents.findIndex(document => document.id === id)
    : -1;
  if (index === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }
  documents.splice(index, 1);
  res.status(204).send();
});

app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Помилки JSON також повертаються як JSON, без внутрішнього stack trace.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Bad Request. Invalid JSON.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large.' });
  }
  console.error('Unexpected request error:', error.message);
  res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', error => {
    if (error) {
      console.error(`Failed to start server: ${error.code || error.message}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
