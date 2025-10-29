const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 8080;

// Inicializar Firebase Admin
let db, auth;
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    
    if (!serviceAccount.project_id) {
      console.warn('⚠️ Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized successfully');
      db = admin.firestore();
      auth = admin.auth();
    }
  }
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
}

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Servir archivos estáticos
const staticPath = process.env.STATIC_PATH || '/home/u582924658/domains/palevioletred-wasp-581512.hostingersite.com/public_html';
app.use(express.static(staticPath));

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Server is running',
    firebase: db ? 'connected' : 'not configured'
  });
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
    }

    if (!db) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    console.log('🔍 Login attempt for:', username);

    // Buscar usuario en Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).limit(1).get();

    if (snapshot.empty) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash || user.password);

    if (!validPassword) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    console.log('✅ Login successful:', username);

    const isAdmin = Boolean(user.is_admin) || user.role === 'admin';
    const redirect = isAdmin ? '/dashboard' : '/client';

    return res.status(200).json({
      ok: true,
      redirect,
      user: {
        id: user.id,
        username: user.username,
        isAdmin,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error in /api/login:', error);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// Me (verificar sesión)
app.get('/api/me', async (req, res) => {
  try {
    if (!auth) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No autorizado' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    const user = { id: userDoc.id, ...userDoc.data() };
    return res.json({ ok: true, user });
  } catch (error) {
    console.error('❌ Error in /api/me:', error);
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  res.json({ ok: true, message: 'Logout successful' });
});

// Middleware de admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!auth) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No autorizado' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    }

    const user = userDoc.data();
    if (user.role !== 'admin' && !user.is_admin) {
      return res.status(403).json({ ok: false, error: 'Acceso denegado' });
    }

    req.user = { id: userDoc.id, ...user };
    next();
  } catch (error) {
    console.error('❌ Error in requireAdmin:', error);
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
};

// Admin - Stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    const stats = {
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0
    };

    // Contar usuarios
    const usersSnapshot = await db.collection('users').count().get();
    stats.totalUsers = usersSnapshot.data().count;

    // Contar pedidos
    const ordersSnapshot = await db.collection('orders').count().get();
    stats.totalOrders = ordersSnapshot.data().count;

    res.json({ ok: true, stats });
  } catch (error) {
    console.error('❌ Error in /api/admin/stats:', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo estadísticas' });
  }
});

// Admin - Users  
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ ok: true, users });
  } catch (error) {
    console.error('❌ Error in /api/admin/users:', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo usuarios' });
  }
});

// Admin - Orders
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ ok: true, orders });
  } catch (error) {
    console.error('❌ Error in /api/admin/orders:', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo pedidos' });
  }
});

// Admin - Vouchers
app.get('/api/admin/vouchers', requireAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ ok: false, error: 'Firebase no configurado' });
    }

    const vouchersSnapshot = await db.collection('vouchers').get();
    const vouchers = vouchersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ ok: true, vouchers });
  } catch (error) {
    console.error('❌ Error in /api/admin/vouchers:', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo vouchers' });
  }
});

// Admin - Revenue Monthly
app.get('/api/admin/revenue/monthly', requireAdmin, async (req, res) => {
  try {
    // Implementa tu lógica aquí
    const revenue = [];
    res.json({ ok: true, revenue });
  } catch (error) {
    console.error('❌ Error in /api/admin/revenue/monthly:', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo revenue mensual' });
  }
});

// Admin - Top Products
app.get('/api/admin/products/top', requireAdmin, async (req, res) => {
  try {
    // Implementa tu lógica aquí
    const products = [];
    res.json({ ok: true, products });
  } catch (error) {
    console.error('❌ Error in /api/admin/products/top:', error);
    res.status(500).json({ ok: false, error: 'Error obteniendo productos top' });
  }
});

// Catch-all - servir SPA
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = process.env.INDEX_PATH || `${staticPath}/index.html`;
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ ok: false, error: 'Endpoint not found' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`🔥 Firebase: ${db ? 'Connected' : 'Not configured'}`);
});

module.exports = app;
