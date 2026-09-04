const express = require('express');
const app = express();
app.all(['/api', '/api/*'], (req, res) => { res.send('caught'); });
app.get('*', (req, res) => { res.send('html'); });
const req = { method: 'POST', url: '/api/extract-pdf' };
app.handle(req, {}, (err) => { console.log('unhandled'); });
