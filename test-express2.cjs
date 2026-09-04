const express = require('express');
const app = express();
app.all(['/api', '/api/*'], (req, res) => { console.log('caught'); });
app.get('*', (req, res) => { console.log('html'); });
const req = { method: 'POST', url: '/api/extract-pdf' };
app.handle(req, {}, (err) => { console.log('unhandled'); });
