const express = require('express');
const { createServer } = require('vite');
async function run() {
  const app = express();
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
  app.listen(3001, () => console.log('started'));
}
run();
