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

app.get('/api/vps', async (_req, res) => {
  try {
    const vps = await getAllVps();
    res.json(vps);
  } catch (error) {
    console.error('Failed to load VPS records:', error);
    res.status(500).json({ message: 'Failed to load VPS records.' });
  }
});

app.post('/api/vps', async (req, res) => {
  const { name, ops, cookie } = req.body as VpsCreateInput;

  if (!name || !ops || !cookie) {
    return res.status(400).json({ message: 'name, ops, and cookie are required.' });
  }

  try {
    const id = await createVps({ name, ops, cookie });

    try {
      const updated = await refreshVpsById(id);
      return res.status(201).json(updated);
    } catch (error) {
      console.error('Failed to scrape VPS after creation:', error);
      const created = await getVpsById(id);
      if (!created) {
        return res.status(500).json({ message: 'VPS was created but could not be loaded.' });
      }
      return res.status(201).json(created);
    }
  } catch (error) {
    console.error('Failed to create VPS record:', error);
    return res.status(500).json({ message: 'Failed to create VPS record.' });
  }
});

app.put('/api/vps/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid VPS id' });
  }

  const { name, ops, cookie } = req.body as VpsUpdateInput;

  try {
    const existing = await getVpsById(id);
    if (!existing) {
      return res.status(404).json({ message: 'VPS not found' });
    }

    await updateVps(id, { name, ops, cookie });

    try {
      const updated = await refreshVpsById(id);
      return res.json(updated);
    } catch (error) {
      console.error('Failed to scrape VPS after update:', error);
      const refreshed = await getVpsById(id);
      if (!refreshed) {
        return res.status(500).json({ message: 'Failed to reload VPS after update.' });
      }
      return res.json(refreshed);
    }
  } catch (error) {
    console.error(`Failed to update VPS ${id}:`, error);
    return res.status(500).json({ message: 'Failed to update VPS.' });
  }
});

app.delete('/api/vps/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid VPS id' });
  }

  try {
    const existing = await getVpsById(id);
    if (!existing) {
      return res.status(404).json({ message: 'VPS not found' });
    }

    await deleteVps(id);
    return res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete VPS ${id}:`, error);
    return res.status(500).json({ message: 'Failed to delete VPS.' });
  }
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
