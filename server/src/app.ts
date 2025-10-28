import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import {
  createVps,
  deleteVps,
  getAllVps,
  getVpsById,
  updateVps
} from './vpsRepository';
import { refreshAllVps, refreshVpsById } from './refreshService';
import { VpsCreateInput, VpsUpdateInput } from './types';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/vps', (_req, res) => {
  const vps = getAllVps();
  res.json(vps);
});

app.post('/api/vps', async (req, res) => {
  const { name, ops, cookie } = req.body as VpsCreateInput;

  if (!name || !ops || !cookie) {
    return res.status(400).json({ message: 'name, ops, and cookie are required.' });
  }

  const id = createVps({ name, ops, cookie });

  try {
    const updated = await refreshVpsById(id);
    res.status(201).json(updated);
  } catch (error) {
    console.error('Failed to scrape VPS after creation:', error);
    const created = getVpsById(id);
    if (!created) {
      return res.status(500).json({ message: 'VPS was created but could not be loaded.' });
    }
    res.status(201).json(created);
  }
});

app.put('/api/vps/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid VPS id' });
  }

  const { name, ops, cookie } = req.body as VpsUpdateInput;
  const existing = getVpsById(id);
  if (!existing) {
    return res.status(404).json({ message: 'VPS not found' });
  }

  updateVps(id, { name, ops, cookie });

  try {
    const updated = await refreshVpsById(id);
    res.json(updated);
  } catch (error) {
    console.error('Failed to scrape VPS after update:', error);
    const refreshed = getVpsById(id);
    if (!refreshed) {
      return res.status(500).json({ message: 'Failed to reload VPS after update.' });
    }
    res.json(refreshed);
  }
});

app.delete('/api/vps/:id', (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid VPS id' });
  }

  const existing = getVpsById(id);
  if (!existing) {
    return res.status(404).json({ message: 'VPS not found' });
  }

  deleteVps(id);
  res.status(204).send();
});

app.post('/api/vps/:id/refresh', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid VPS id' });
  }

  try {
    const updated = await refreshVpsById(id);
    res.json(updated);
  } catch (error) {
    console.error(`Failed to refresh VPS ${id}:`, error);
    res.status(500).json({ message: 'Failed to refresh VPS' });
  }
});

app.post('/api/vps/refresh-all', async (_req, res) => {
  try {
    const refreshed = await refreshAllVps();
    res.json(refreshed);
  } catch (error) {
    console.error('Failed to refresh all VPS records:', error);
    res.status(500).json({ message: 'Failed to refresh VPS records' });
  }
});

const clientDistPath = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

export default app;
