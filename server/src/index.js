import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import worksRoutes from './routes/works.js';
import certRoutes from './routes/certificates.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static: certificate PDFs
const certsDir = join(__dirname, '..', 'public');
if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
app.use('/static', express.static(certsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CNB Academy API', time: new Date().toISOString() });
});

// Serve frontend in production
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/static')) {
      res.sendFile(join(clientDist, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`\n  CNB 亚洲互联网学院 - 服务器已启动`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log(`  验证页: http://localhost:${PORT}/verify/CNB-XXXX-XXXXXXXX\n`);
});
