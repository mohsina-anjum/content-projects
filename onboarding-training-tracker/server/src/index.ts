import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import { agendasRouter } from './routes/agendas';
import { newHiresRouter } from './routes/newHires';
import { assignmentsRouter } from './routes/assignments';
import { recomputeAllModuleStages } from './stage';

initDb();
recomputeAllModuleStages();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use('/api/agendas', agendasRouter);
app.use('/api/new-hires', newHiresRouter);
app.use('/api/assignments', assignmentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Onboarding Training Tracker API listening on http://localhost:${PORT}`);
});
