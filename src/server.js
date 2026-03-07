const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Backend OK'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend OK' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));
