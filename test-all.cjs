const express = require('express');
const app = express();
app.all(['/api', '/api/*'], (req, res) => {
  res.json({ caught: true });
});
app.listen(3002, () => console.log('started'));
