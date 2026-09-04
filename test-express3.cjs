const express = require('express');
const app = express();
app.use('/api', (req, res) => { console.log('caught by use'); });
const req = { method: 'POST', url: '/api/extract-pdf' };
app.handle(req, {}, (err) => { console.log('unhandled'); });
