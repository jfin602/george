import express from 'express';

export function createApp() {
  const app = express();
  const notes = [];
  let nextId = 1;
  app.use(express.json());
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/notes', (_request, response) => response.json(notes));
  app.post('/notes', (request, response) => {
    const text = typeof request.body?.text === 'string' ? request.body.text.trim() : '';
    if (!text) return response.status(400).json({ error: 'text is required' });
    const note = { id: nextId++, text };
    notes.push(note);
    return response.status(201).json(note);
  });
  return app;
}
