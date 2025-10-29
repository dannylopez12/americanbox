const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Permitir dominios de Hostinger y localhost
    const allowedOrigins = [
      /\.hostingersite\.com$/,  // Permitir cualquier subdominio de hostingersite.com
      /^https?:\/\/localhost(:\d+)?$/,  // Permitir localhost con cualquier puerto
    ];

    // Verificar si el origin está permitido
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS rechazado para origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Configurar sesiones
app.use(session({
  secret: 'americanbox-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Pool de conexión MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: process.env.DB_USER || 'u582924658_American',
  password: process.env.DB_PASSWORD || '1532DAnILO',
  database: process.env.DB_NAME || 'u582924658_American',
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
  acquireTimeout: 60000,
  timeout: 60000,
});

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
};

// Middleware de admin
const requireAdmin = (req, res, next) => {
  console.log('requireAdmin middleware called');
  return res.status(403).json({ ok: false, error: 'Test auth' });
};

// ===== RUTAS DE AUTENTICACIÓN =====

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Usuario y contraseña requeridos' 
      });
    }

    const conn = await pool.getConnection();
    
    try {
      // Buscar usuario
      const [users] = await conn.execute(
        'SELECT id, username, password_hash, is_admin, role FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ 
          ok: false, 
          error: 'Credenciales inválidas' 
        });
      }

      const user = users[0];
      
      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ 
          ok: false, 
          error: 'Credenciales inválidas' 
        });
      }

      // Guardar sesión
      req.session.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
        role: user.role
      };

      // Login exitoso
      return res.status(200).json({
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin,
          role: user.role
        }
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    return res.json({ ok: true });
  });
});

// Verificar sesión
app.get('/api/check-auth', (req, res) => {
  console.log('Route: /api/check-auth');
  if (req.session && req.session.user) {
    return res.json({ ok: true, user: req.session.user });
  } else {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
});

// ===== IMPORTAR TODAS LAS RUTAS DE LA API =====

// Aquí importaremos todas las rutas del backend original...
// Por ahora, solo login funciona. Podemos añadir más rutas gradualmente.

// ====== ADMIN: Usuarios (GET con paginación)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  console.log('Route: /api/admin/users called');
  return res.json({ ok: true, message: 'This should not be reached' });
});

// Ruta catch-all para SPA
app.get('*', (req, res) => {
  console.log(`Route: catch-all - ${req.path}`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AmericanBox ejecutándose en puerto ${PORT}`);
  console.log(`📱 Frontend: https://palevioletred-wasp-581512.hostingersite.com`);
  console.log(`🔗 API: https://palevioletred-wasp-581512.hostingersite.com/api`);
});

module.exports = app;