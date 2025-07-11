// backend/index.js
const express = require('express');
const app = express();
const port = 3001; // Choose a different port than React's default 3000

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
