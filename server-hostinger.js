const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Servir archivos estáticos
app.use(express.static('/home/u582924658/domains/palevioletred-wasp-581512.hostingersite.com/public_html'));

// Middleware de admin
const requireAdmin = (req, res, next) => {
  console.log('requireAdmin called for:', req.path);
  next(); // Permitir por ahora para testing
};

// Rutas
app.get('/api/admin/users', requireAdmin, (req, res) => {
  console.log('Route /api/admin/users called');
  res.json({ ok: true, users: [
    { id: 1, username: 'admin', names: 'Admin User' },
    { id: 2, username: 'testuser', names: 'Test User' }
  ] });
});

// Catch-all - servir SPA
app.get('*', (req, res) => {
  console.log('Catch-all called for:', req.path);
  res.sendFile('/home/u582924658/domains/palevioletred-wasp-581512.hostingersite.com/public_html/index.html');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});