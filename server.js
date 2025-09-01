// server.js - Local development server for API routes
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// API Routes
const apiRoutes = [
  'generate',
  'auth/start',
  'auth/callback',
  'auth/generate',
  'pinterest/boards'
];

apiRoutes.forEach(route => {
  const routePath = `/api/${route}`;
  const filePath = path.join(__dirname, 'api', `${route}.ts`);

  if (fs.existsSync(filePath)) {
    console.log(`Loading API route: ${routePath}`);

    app.all(routePath, async (req, res) => {
      try {
        // Import the route handler dynamically
        const module = await import(filePath);
        const handler = module.default;

        // Call the handler
        await handler(req, res);
      } catch (error) {
        console.error(`Error in ${routePath}:`, error);
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    });
  } else {
    console.log(`API route file not found: ${filePath}`);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📡 Available API routes:`);
  apiRoutes.forEach(route => {
    console.log(`   http://localhost:${PORT}/api/${route}`);
  });
  console.log(`💡 Frontend should proxy API calls to this server`);
});