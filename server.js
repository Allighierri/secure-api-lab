'use strict';

const express = require('express');
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.get('/', (req, res) => {
  res.send('Hello World! The server is running.');
});

if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
