import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import authRouter from './server/routes/auth.ts';
import catalogueRouter from './server/routes/catalogue.ts';
import websiteRouter from './server/routes/website.ts';
import enquiriesRouter from './server/routes/enquiries.ts';
import mediaRouter from './server/routes/media.ts';
import seoRouter from './server/routes/seo.ts';
import usersRouter from './server/routes/users.ts';
import auditRouter from './server/routes/audit.ts';
import settingsRouter from './server/routes/settings.ts';
import diagnosticsRouter from './server/routes/diagnostics.ts';
import dashboardRouter from './server/routes/dashboard.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser & security headers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic request logger
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[ADP-API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    }
    next();
  });

  // Health checks
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'AGECO Digital Platform (ADP) - Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: 'v1',
      database: 'PostgreSQL (ADP authoritative state synced)',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/catalogue', catalogueRouter);
  app.use('/api/v1/website', websiteRouter);
  app.use('/api/v1/enquiries', enquiriesRouter);
  app.use('/api/v1/media', mediaRouter);
  app.use('/api/v1/seo', seoRouter);
  app.use('/api/v1/admin/users', usersRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/audit-logs', auditRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/diagnostics', diagnosticsRouter);
  app.use('/api/v1/dashboard', dashboardRouter);

  // Central error handling middleware for API routes
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[ADP-API-ERROR]', err);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred in the AGECO backend service.',
      },
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AGECO ADP] Admin Panel & Backend API listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AGECO server:', err);
  process.exit(1);
});
