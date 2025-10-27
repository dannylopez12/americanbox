const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const xlsx = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// Pool MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'americanbox',
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
  acquireTimeout: 60000,
  timeout: 60000,
});

// Configurar CORS según el entorno
const corsOptions = {
  origin: isProduction 
    ? [process.env.CLIENT_URL, process.env.ALLOWED_ORIGINS].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' },
}));

// Configuración de multer para uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    // Aceptar archivos Excel
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx) o CSV'));
    }
  }
});

// Helpers
const ok   = (res, data = {}) => res.json({ ok: true, ...data });
const fail = (res, msg = 'Error', code = 400, extra = {}) => res.status(code).json({ ok: false, error: msg, ...extra });

// Helper para calcular precio automático
const calculateOrderPrice = async (conn, customerId, weightLbs) => {
  try {
    // Obtener configuración global
    const [config] = await conn.query('SELECT default_price_per_lb, auto_calculate_price FROM company_settings WHERE id = 1');
    const defaultPricePerLb = config.length > 0 ? config[0].default_price_per_lb : 3.50;
    const autoCalculate = config.length > 0 ? config[0].auto_calculate_price : 1;

    // Si no está habilitado el cálculo automático, retornar 0
    if (!autoCalculate) {
      return 0;
    }

    // Si no hay peso, retornar 0
    if (!weightLbs || weightLbs <= 0) {
      return 0;
    }

    let pricePerLb = defaultPricePerLb;

    // Obtener precio personalizado del cliente si existe
    if (customerId) {
      const [customer] = await conn.query('SELECT price_per_lb FROM customers WHERE id = ?', [customerId]);
      if (customer.length > 0 && customer[0].price_per_lb !== null) {
        pricePerLb = customer[0].price_per_lb;
      }
    }

    // Calcular total: peso * precio_por_libra
    const total = parseFloat(weightLbs) * parseFloat(pricePerLb);
    return Math.round(total * 100) / 100; // Redondear a 2 decimales

  } catch (error) {
    console.error('Error calculando precio:', error);
    return 0;
  }
};

// Helper para obtener customer_id de un user_id
const getCustomerIdFromUserId = async (conn, userId) => {
  try {
    const [user] = await conn.query('SELECT customer_id FROM users WHERE id = ?', [userId]);
    return user.length > 0 ? user[0].customer_id : null;
  } catch (error) {
    console.error('Error obteniendo customer_id:', error);
    return null;
  }
};

// Rutas
app.get('/api/health', (_req, res) => ok(res, { status: 'up' }));

// Registro
// helper para limpiar valores vacíos
const toNull = (v) => (v === '' || v === undefined || v === null ? null : v);

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const b = req.body || {};

    // Campos obligatorios
    for (const f of ['names', 'email', 'username', 'password']) {
      if (!b[f] || String(b[f]).trim() === '') {
        return fail(res, `Falta ${f}`, 422);
      }
    }

    const conn = await pool.getConnection();
    try {
      // Validaciones únicas previas
      const [emailExists] = await conn.query(
        'SELECT 1 FROM customers WHERE email=? LIMIT 1',
        [b.email]
      );
      if (emailExists.length) return fail(res, 'El correo electrónico ya está registrado', 409);

      const [userExists] = await conn.query(
        'SELECT 1 FROM users WHERE username=? LIMIT 1',
        [b.username]
      );
      if (userExists.length) return fail(res, 'El nombre de usuario ya está registrado', 409);

      if (b.dni) {
        const [dniExists] = await conn.query(
          'SELECT 1 FROM customers WHERE dni=? LIMIT 1',
          [b.dni]
        );
        if (dniExists.length) return fail(res, 'El número de documento ya está registrado', 409);
      }

      await conn.beginTransaction();

      // Insertar en customers
      const [insCust] = await conn.query(
        `INSERT INTO customers
         (names,email,dni,mobile,phone,address,birthdate,gender,identification_type,send_email_invoice,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,NOW())`,
        [
          String(b.names).trim(),
          String(b.email).trim(),
          toNull(b.dni),
          toNull(b.mobile),
          toNull(b.phone),
          toNull(b.address),
          toNull(b.birthdate),
          b.gender === 'female' ? 'female' : 'male',
          toNull(b.identification_type),
          b.send_email_invoice ? 1 : 0
        ]
      );
      const customerId = insCust.insertId;

      // Insertar en users
      const hash = await bcrypt.hash(b.password, 10);
      const [insUser] = await conn.query(
        `INSERT INTO users (customer_id,username,password_hash,is_admin,role,created_at)
         VALUES (?,?,?,?,?,NOW())`,
        [customerId, String(b.username).trim(), hash, 0, 'customer']
      );
      const uid = insUser.insertId;

      // Crear dirección automática si se proporcionó address en el registro
      if (b.address && String(b.address).trim()) {
        console.log('📍 Creando dirección automática para usuario:', uid);
        await conn.query(
          `INSERT INTO addresses (user_id, address, city) 
           VALUES (?, ?, ?)`,
          [
            uid,
            String(b.address).trim(),
            String(b.city || 'Ciudad por confirmar').trim()
          ]
        );
        console.log('✅ Dirección automática creada para usuario:', uid);
      } else {
        // Si no se proporcionó dirección, crear una dirección genérica como fallback
        console.log('📍 Creando dirección por defecto para usuario:', uid);
        await conn.query(
          `INSERT INTO addresses (user_id, address, city) 
           VALUES (?, ?, ?)`,
          [
            uid,
            'Dirección por confirmar - Favor actualizar en perfil',
            'Ciudad por confirmar'
          ]
        );
        console.log('✅ Dirección por defecto creada para usuario:', uid);
      }

      await conn.commit();

      // Sesión
      req.session.uid = uid;
      req.session.role = 'customer';
      req.session.customer_id = customerId;

      ok(res, {
        message: 'Registro OK',
        role: 'customer',
        customer_id: customerId,
        redirect: '/login/different', // redirige al login de cliente
      });
    } catch (e) {
      try { await conn.rollback(); } catch {}

      // Manejo de errores duplicados
      if (e.code === 'ER_DUP_ENTRY') {
        if (String(e.sqlMessage).includes('dni')) {
          return fail(res, 'El número de documento ya está registrado', 409);
        }
        if (String(e.sqlMessage).includes('email')) {
          return fail(res, 'El correo electrónico ya está registrado', 409);
        }
        if (String(e.sqlMessage).includes('username')) {
          return fail(res, 'El nombre de usuario ya está registrado', 409);
        }
        return fail(res, 'Dato duplicado', 409);
      }

      console.error('[REGISTER ERROR]', e);
      fail(res, 'Error registrando', 500, { detail: String(e.sqlMessage || e.message || e) });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('[REGISTER ERROR OUTER]', e);
    fail(res, 'Error registrando', 500, { detail: String(e.message || e) });
  }
});


// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, adminMode } = req.body || {};
    if (!username || !password) return fail(res, 'Credenciales requeridas', 422);

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT u.id, u.customer_id, u.username, u.password_hash, u.is_admin, u.role,
                c.names, c.email
         FROM users u
         LEFT JOIN customers c ON c.id = u.customer_id
         WHERE u.username = ? LIMIT 1`, [username]
      );
      const user = rows[0];
      if (!user) return fail(res, 'Usuario o contraseña inválidos', 401);

      const okPass = await bcrypt.compare(password, user.password_hash);
      if (!okPass) return fail(res, 'Usuario o contraseña inválidos', 401);

      // si intenta adminMode y no es admin -> 403
      if (adminMode && user.role !== 'admin') {
        return fail(res, 'No autorizado para admin', 403);
      }

      req.session.uid = user.id;
      req.session.role = user.role;
      req.session.customer_id = user.customer_id || null;
      req.session.username = user.username;

      const redirect = user.role === 'admin' ? '/dashboard' : '/client';
      ok(res, {
        redirect,
        user: {
          id: user.id,
          customer_id: user.customer_id || null,
          username: user.username,
          names: user.names || null,
          email: user.email || null,
          is_admin: !!user.is_admin,
          role: user.role,
        }
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error(e);
    fail(res, 'Error en login', 500, { detail: String(e.message || e) });
  }
});

// Estado de sesión
app.get('/api/auth/me', (req, res) => {
  if (!req.session.uid) return ok(res, { logged: false });
  ok(res, {
    logged: true,
    uid: req.session.uid,
    role: req.session.role,
    customer_id: req.session.customer_id || null,
    username: req.session.username || null,
  });
});
// === ALIAS: /api/auth/login -> /api/login ===
app.post('/api/auth/login', (req, res, next) => {
  req.url = '/api/login';
  next();
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => ok(res, { message: 'Logout OK' }));
});

// Servir archivos estáticos en producción
if (isProduction) {
  const path = require('path');
  
  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, './'), {
    maxAge: '1d', // Cache por 1 día
    etag: true,
    lastModified: true
  }));
  
  // Manejar rutas del frontend (SPA)
  app.get('*', (req, res) => {
    // No servir archivos de API como HTML
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ ok: false, error: 'Endpoint no encontrado' });
    }
    
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Error del servidor');
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AmericanBox API running on port ${PORT}`);
  console.log(`📊 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// --- helpers de auth ---
function requireAdmin(req, res, next) {
  if (!req.session?.uid || req.session?.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'No autorizado' });
  }
  next();
}

// --------- ADMIN: KPIs ---------
app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [[cCustomers]]  = await conn.query('SELECT COUNT(*) AS n FROM customers');
      const [[cProducts]]   = await conn.query('SELECT COUNT(*) AS n FROM products');
      const [[cAddresses]]  = await conn.query('SELECT COUNT(*) AS n FROM addresses');
      const [[cCategories]] = await conn.query('SELECT COUNT(*) AS n FROM categories');

      // Estadísticas por estado de paquetes (CORREGIDAS)
      const [orderStats] = await conn.query(`
        SELECT 
          COUNT(CASE WHEN status = 'Pre alerta' THEN 1 END) as prealerta,
          COUNT(CASE WHEN status = 'Captado en agencia' THEN 1 END) as captado,
          COUNT(CASE WHEN status IN ('Despachado', 'Despacho') THEN 1 END) as viajando,
          COUNT(CASE WHEN status = 'En aduana' THEN 1 END) as aduana,
          COUNT(CASE WHEN status = 'En espera de pago' THEN 1 END) as esperaPago,
          COUNT(CASE WHEN status = 'Pago aprobado' THEN 1 END) as pagoOk,
          COUNT(CASE WHEN status IN ('Entregado', 'En proceso de entrega') THEN 1 END) as entregado,
          COUNT(*) as totalOrders,
          COALESCE(SUM(total), 0) as totalAmount
        FROM orders
      `);

      return res.json({
        ok: true,
        customers:  cCustomers.n || 0,
        products:   cProducts.n || 0,
        addresses:  cAddresses.n || 0,
        categories: cCategories.n || 0,
        // Estadísticas de paquetes por estado
        orderStats: orderStats[0] || {
          prealerta: 0,
          captado: 0,
          viajando: 0,
          aduana: 0,
          esperaPago: 0,
          pagoOk: 0,
          entregado: 0,
          totalOrders: 0,
          totalAmount: 0
        }
      });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: 'Error leyendo KPIs' });
  }
});

// --------- ADMIN: Últimos pedidos + búsqueda ---------
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const { q = '', limit = 10, clientFilter = '' } = req.query;
    const like = `%${String(q).trim()}%`;
    const clientLike = `%${String(clientFilter).trim()}%`;

    const conn = await pool.getConnection();
    try {
      // Si hay filtro de cliente específico, usarlo; si no, usar búsqueda general
      let whereCondition, queryParams;
      
      if (clientFilter && clientFilter.trim()) {
        // Solo filtro por cliente
        whereCondition = 'COALESCE(c.names, u.username) LIKE ?';
        queryParams = [clientLike, Number(limit)];
      } else {
        // Búsqueda general en todos los campos
        whereCondition = `(? = '' OR 
                         o.guide LIKE ? OR 
                         COALESCE(c.names, u.username) LIKE ? OR 
                         a.address LIKE ? OR 
                         a.city LIKE ? OR 
                         o.status LIKE ?)`;
        queryParams = [String(q).trim(), like, like, like, like, like, Number(limit)];
      }

      const [rows] = await conn.query(
        `
        SELECT 
          o.id,
          o.guide,
          COALESCE(c.names, u.username) AS client,
          CONCAT(a.address, ' / ', a.city) AS address,
          DATE(o.created_at) AS date,
          o.total,
          o.status
        FROM orders o
        JOIN users u      ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.id = o.address_id
        WHERE ${whereCondition}
        ORDER BY o.created_at DESC
        LIMIT ?
        `,
        queryParams
      );

      res.json({ ok: true, orders: rows });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: 'Error leyendo pedidos' });
  }
});

// --------- ADMIN: Orders list with pagination ---------
app.get('/api/admin/orders/list', requireAdmin, async (req, res) => {
  try {
    const { 
      q = '', 
      page = 1, 
      limit = 10, 
      date_range = '', 
      status = '' 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const like = `%${String(q).trim()}%`;
    
    const conn = await pool.getConnection();
    try {
      // Construir condiciones WHERE
      let whereConditions = [];
      let queryParams = [];
      
      // Búsqueda general
      if (q && q.trim()) {
        whereConditions.push(`(o.guide LIKE ? OR 
                             COALESCE(c.names, u.username) LIKE ? OR 
                             o.status LIKE ?)`);
        queryParams.push(like, like, like);
      }
      
      // Filtro por estado
      if (status && status.trim()) {
        whereConditions.push('o.status = ?');
        queryParams.push(status);
      }
      
      // Filtro por rango de fechas
      if (date_range && date_range.trim()) {
        const dates = date_range.split(' to ');
        if (dates.length === 2) {
          whereConditions.push('DATE(o.created_at) BETWEEN ? AND ?');
          queryParams.push(dates[0], dates[1]);
        }
      }
      
      const whereClause = whereConditions.length > 0 ? 
        'WHERE ' + whereConditions.join(' AND ') : '';
      
      // Contar total de registros
      const [countResult] = await conn.query(`
        SELECT COUNT(*) as total
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.id = o.address_id
        LEFT JOIN providers p ON p.id = o.provider_id
        ${whereClause}
      `, queryParams);
      
      const total = countResult[0].total;
      const pages = Math.ceil(total / Number(limit));
      
      // Obtener registros paginados
      const [items] = await conn.query(`
        SELECT 
          o.id,
          o.guide,
          o.user_id,
          COALESCE(p.tracking_code, 'N/A') as provider_code,
          COALESCE(c.names, u.username) AS client,
          DATE_FORMAT(o.created_at, '%Y-%m-%d') AS register_date,
          'Sin comentarios' as comment,
          NULL as weight_lbs,
          o.status,
          o.total
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.id = o.address_id
        LEFT JOIN providers p ON p.id = o.provider_id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, Number(limit), offset]);
      
      res.json({ 
        ok: true, 
        items,
        page: Number(page),
        limit: Number(limit),
        total,
        pages
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo pedidos' });
  }
});

// --------- ADMIN: Bulk orders endpoint ---------
app.get('/api/admin/orders/bulk', requireAdmin, async (req, res) => {
  try {
    const { 
      q = '', 
      page = 1, 
      limit = 20, 
      date_range = '', 
      status = '', 
      client = '' 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const like = `%${String(q).trim()}%`;
    const clientLike = `%${String(client).trim()}%`;
    
    const conn = await pool.getConnection();
    try {
      let whereConditions = [];
      let queryParams = [];
      
      // Filtro general de búsqueda
      if (q && q.trim()) {
        whereConditions.push(`(
          o.guide LIKE ? OR 
          COALESCE(c.names, u.username) LIKE ? OR 
          o.status LIKE ?
        )`);
        queryParams.push(like, like, like);
      }
      
      // Filtro específico por cliente (reunión)
      if (client && client.trim()) {
        whereConditions.push('COALESCE(c.names, u.username) LIKE ?');
        queryParams.push(clientLike);
      }
      
      // Filtro por estado
      if (status && status.trim()) {
        whereConditions.push('o.status = ?');
        queryParams.push(status.trim());
      }
      
      // Filtro por fecha (si se implementa)
      if (date_range && date_range.trim()) {
        // Implementar según necesidades
        // whereConditions.push('DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?');
      }
      
      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Consulta para contar total
      const [countResult] = await conn.query(
        `
        SELECT COUNT(*) as total
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.id = o.address_id
        ${whereClause}
        `,
        queryParams
      );
      
      const total = countResult[0]?.total || 0;
      const pages = Math.ceil(total / Number(limit));
      
      // Consulta principal
      const [rows] = await conn.query(
        `
        SELECT 
          o.id,
          o.guide,
          COALESCE(c.names, u.username) AS client,
          CONCAT(a.address, ' / ', a.city) AS address,
          DATE(o.created_at) AS date,
          o.total,
          o.status
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.id = o.address_id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [...queryParams, Number(limit), offset]
      );
      
      res.json({ 
        ok: true, 
        items: rows,
        page: Number(page),
        limit: Number(limit),
        total,
        pages
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error leyendo pedidos bulk' });
  }
});

// --------- ADMIN: Order statuses catalog ---------
app.get('/api/admin/orders/statuses', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT DISTINCT status as value, status as label 
        FROM orders 
        WHERE status IS NOT NULL AND status != '' 
        ORDER BY status
      `);
      
      res.json({ ok: true, items: rows });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo estados' });
  }
});

// --------- ADMIN: Update order status in bulk ---------
app.put('/api/admin/orders/bulk', requireAdmin, async (req, res) => {
  try {
    const { orderIds, newStatus } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ ok: false, error: 'orderIds requerido' });
    }
    
    if (!newStatus || !newStatus.trim()) {
      return res.status(400).json({ ok: false, error: 'newStatus requerido' });
    }
    
    const conn = await pool.getConnection();
    try {
      // Preparar placeholders para la consulta IN
      const placeholders = orderIds.map(() => '?').join(',');
      
      const [result] = await conn.query(
        `UPDATE orders SET status = ? WHERE id IN (${placeholders})`,
        [newStatus.trim(), ...orderIds.map(Number)]
      );
      
      res.json({ 
        ok: true, 
        message: `${result.affectedRows} pedidos actualizados`,
        affectedRows: result.affectedRows
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error actualizando pedidos' });
  }
});

// --------- TEST: Debug endpoint ---------
app.post('/api/admin/orders-debug', requireAdmin, async (req, res) => {
  console.log('🔍 POST /api/admin/orders-debug - Body recibido:', req.body);
  
  try {
    const { guide, user_id, total } = req.body;
    console.log('🔍 Datos extraídos:', { guide, user_id, total });
    
    // Test simple database connection
    console.log('🔍 Probando conexión a BD...');
    const conn = await pool.getConnection();
    console.log('🔍 Conexión obtenida');
    
    try {
      const [testQuery] = await conn.query('SELECT 1 as test');
      console.log('🔍 Query de prueba exitosa:', testQuery);
      
      // Test if user exists
      const [userCheck] = await conn.query('SELECT id FROM users WHERE id = ?', [user_id]);
      console.log('🔍 Usuario encontrado:', userCheck);
      
      res.json({ ok: true, message: 'Debug exitoso', checks: { testQuery, userCheck } });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('🔍 Error en debug:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --------- ADMIN: Create new order ---------
app.post('/api/admin/orders', requireAdmin, async (req, res) => {
  console.log('🔍 POST /api/admin/orders - Body recibido:', req.body);
  try {
    const { 
      guide, 
      user_id, 
      address_id, 
      status, 
      total,
      weight_lbs,
      provider_id,
      tracking_code,
      location
    } = req.body;
    
    console.log('🔍 Datos extraídos:', { guide, user_id, address_id, status, total, weight_lbs, provider_id, tracking_code, location });
    
    // Validaciones básicas
    if (!guide || !guide.trim()) {
      console.log('❌ Error: Número de guía requerido');
      return res.status(400).json({ ok: false, error: 'Número de guía requerido' });
    }
    
    if (!user_id) {
      console.log('❌ Error: ID de usuario requerido');
      return res.status(400).json({ ok: false, error: 'ID de usuario requerido' });
    }
    
    console.log('🔍 Iniciando conexión a BD...');
    const conn = await pool.getConnection();
    try {
      // Verificar que la guía no exista
      console.log('🔍 Verificando si la guía existe:', guide.trim());
      const [existing] = await conn.query('SELECT id FROM orders WHERE guide = ?', [guide.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({ ok: false, error: 'Ya existe un pedido con ese número de guía' });
      }
      
      // Verificar que el usuario existe
      const [userCheck] = await conn.query('SELECT id FROM users WHERE id = ?', [user_id]);
      if (userCheck.length === 0) {
        return res.status(400).json({ ok: false, error: 'Usuario no encontrado' });
      }
      
      // Si address_id es proporcionado, verificar que existe y pertenece al usuario
      if (address_id) {
        const [addressCheck] = await conn.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [address_id, user_id]);
        if (addressCheck.length === 0) {
          return res.status(400).json({ ok: false, error: 'Dirección no válida para este usuario' });
        }
      } else {
        // Si no se proporciona address_id, usar la primera dirección del usuario
        const [addresses] = await conn.query('SELECT id FROM addresses WHERE user_id = ? LIMIT 1', [user_id]);
        if (addresses.length === 0) {
          return res.status(400).json({ ok: false, error: 'El usuario no tiene direcciones registradas' });
        }
        address_id = addresses[0].id;
      }

      // Calcular precio automáticamente si no se proporciona total
      let finalTotal = total;
      if (!total || total === 0) {
        const customerId = await getCustomerIdFromUserId(conn, user_id);
        finalTotal = await calculateOrderPrice(conn, customerId, weight_lbs);
        console.log(`💰 Precio calculado automáticamente: $${finalTotal} (Peso: ${weight_lbs} lbs)`);
      }

      // Obtener ubicación por defecto si no se proporciona
      let finalLocation = location;
      if (!finalLocation) {
        const [defaultLocation] = await conn.query('SELECT default_location FROM company_settings LIMIT 1');
        finalLocation = defaultLocation[0]?.default_location || 'miami';
        console.log(`📍 Ubicación por defecto asignada: ${finalLocation}`);
      } else {
        console.log(`📍 Ubicación especificada: ${finalLocation}`);
      }
      
      // Crear el pedido
      const [result] = await conn.query(`
        INSERT INTO orders (
          guide, 
          user_id, 
          address_id, 
          status, 
          total,
          weight_lbs,
          location,
          provider_id,
          tracking_code,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        guide.trim(),
        user_id,
        address_id,
        status || 'Pre alerta',
        finalTotal || 0,
        weight_lbs || null,
        finalLocation,
        provider_id || null,
        tracking_code || null
      ]);
      
      res.json({ 
        ok: true, 
        message: 'Pedido creado exitosamente',
        orderId: result.insertId,
        calculatedPrice: finalTotal !== total ? finalTotal : null
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error creando pedido' });
  }
});

// --------- ADMIN: Bulk upload orders ---------
app.post('/api/admin/orders/bulk-upload', requireAdmin, upload.single('file'), async (req, res) => {
  console.log('🔍 POST /api/admin/orders/bulk-upload - Iniciando carga masiva');
  
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No se ha enviado ningún archivo' });
    }

    console.log('🔍 Archivo recibido:', req.file.originalname, 'Tamaño:', req.file.size);

    // Leer el archivo Excel
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('🔍 Datos extraídos del Excel:', data.length, 'filas');

    if (data.length === 0) {
      return res.status(400).json({ ok: false, error: 'El archivo está vacío o no tiene el formato correcto' });
    }

    const conn = await pool.getConnection();
    const results = {
      total: data.length,
      created: 0,
      errors: []
    };

    try {
      // Función para generar número de guía automático
      const generateGuideNumber = async () => {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const guide = `AB${timestamp}${random}`;
        
        // Verificar que no exista
        const [existing] = await conn.query('SELECT id FROM orders WHERE guide = ?', [guide]);
        if (existing.length > 0) {
          return generateGuideNumber(); // Recursivo si existe
        }
        return guide;
      };

      // Procesar cada fila
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // +2 porque la fila 1 son headers y empezamos en 0
        
        try {
          // Validar campos requeridos
          // Esperamos columnas: codigo_proveedor, cliente, comentario, peso_lbs
          const codigoProveedor = row['codigo_proveedor'] || row['Codigo Proveedor'] || row['proveedor'];
          const cliente = row['cliente'] || row['Cliente'];
          const comentario = row['comentario'] || row['Comentario'] || '';
          const pesoLbs = parseFloat(row['peso_lbs'] || row['Peso Lbs'] || row['peso'] || 0);

          if (!cliente) {
            results.errors.push(`Fila ${rowNum}: Cliente es requerido`);
            continue;
          }

          // Buscar o crear usuario por nombre
          let userId = null;
          if (cliente) {
            // Buscar usuario existente por nombre
            const [userSearch] = await conn.query(
              'SELECT id FROM users WHERE LOWER(name) LIKE LOWER(?)', 
              [`%${cliente.trim()}%`]
            );
            
            if (userSearch.length > 0) {
              userId = userSearch[0].id;
            } else {
              // Crear usuario temporal (se puede completar después)
              const [userResult] = await conn.query(
                'INSERT INTO users (name, email, created_at) VALUES (?, ?, NOW())',
                [cliente.trim(), `${cliente.trim().replace(/\s+/g, '').toLowerCase()}@temp.com`]
              );
              userId = userResult.insertId;
              
              // Crear dirección por defecto
              await conn.query(
                'INSERT INTO addresses (user_id, address, city, state, zip, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [userId, 'Dirección pendiente', 'Miami', 'FL', '33101']
              );
            }
          }

          // Buscar proveedor por código
          let providerId = null;
          if (codigoProveedor) {
            const [providerSearch] = await conn.query(
              'SELECT id FROM providers WHERE tracking_code = ? OR LOWER(name) LIKE LOWER(?)',
              [codigoProveedor.trim(), `%${codigoProveedor.trim()}%`]
            );
            if (providerSearch.length > 0) {
              providerId = providerSearch[0].id;
            }
          }

          // Generar número de guía
          const guide = await generateGuideNumber();

          // Buscar address_id del usuario
          const [addresses] = await conn.query('SELECT id FROM addresses WHERE user_id = ? LIMIT 1', [userId]);
          const addressId = addresses.length > 0 ? addresses[0].id : null;

          if (!addressId) {
            results.errors.push(`Fila ${rowNum}: Usuario ${cliente} no tiene direcciones`);
            continue;
          }

          // Crear el pedido
          await conn.query(`
            INSERT INTO orders (
              guide, 
              user_id, 
              address_id, 
              status, 
              comment,
              weight_lbs,
              provider_id,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `, [
            guide,
            userId,
            addressId,
            'Pre alerta', // Estado por defecto
            comentario || null,
            pesoLbs || 0,
            providerId
          ]);

          results.created++;
          
        } catch (rowError) {
          console.error(`Error en fila ${rowNum}:`, rowError);
          results.errors.push(`Fila ${rowNum}: ${rowError.message}`);
        }
      }

      res.json({
        ok: true,
        message: `Carga masiva completada. ${results.created}/${results.total} pedidos creados`,
        results
      });

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('Error en bulk upload:', error);
    res.status(500).json({ ok: false, error: 'Error procesando el archivo: ' + error.message });
  }
});

// --------- ADMIN: Download bulk upload template ---------
app.get('/api/admin/orders/bulk-upload-template', requireAdmin, (req, res) => {
  const path = require('path');
  const templatePath = path.join(__dirname, 'templates', 'template_carga_masiva.xlsx');
  
  // Verificar si el archivo existe
  const fs = require('fs');
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({ ok: false, error: 'Template no encontrado' });
  }
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="template_carga_masiva.xlsx"');
  res.sendFile(templatePath);
});

// --------- ADMIN: Update order ---------
app.put('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  console.log('🔍 PUT /api/admin/orders/:id - Iniciando actualización');
  console.log('🔍 ID recibido:', req.params.id);
  console.log('🔍 Body recibido:', req.body);
  try {
    const { id } = req.params;
    const { 
      guide, 
      user_id, 
      address_id, 
      status, 
      total,
      weight_lbs,
      provider_id,
      tracking_code,
      location
    } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, error: 'ID de orden inválido' });
    }

    // Validaciones básicas
    if (!guide || !guide.trim()) {
      return res.status(400).json({ ok: false, error: 'Número de guía requerido' });
    }

    if (!user_id) {
      return res.status(400).json({ ok: false, error: 'ID de usuario requerido' });
    }

    const conn = await pool.getConnection();
    try {
      // Verificar que la orden existe
      const [orderCheck] = await conn.query('SELECT id FROM orders WHERE id = ?', [Number(id)]);
      if (orderCheck.length === 0) {
        return res.status(404).json({ ok: false, error: 'Orden no encontrada' });
      }

      // Verificar que la guía no exista en otra orden
      const [existingGuide] = await conn.query('SELECT id FROM orders WHERE guide = ? AND id != ?', [guide.trim(), Number(id)]);
      if (existingGuide.length > 0) {
        return res.status(400).json({ ok: false, error: 'Ya existe otra orden con ese número de guía' });
      }

      // Verificar que el usuario existe
      const [userCheck] = await conn.query('SELECT id FROM users WHERE id = ?', [user_id]);
      if (userCheck.length === 0) {
        return res.status(400).json({ ok: false, error: 'Usuario no encontrado' });
      }

      // Si address_id es proporcionado, verificar que existe y pertenece al usuario
      if (address_id) {
        const [addressCheck] = await conn.query('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [address_id, user_id]);
        if (addressCheck.length === 0) {
          return res.status(400).json({ ok: false, error: 'Dirección no válida para este usuario' });
        }
      } else {
        // Si no se proporciona address_id, usar la primera dirección del usuario
        const [addresses] = await conn.query('SELECT id FROM addresses WHERE user_id = ? LIMIT 1', [user_id]);
        if (addresses.length === 0) {
          return res.status(400).json({ ok: false, error: 'El usuario no tiene direcciones registradas' });
        }
        address_id = addresses[0].id;
      }

      // Calcular precio automáticamente si no se proporciona total o si cambió el peso
      let finalTotal = total;
      if ((!total || total === 0) && weight_lbs) {
        const customerId = await getCustomerIdFromUserId(conn, user_id);
        finalTotal = await calculateOrderPrice(conn, customerId, weight_lbs);
        console.log(`💰 Precio recalculado automáticamente: $${finalTotal} (Peso: ${weight_lbs} lbs)`);
      }

      // Actualizar la orden
      await conn.query(`
        UPDATE orders SET
          guide = ?,
          user_id = ?,
          address_id = ?,
          status = ?,
          total = ?,
          weight_lbs = ?,
          location = ?,
          provider_id = ?,
          tracking_code = ?
        WHERE id = ?
      `, [
        guide.trim(),
        user_id,
        address_id,
        status || 'Pre alerta',
        finalTotal || 0,
        weight_lbs || null,
        location || null,
        provider_id || null,
        tracking_code || null,
        Number(id)
      ]);

      console.log('🔍 PUT - Orden actualizada exitosamente');
      res.json({ 
        ok: true, 
        message: 'Orden actualizada exitosamente',
        calculatedPrice: finalTotal !== total ? finalTotal : null
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error('❌ PUT Error:', e);
    res.status(500).json({ ok: false, error: 'Error actualizando orden' });
  }
});

// --------- ADMIN: Delete order ---------
app.delete('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, error: 'ID de orden inválido' });
    }

    const conn = await pool.getConnection();
    try {
      // Verificar que la orden existe
      const [orderCheck] = await conn.query('SELECT id FROM orders WHERE id = ?', [Number(id)]);
      if (orderCheck.length === 0) {
        return res.status(404).json({ ok: false, error: 'Orden no encontrada' });
      }

      // Eliminar la orden
      await conn.query('DELETE FROM orders WHERE id = ?', [Number(id)]);

      res.json({ 
        ok: true, 
        message: 'Orden eliminada exitosamente'
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error eliminando orden' });
  }
});

// --------- ADMIN: Recaudación mensual (barra) ---------
app.get('/api/admin/revenue/monthly', requireAdmin, async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') AS ym,
          SUM(total) AS total
        FROM orders
        GROUP BY ym
        ORDER BY ym
        `
      );
      // Normalizamos a {labels: [...], values: [...]}
      const labels = rows.map(r => r.ym);
      const values = rows.map(r => Number(r.total || 0));
      res.json({ ok: true, labels, values });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: 'Error leyendo recaudación' });
  }
});

// --------- ADMIN: Top productos enviados (pie) ---------
app.get('/api/admin/products/top', requireAdmin, async (_req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `
        SELECT p.name AS product, SUM(oi.quantity) AS qty
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        GROUP BY oi.product_id
        ORDER BY qty DESC
        LIMIT 6
        `
      );
      const labels = rows.map(r => r.product);
      const values = rows.map(r => Number(r.qty || 0));
      res.json({ ok: true, labels, values });
    } finally { conn.release(); }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error: 'Error leyendo top productos' });
  }
});
// ===== Helpers de BD
async function q(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

// ====== ADMIN: Categorías (CRUD)
app.get('/api/admin/categories', async (_req,res)=>{
  try { ok(res,{ ok:true, items: await q('SELECT * FROM categories ORDER BY id DESC') }); }
  catch(e){ console.error(e); fail(res,'Error list categories',500); }
});
app.post('/api/admin/categories', async (req,res)=>{
  try {
    const { name } = req.body||{};
    if(!name) return fail(res,'Nombre requerido',422);
    const r = await q('INSERT INTO categories (name) VALUES (?)',[name]);
    ok(res,{ ok:true, id:r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create category',500); }
});
app.put('/api/admin/categories/:id', async (req,res)=>{
  try {
    const id = +req.params.id; const { name } = req.body||{};
    if(!name) return fail(res,'Nombre requerido',422);
    await q('UPDATE categories SET name=? WHERE id=?',[name,id]);
    ok(res,{ ok:true });
  } catch(e){ console.error(e); fail(res,'Error update category',500); }
});
app.delete('/api/admin/categories/:id', async (req,res)=>{
  try { await q('DELETE FROM categories WHERE id=?',[+req.params.id]); ok(res,{ ok:true }); }
  catch(e){ console.error(e); fail(res,'Error delete category',500); }
});

// ====== ADMIN: Productos (CRUD simple)
app.get('/api/admin/products', async (_req,res)=>{
  try {
    const items = await q(`
      SELECT p.id, p.name, p.code, p.price, p.category_id, c.name AS category
      FROM products p LEFT JOIN categories c ON c.id=p.category_id
      ORDER BY p.id DESC`);
    ok(res,{ ok:true, items });
  } catch(e){ console.error(e); fail(res,'Error list products',500); }
});
app.post('/api/admin/products', async (req,res)=>{
  try {
    const { name, code, price, category_id } = req.body||{};
    if(!name || !code || price==null) return fail(res,'Campos requeridos',422);
    const r = await q('INSERT INTO products (name, code, price, category_id) VALUES (?,?,?,?)',
      [name, code, Number(price), category_id || null]);
    ok(res,{ ok:true, id:r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create product',500); }
});
app.put('/api/admin/products/:id', async (req,res)=>{
  try {
    const id=+req.params.id; const { name, code, price, category_id } = req.body||{};
    await q('UPDATE products SET name=?, code=?, price=?, category_id=? WHERE id=?',
      [name, code, Number(price), category_id||null, id]);
    ok(res,{ ok:true });
  } catch(e){ console.error(e); fail(res,'Error update product',500); }
});
app.delete('/api/admin/products/:id', async (req,res)=>{
  try { await q('DELETE FROM products WHERE id=?',[+req.params.id]); ok(res,{ ok:true }); }
  catch(e){ console.error(e); fail(res,'Error delete product',500); }
});

// ====== ADMIN: Proveedores (CRUD)
app.get('/api/admin/providers', async (_req,res)=>{
  try { ok(res,{ ok:true, items: await q('SELECT * FROM providers ORDER BY id DESC') }); }
  catch(e){ console.error(e); fail(res,'Error list providers',500); }
});
app.post('/api/admin/providers', async (req,res)=>{
  try {
    const { tracking_code, name, address } = req.body||{};
    if(!tracking_code || !name) return fail(res,'Campos requeridos',422);
    const r = await q('INSERT INTO providers (tracking_code,name,address) VALUES (?,?,?)',
      [tracking_code, name, address||null]);
    ok(res,{ ok:true, id:r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create provider',500); }
});
app.put('/api/admin/providers/:id', async (req,res)=>{
  try {
    const { tracking_code, name, address } = req.body||{};
    await q('UPDATE providers SET tracking_code=?, name=?, address=? WHERE id=?',
      [tracking_code, name, address||null, +req.params.id]);
    ok(res,{ ok:true });
  } catch(e){ console.error(e); fail(res,'Error update provider',500); }
});
app.delete('/api/admin/providers/:id', async (req,res)=>{
  try { await q('DELETE FROM providers WHERE id=?',[+req.params.id]); ok(res,{ ok:true }); }
  catch(e){ console.error(e); fail(res,'Error delete provider',500); }
});

// ====== ADMIN: Compañía (GET/PUT)
app.get('/api/admin/company', async (_req,res)=>{
  try {
    const rows = await q('SELECT * FROM company_settings WHERE id=1');
    ok(res, { ok:true, item: rows[0] || null });
  } catch(e){ console.error(e); fail(res,'Error get company',500); }
});
app.put('/api/admin/company', async (req,res)=>{
  try {
    const fields = [
      'ruc','razon_social','nombre_comercial','casillero_direccion','codigo_postal',
      'codigo_pais','siglas_courier','dir_matriz','dir_emisor','punto_emision','telefono_cel',
      'telefono_conv','web_url','email','mision','vision','iva_percent','regimen_tributario'
    ];
    const set = fields.map(f=>`${f}=?`).join(',');
    const vals = fields.map(f => (req.body||{})[f] ?? null);
    await q(`UPDATE company_settings SET ${set} WHERE id=1`, vals);
    ok(res,{ ok:true });
  } catch(e){ console.error(e); fail(res,'Error update company',500); }
});
// ====== ADMIN: Usuarios (GET con paginación)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;
    
    const conn = await pool.getConnection();
    try {
      // Get total count
      const [[{ total }]] = await conn.query('SELECT COUNT(*) total FROM users u');
      
      // Get users with customer data
      const [rows] = await conn.query(`
        SELECT 
          u.id,
          u.username,
          u.is_admin,
          u.role,
          u.created_at,
          u.updated_at,
          c.names as full_name,
          c.email,
          c.mobile as phone,
          c.address,
          c.dni,
          c.identification_type,
          c.price_per_lb
        FROM users u
        LEFT JOIN customers c ON u.customer_id = c.id
        ORDER BY u.id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      ok(res, {
        ok: true,
        items: rows.map(user => ({
          id: user.id,
          username: user.username,
          names: user.full_name || user.username,
          email: user.email,
          phone: user.phone,
          address: user.address,
          dni: user.dni,
          identification_type: user.identification_type,
          price_per_lb: user.price_per_lb,
          role: user.role,
          is_admin: user.is_admin,
          active: true, // Por defecto todos están activos
          created_at: user.created_at,
          updated_at: user.updated_at
        })),
        total: total,
        page: page,
        limit: limit,
        pages: Math.ceil(total / limit)
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Error getting users:', e);
    fail(res, 'Error getting users', 500);
  }
});

// --------- ADMIN: Login as user (impersonation) ---------
app.post('/api/admin/users/:id/login-as', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const conn = await pool.getConnection();
    try {
      // Get user data
      const [userRows] = await conn.query(`
        SELECT 
          u.id,
          u.username,
          u.role,
          u.is_admin,
          u.customer_id,
          c.names,
          c.email
        FROM users u
        LEFT JOIN customers c ON u.customer_id = c.id
        WHERE u.id = ?
      `, [userId]);

      if (userRows.length === 0) {
        return fail(res, 'Usuario no encontrado', 404);
      }

      const user = userRows[0];
      
      // Create new session for this user
      req.session.uid = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.isAdmin = user.is_admin;
      req.session.customer_id = user.customer_id;

      // Determine redirect based on user role
      let redirect = '/dashboard';
      if (user.role === 'admin') {
        redirect = '/dashboard';
      } else if (user.role === 'customer') {
        redirect = '/client';
      }

      ok(res, {
        ok: true,
        message: `Sesión iniciada como ${user.names || user.username}`,
        redirect: redirect,
        user: {
          id: user.id,
          username: user.username,
          names: user.names,
          email: user.email,
          role: user.role,
          is_admin: user.is_admin
        }
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Error in login-as:', e);
    fail(res, 'Error iniciando sesión como usuario', 500);
  }
});

// ====== ADMIN: Perfil de cuenta (GET/PUT)
app.get('/api/admin/account/profile', requireAdmin, async (req, res) => {
  try {
    const userId = req.session.uid;
    if (!userId) {
      return fail(res, 'No authenticated user', 401);
    }

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT 
          u.id,
          u.username,
          u.is_admin,
          u.role,
          u.created_at,
          u.updated_at,
          c.names as full_name,
          c.email,
          c.mobile as phone,
          c.address,
          c.dni,
          c.identification_type
        FROM users u
        LEFT JOIN customers c ON u.customer_id = c.id
        WHERE u.id = ?
      `, [userId]);

      if (rows.length === 0) {
        return fail(res, 'User not found', 404);
      }

      ok(res, {
        ok: true,
        profile: rows[0]
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Error getting profile:', e);
    fail(res, 'Error getting profile', 500);
  }
});

app.put('/api/admin/account/profile', requireAdmin, async (req, res) => {
  try {
    const userId = req.session.uid;
    if (!userId) {
      return fail(res, 'No authenticated user', 401);
    }

    const { username, full_name, email, phone, address } = req.body || {};

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Update username in users table
      if (username) {
        await conn.query('UPDATE users SET username = ? WHERE id = ?', [username.trim(), userId]);
      }

      // Update customer data if exists
      const [userRows] = await conn.query('SELECT customer_id FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0 && userRows[0].customer_id) {
        const customerId = userRows[0].customer_id;
        await conn.query(`
          UPDATE customers SET 
            names = ?, 
            email = ?, 
            mobile = ?, 
            address = ?
          WHERE id = ?
        `, [
          full_name?.trim() || null,
          email?.trim() || null,
          phone?.trim() || null,
          address?.trim() || null,
          customerId
        ]);
      }

      await conn.commit();
      ok(res, { ok: true, message: 'Profile updated successfully' });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('Error updating profile:', e);
    fail(res, 'Error updating profile', 500);
  }
});

// ====== ADMIN: Clientes (CRUD)
function sanitizeCustomer(b = {}) {
  const toNull = (v) => (v === '' || v === undefined || v === null ? null : v);
  return {
    names: String(b.names ?? '').trim(),
    email: toNull(b.email),
    image_url: toNull(b.image_url),                  // opcional si guardas ruta/URL
    dni: toNull(b.dni),
    mobile: toNull(b.mobile),
    phone: toNull(b.phone),
    address: toNull(b.address),
    birthdate: toNull(b.birthdate),                  // yyyy-mm-dd
    gender: (b.gender === 'female' ? 'female' : (b.gender === 'male' ? 'male' : null)),
    identification_type: toNull(b.identification_type), // p.ej. 'CEDULA', 'RUC', 'VENTA A CONSUMIDOR FINAL'
    send_email_invoice: b.send_email_invoice ? 1 : 0,
  };
}

// Listado con búsqueda + paginación
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;
    const like = `%${q}%`;

    const where = q
      ? `WHERE (c.names LIKE ? OR c.email LIKE ? OR c.dni LIKE ? OR IFNULL(c.mobile,'') LIKE ? OR IFNULL(c.phone,'') LIKE ?)`
      : ``;

    const conn = await pool.getConnection();
    try {
      const [[{ total }]] = await conn.query(
        `SELECT COUNT(*) total FROM customers c ${where}`, q ? [like, like, like, like, like] : []
      );

      const [rows] = await conn.query(
        `
        SELECT c.id, c.names, c.email, c.image_url, c.dni, c.mobile, c.phone,
               c.address, c.birthdate, c.gender, c.identification_type, c.send_email_invoice,
               DATE_FORMAT(c.created_at,'%Y-%m-%d %H:%i:%s') as created_at
        FROM customers c
        ${where}
        ORDER BY c.id ASC
        LIMIT ? OFFSET ?`,
        q ? [like, like, like, like, like, limit, offset] : [limit, offset]
      );

      ok(res, { items: rows, page, limit, total, pages: Math.ceil(total/limit) });
    } finally { conn.release(); }
  } catch (e) { console.error(e); fail(res,'Error list customers',500); }
});

// Obtener 1 cliente
app.get('/api/admin/customers/:id', requireAdmin, async (req,res)=>{
  try {
    const id = +req.params.id;
    const rows = await q('SELECT * FROM customers WHERE id=?',[id]);
    if (!rows.length) return fail(res,'No encontrado',404);
    ok(res,{ item: rows[0] });
  } catch(e){ console.error(e); fail(res,'Error get customer',500); }
});

// Crear
app.post('/api/admin/customers', requireAdmin, async (req,res)=>{
  try {
    const c = sanitizeCustomer(req.body);
    if (!c.names) return fail(res,'Nombres requeridos',422);

    const r = await q(`
      INSERT INTO customers
      (names,email,image_url,dni,mobile,phone,address,birthdate,gender,identification_type,send_email_invoice,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW())
    `,[c.names,c.email,c.image_url,c.dni,c.mobile,c.phone,c.address,c.birthdate,c.gender,c.identification_type,c.send_email_invoice]);

    ok(res,{ id: r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create customer',500); }
});

// Actualizar
app.put('/api/admin/customers/:id', requireAdmin, async (req,res)=>{
  try {
    const id = +req.params.id;
    const c = sanitizeCustomer(req.body);
    await q(`
      UPDATE customers SET
        names=?, email=?, image_url=?, dni=?, mobile=?, phone=?, address=?,
        birthdate=?, gender=?, identification_type=?, send_email_invoice=?
      WHERE id=?`,
      [c.names,c.email,c.image_url,c.dni,c.mobile,c.phone,c.address,c.birthdate,c.gender,c.identification_type,c.send_email_invoice,id]
    );
    ok(res,{ ok:true });
  } catch(e){ console.error(e); fail(res,'Error update customer',500); }
});

// Eliminar
app.delete('/api/admin/customers/:id', requireAdmin, async (req,res)=>{
  try {
    await q('DELETE FROM customers WHERE id=?',[+req.params.id]);
    ok(res,{ ok:true });
  } catch(e){ console.error(e); fail(res,'Error delete customer',500); }
});
// ====== ADMIN: Comprobantes (CRUD)
// ====== ADMIN: Comprobantes (LIST)
app.get('/api/admin/vouchers', requireAdmin, async (req, res) => {
  try {
    const qtxt  = String(req.query.q ?? '').trim();
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;

    let where = '';
    let paramsCount = [];
    let paramsRows  = [];

    if (qtxt) {
      const like = `%${qtxt}%`;
      where = `WHERE (v.code LIKE ? OR v.name LIKE ? OR v.estab_code LIKE ? OR v.point_code LIKE ?)`;
      paramsCount = [like, like, like, like];
      paramsRows  = [like, like, like, like, limit, offset];
    } else {
      // sin filtro: evita placeholders innecesarios
      paramsCount = [];
      paramsRows  = [limit, offset];
    }

    const countResult = await q(`SELECT COUNT(*) as total FROM vouchers v ${where}`, paramsCount);
    const total = countResult[0]?.total || 0;

    const rows = await q(
      `
      SELECT v.id, v.code, v.name, v.estab_code, v.point_code, v.seq,
             DATE_FORMAT(v.created_at,'%Y-%m-%d %H:%i:%s') AS created_at
      FROM vouchers v
      ${where}
      ORDER BY v.id ASC
      LIMIT ? OFFSET ?
      `,
      paramsRows
    );

    res.json({ ok: true, items: rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) {
    console.error('[VOUCHERS LIST ERROR]', e);
    res.status(500).json({ ok:false, error:'Error list vouchers', detail:String(e.sqlMessage || e.message || e) });
  }
});


app.post('/api/admin/vouchers', requireAdmin, async (req, res) => {
  try {
    const { code, name, estab_code='001', point_code='001', seq=0 } = req.body || {};
    if (!code || !name) {
      console.warn('[VOUCHER POST] Faltan campos', req.body);
      return res.status(422).json({ ok:false, error:'Campos requeridos: code y name' });
    }
    const padded = String(code).padStart(2,'0');
    const r = await q(
      'INSERT INTO vouchers (code,name,estab_code,point_code,seq) VALUES (?,?,?,?,?)',
      [padded, String(name).trim(), estab_code, point_code, Number(seq)||0]
    );
    return res.json({ ok:true, id: r.insertId });
  } catch (e) {
    console.error('[VOUCHER POST ERROR]', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok:false, error:'El código ya existe' });
    }
    return res.status(500).json({ ok:false, error:'Error create voucher', detail: String(e.sqlMessage || e.message || e) });
  }
});


app.put('/api/admin/vouchers/:id', requireAdmin, async (req, res) => {
  try {
    const id = +req.params.id;
    const { code, name, estab_code='001', point_code='001', seq=0 } = req.body || {};
    await q(
      'UPDATE vouchers SET code=?, name=?, estab_code=?, point_code=?, seq=? WHERE id=?',
      [String(code).padStart(2,'0'), String(name).trim(), estab_code, point_code, Number(seq)||0, id]
    );
    res.json({ ok:true });
  } catch (e) { console.error(e); res.status(500).json({ ok:false, error:'Error update voucher' }); }
});

app.delete('/api/admin/vouchers/:id', requireAdmin, async (req, res) => {
  try {
    await q('DELETE FROM vouchers WHERE id=?',[+req.params.id]);
    res.json({ ok:true });
  } catch (e) { console.error(e); res.status(500).json({ ok:false, error:'Error delete voucher' }); }
});

// ====== ADMIN: Invoices (list + delete)
app.get('/api/admin/invoices', requireAdmin, async (req, res) => {
  try {
    const qtxt  = String(req.query.q ?? '').trim();
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;

    let where = '';
    let paramsCount = [];
    let paramsRows = [];

    // soporte date_range: 'YYYY-MM-DD - YYYY-MM-DD' o un solo YYYY-MM-DD
    const date_range = String(req.query.date_range || '').trim();
    if (qtxt || date_range) {
      const parts = [];
      const params = [];
      if (qtxt) {
        const like = `%${qtxt}%`;
        parts.push(`(i.number LIKE ? OR i.client_name LIKE ?)`);
        params.push(like, like);
      }
      if (date_range) {
        const [a,b] = date_range.split('-').map(s=>s.trim()).filter(Boolean);
        if (a && b) {
          parts.push(`(i.register_date BETWEEN ? AND ?)`);
          params.push(a, b);
        } else if (a) {
          parts.push(`(i.register_date = ?)`);
          params.push(a);
        }
      }
      where = 'WHERE ' + parts.join(' AND ');
      paramsCount = params.slice();
      paramsRows = params.slice();
      paramsRows.push(limit, offset);
    } else {
      paramsCount = [];
      paramsRows = [limit, offset];
    }

    const countResult = await q(`SELECT COUNT(*) as total FROM invoices i ${where}`, paramsCount);
    const total = countResult[0]?.total || 0;

    const rows = await q(
      `SELECT i.id, i.number, i.client_name, DATE_FORMAT(i.register_date,'%Y-%m-%d') AS register_date, DATE_FORMAT(i.due_date,'%Y-%m-%d') AS due_date, i.subtotal, i.iva, i.discount, i.total
       FROM invoices i
       ${where}
       ORDER BY i.id ASC
       LIMIT ? OFFSET ?`, paramsRows
    );

    res.json({ ok: true, items: rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { console.error('[INVOICES LIST ERROR]', e); res.status(500).json({ ok:false, error:'Error list invoices', detail:String(e.message || e) }); }
});

app.delete('/api/admin/invoices/:id', requireAdmin, async (req, res) => {
  try { await q('DELETE FROM invoices WHERE id=?', [+req.params.id]); res.json({ ok:true }); }
  catch (e) { console.error(e); res.status(500).json({ ok:false, error:'Error delete invoice' }); }
});

app.post('/api/admin/invoices', requireAdmin, async (req,res)=>{
  try {
    const { number, client_name, register_date, due_date, subtotal, iva, discount, total } = req.body||{};
    if (!number || !client_name) return fail(res, 'Campos requeridos', 422);
    const r = await q(`INSERT INTO invoices (number, client_name, register_date, due_date, subtotal, iva, discount, total, created_at) VALUES (?,?,?,?,?,?,?,?,NOW())`, [number, client_name, register_date||null, due_date||null, subtotal||0, iva||0, discount||0, total||0]);
    ok(res, { ok:true, id: r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create invoice',500); }
});

// ====== ADMIN: Credit Notes (list + delete)
app.get('/api/admin/credit-notes', requireAdmin, async (req, res) => {
  try {
    const qtxt  = String(req.query.q ?? '').trim();
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;

    let where = '';
    let paramsCount = [];
    let paramsRows = [];

    const date_range = String(req.query.date_range || '').trim();
    if (qtxt || date_range) {
      const parts = []; const params = [];
      if (qtxt) { const like = `%${qtxt}%`; parts.push(`(cn.number LIKE ? OR cn.client_name LIKE ?)`); params.push(like, like); }
      if (date_range) { const [a,b] = date_range.split('-').map(s=>s.trim()).filter(Boolean); if (a && b) { parts.push(`(cn.register_date BETWEEN ? AND ?)`); params.push(a,b); } else if (a) { parts.push(`(cn.register_date = ?)`); params.push(a); } }
      where = 'WHERE ' + parts.join(' AND ');
      paramsCount = params.slice(); paramsRows = params.slice(); paramsRows.push(limit, offset);
    } else { paramsCount = []; paramsRows = [limit, offset]; }

    const countResult = await q(`SELECT COUNT(*) as total FROM credit_notes cn ${where}`, paramsCount);
    const total = countResult[0]?.total || 0;

    const rows = await q(
      `SELECT cn.id, cn.number, cn.client_name, DATE_FORMAT(cn.register_date,'%Y-%m-%d') AS register_date, cn.total
       FROM credit_notes cn
       ${where}
       ORDER BY cn.id ASC
       LIMIT ? OFFSET ?`, paramsRows
    );

    res.json({ ok: true, items: rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { console.error('[CREDIT NOTES LIST ERROR]', e); res.status(500).json({ ok:false, error:'Error list credit notes', detail:String(e.message || e) }); }
});

app.delete('/api/admin/credit-notes/:id', requireAdmin, async (req, res) => {
  try { await q('DELETE FROM credit_notes WHERE id=?', [+req.params.id]); res.json({ ok:true }); }
  catch (e) { console.error(e); res.status(500).json({ ok:false, error:'Error delete credit note' }); }
});

app.post('/api/admin/credit-notes', requireAdmin, async (req,res)=>{
  try {
    const { number, client_name, register_date, total } = req.body||{};
    if (!number || !client_name) return fail(res,'Campos requeridos',422);
    const r = await q('INSERT INTO credit_notes (number, client_name, register_date, total, created_at) VALUES (?,?,?,?,NOW())', [number, client_name, register_date||null, total||0]);
    ok(res,{ ok:true, id: r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create credit note',500); }
});

// ====== ADMIN: Accounts Receivable (list + delete)
app.get('/api/admin/accounts-receivable', requireAdmin, async (req, res) => {
  try {
    const qtxt  = String(req.query.q ?? '').trim();
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;

    let where = '';
    let paramsCount = [];
    let paramsRows = [];

    const date_range = String(req.query.date_range || '').trim();
    if (qtxt || date_range) {
      const parts = []; const params = [];
      if (qtxt) { const like = `%${qtxt}%`; parts.push(`(a.invoice_number LIKE ? OR a.client_name LIKE ?)`); params.push(like, like); }
      if (date_range) { const [a,b] = date_range.split('-').map(s=>s.trim()).filter(Boolean); if (a && b) { parts.push(`(a.sale_date BETWEEN ? AND ?)`); params.push(a,b); } else if (a) { parts.push(`(a.sale_date = ?)`); params.push(a); } }
      where = 'WHERE ' + parts.join(' AND ');
      paramsCount = params.slice(); paramsRows = params.slice(); paramsRows.push(limit, offset);
    } else { paramsCount = []; paramsRows = [limit, offset]; }

    const countResult = await q(`SELECT COUNT(*) as total FROM accounts_receivable a ${where}`, paramsCount);
    const total = countResult[0]?.total || 0;

    const rows = await q(
      `SELECT a.id, a.invoice_number, a.client_name, DATE_FORMAT(a.sale_date,'%Y-%m-%d') AS sale_date, DATE_FORMAT(a.due_date,'%Y-%m-%d') AS due_date, a.debt, a.balance, a.status
       FROM accounts_receivable a
       ${where}
       ORDER BY a.id ASC
       LIMIT ? OFFSET ?`, paramsRows
    );

    res.json({ ok: true, items: rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { console.error('[ACCOUNTS RECEIVABLE LIST ERROR]', e); res.status(500).json({ ok:false, error:'Error list accounts receivable', detail:String(e.message || e) }); }
});

app.delete('/api/admin/accounts-receivable/:id', requireAdmin, async (req, res) => {
  try { await q('DELETE FROM accounts_receivable WHERE id=?', [+req.params.id]); res.json({ ok:true }); }
  catch (e) { console.error(e); res.status(500).json({ ok:false, error:'Error delete accounts receivable' }); }
});

app.post('/api/admin/accounts-receivable', requireAdmin, async (req,res)=>{
  try {
    const { invoice_number, client_name, sale_date, due_date, debt, balance, status } = req.body||{};
    if (!invoice_number || !client_name) return fail(res,'Campos requeridos',422);
    const r = await q('INSERT INTO accounts_receivable (invoice_number, client_name, sale_date, due_date, debt, balance, status, created_at) VALUES (?,?,?,?,?,?,?,NOW())', [invoice_number, client_name, sale_date||null, due_date||null, debt||0, balance||0, status||null]);
    ok(res,{ ok:true, id: r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create accounts receivable',500); }
});

// ====== ADMIN: Receipt Errors (list + delete)
app.get('/api/admin/receipt-errors', requireAdmin, async (req, res) => {
  try {
    const qtxt  = String(req.query.q ?? '').trim();
    const page  = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(50, Math.max(5, parseInt(String(req.query.limit ?? '10'), 10)));
    const offset = (page - 1) * limit;

    let where = '';
    let paramsCount = [];
    let paramsRows = [];

    const date_range = String(req.query.date_range || '').trim();
    const type_q = String(req.query.type || '').trim();
    if (qtxt || date_range || type_q) {
      const parts=[]; const params=[];
      if (qtxt) { const like = `%${qtxt}%`; parts.push(`(re.invoice_number LIKE ? OR re.type LIKE ? OR re.errors LIKE ?)`); params.push(like, like, like); }
      if (date_range) { const [a,b] = date_range.split('-').map(s=>s.trim()).filter(Boolean); if (a && b) { parts.push(`(re.register_date BETWEEN ? AND ?)`); params.push(a,b); } else if (a) { parts.push(`(DATE(re.register_date) = ?)`); params.push(a); } }
      if (type_q) { parts.push(`(re.type = ?)`); params.push(type_q); }
      where = 'WHERE ' + parts.join(' AND ');
      paramsCount = params.slice(); paramsRows = params.slice(); paramsRows.push(limit, offset);
    } else { paramsCount = []; paramsRows = [limit, offset]; }

    const countResult = await q(`SELECT COUNT(*) as total FROM receipt_errors re ${where}`, paramsCount);
    const total = countResult[0]?.total || 0;

    const rows = await q(
      `SELECT re.id, re.invoice_number, DATE_FORMAT(re.register_date,'%Y-%m-%d %H:%i:%s') AS register_date, re.type, re.stage, re.environment, re.errors
       FROM receipt_errors re
       ${where}
       ORDER BY re.id ASC
       LIMIT ? OFFSET ?`, paramsRows
    );

    res.json({ ok: true, items: rows, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (e) { console.error('[RECEIPT ERRORS LIST ERROR]', e); res.status(500).json({ ok:false, error:'Error list receipt errors', detail:String(e.message || e) }); }
});

app.delete('/api/admin/receipt-errors/:id', requireAdmin, async (req, res) => {
  try { await q('DELETE FROM receipt_errors WHERE id=?', [+req.params.id]); res.json({ ok:true }); }
  catch (e) { console.error(e); res.status(500).json({ ok:false, error:'Error delete receipt error' }); }
});

app.post('/api/admin/receipt-errors', requireAdmin, async (req,res)=>{
  try {
    const { invoice_number, register_date, type, stage, environment, errors } = req.body||{};
    const r = await q('INSERT INTO receipt_errors (invoice_number, register_date, type, stage, environment, errors, created_at) VALUES (?,?,?,?,?,?,NOW())', [invoice_number||null, register_date||null, type||null, stage||null, environment||null, errors||null]);
    ok(res,{ ok:true, id: r.insertId });
  } catch(e){ console.error(e); fail(res,'Error create receipt error',500); }
});

// ============= CLIENT ENDPOINTS =============

// --- helper de auth para cliente ---
function requireClient(req, res, next) {
  if (!req.session?.uid || req.session?.role !== 'customer') {
    return res.status(403).json({ ok: false, error: 'No autorizado - cliente requerido' });
  }
  next();
}

// --------- CLIENT: Dashboard stats ---------
app.get('/api/client/stats', requireClient, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const userId = req.session.uid;
      
      // Estadísticas de pedidos del cliente
      const [stats] = await conn.query(`
        SELECT 
          COUNT(CASE WHEN status = 'Pre alerta' THEN 1 END) as prealerta,
          COUNT(CASE WHEN status = 'Captado en agencia' THEN 1 END) as captado,
          COUNT(CASE WHEN status = 'Despachado' THEN 1 END) as viajando,
          COUNT(CASE WHEN status = 'En aduana' THEN 1 END) as aduana,
          COUNT(CASE WHEN status = 'En espera de pago' THEN 1 END) as esperaPago,
          COUNT(CASE WHEN status = 'Pago aprobado' THEN 1 END) as pagoOk,
          COUNT(CASE WHEN status = 'Entregado' THEN 1 END) as entregado,
          COUNT(*) as totalOrders,
          COALESCE(SUM(total), 0) as totalAmount
        FROM orders o 
        WHERE o.user_id = ?
      `, [userId]);
      
      res.json({ 
        ok: true, 
        stats: stats[0] || {
          prealerta: 0,
          captado: 0, 
          viajando: 0,
          aduana: 0,
          esperaPago: 0,
          pagoOk: 0,
          entregado: 0,
          totalOrders: 0,
          totalAmount: 0
        }
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo estadísticas' });
  }
});

// --------- CLIENT: Orders list ---------
app.get('/api/client/orders', requireClient, async (req, res) => {
  try {
    const { page = 1, limit = 10, q = '', status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const like = `%${String(q).trim()}%`;
    const userId = req.session.uid;
    
    const conn = await pool.getConnection();
    try {
      let whereConditions = ['o.user_id = ?'];
      let queryParams = [userId];
      
      // Filtro de búsqueda general
      if (q && q.trim()) {
        whereConditions.push('(o.guide LIKE ? OR o.status LIKE ?)');
        queryParams.push(like, like);
      }
      
      // Filtro por estado
      if (status && status.trim()) {
        whereConditions.push('o.status = ?');
        queryParams.push(status.trim());
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
      // Contar total
      const [countResult] = await conn.query(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        queryParams
      );
      
      const total = countResult[0]?.total || 0;
      const pages = Math.ceil(total / Number(limit));
      
      // Obtener pedidos
      const [orders] = await conn.query(`
        SELECT 
          o.id,
          o.guide,
          CONCAT(COALESCE(a.address, ''), ' / ', COALESCE(a.city, '')) AS address,
          DATE(o.created_at) AS date,
          o.total,
          o.status
        FROM orders o
        LEFT JOIN addresses a ON a.id = o.address_id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, Number(limit), offset]);
      
      res.json({ 
        ok: true, 
        orders,
        page: Number(page),
        limit: Number(limit),
        total,
        pages
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo pedidos' });
  }
});

// --------- CLIENT: Order tracking ---------
app.get('/api/client/tracking/:guide', requireClient, async (req, res) => {
  try {
    const { guide } = req.params;
    const userId = req.session.uid;
    
    const conn = await pool.getConnection();
    try {
      const [orders] = await conn.query(`
        SELECT 
          o.id,
          o.guide,
          o.status,
          o.total,
          DATE(o.created_at) AS created_date,
          CONCAT(COALESCE(a.address, ''), ' / ', COALESCE(a.city, '')) AS full_address,
          COALESCE(c.names, u.username) AS customer_name,
          COALESCE(c.phone, '') AS phone,
          COALESCE(c.email, '') AS email
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id  
        LEFT JOIN addresses a ON a.id = o.address_id
        WHERE o.guide = ? AND o.user_id = ?
      `, [guide, userId]);
      
      if (orders.length === 0) {
        return res.status(404).json({ ok: false, error: 'Pedido no encontrado' });
      }
      
      res.json({ ok: true, order: orders[0] });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo tracking' });
  }
});

// --------- CLIENT: Profile ---------
app.get('/api/client/profile', requireClient, async (req, res) => {
  try {
    const userId = req.session.uid;
    
    const conn = await pool.getConnection();
    try {
      const [users] = await conn.query(`
        SELECT 
          u.id,
          u.username,
          u.customer_id,
          c.names,
          c.email,
          c.phone,
          c.dni as identification,
          DATE_FORMAT(u.created_at, '%Y-%m-%d') as member_since
        FROM users u
        LEFT JOIN customers c ON c.id = u.customer_id
        WHERE u.id = ?
      `, [userId]);
      
      if (users.length === 0) {
        return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
      }
      
      // Obtener direcciones del cliente
      const [addresses] = await conn.query(`
        SELECT id, address, city
        FROM addresses 
        WHERE user_id = ?
      `, [userId]);
      
      res.json({ 
        ok: true, 
        profile: {
          ...users[0],
          addresses
        }
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo perfil' });
  }
});

// --------- CLIENT: Update profile ---------
app.put('/api/client/profile', requireClient, async (req, res) => {
  try {
    const userId = req.session.uid;
    const { names, email, phone, identification } = req.body;
    
    const conn = await pool.getConnection();
    try {
      // Obtener customer_id del usuario
      const [user] = await conn.query('SELECT customer_id FROM users WHERE id = ?', [userId]);
      
      if (!user[0]?.customer_id) {
        return res.status(400).json({ ok: false, error: 'Usuario sin perfil de cliente' });
      }
      
      // Actualizar datos del cliente
      await conn.query(`
        UPDATE customers 
        SET names = ?, email = ?, phone = ?, dni = ?
        WHERE id = ?
      `, [names, email, phone, identification, user[0].customer_id]);
      
      res.json({ ok: true, message: 'Perfil actualizado exitosamente' });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error actualizando perfil' });
  }
});

// --------- CLIENT: Change password ---------
app.put('/api/client/change-password', requireClient, async (req, res) => {
  try {
    const userId = req.session.uid;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'Contraseña actual y nueva son requeridas' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    const conn = await pool.getConnection();
    try {
      // Verificar contraseña actual
      const [users] = await conn.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      
      if (!users[0]) {
        return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
      }
      
      const validPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!validPassword) {
        return res.status(400).json({ ok: false, error: 'Contraseña actual incorrecta' });
      }
      
      // Generar hash de nueva contraseña
      const newHash = await bcrypt.hash(newPassword, 10);
      
      // Actualizar contraseña
      await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
      
      res.json({ ok: true, message: 'Contraseña cambiada exitosamente' });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error cambiando contraseña' });
  }
});

// --------- PUBLIC: Tracking (no authentication required) ---------
app.get('/api/tracking/:guide', async (req, res) => {
  try {
    const { guide } = req.params;
    
    if (!guide || guide.trim() === '') {
      return res.status(400).json({ ok: false, error: 'Número de guía requerido' });
    }
    
    const conn = await pool.getConnection();
    try {
      // Buscar el pedido por número de guía
      const [orders] = await conn.query(`
        SELECT 
          o.id,
          o.guide,
          o.status,
          o.total,
          o.created_at,
          c.names as customer_name,
          a.address,
          a.city
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id  
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.user_id = o.user_id
        WHERE o.guide = ?
        LIMIT 1
      `, [guide]);
      
      if (orders.length === 0) {
        return res.status(404).json({ 
          ok: false, 
          error: 'No se encontró ningún pedido con ese número de guía' 
        });
      }
      
      const order = orders[0];
      
      // Generar historial de estados basado en el estado actual
      const trackingHistory = generateTrackingHistory(order.status, order.created_at);
      
      res.json({ 
        ok: true, 
        tracking: {
          guide: order.guide,
          status: order.status,
          customer_name: order.customer_name,
          address: `${order.address} / ${order.city}`,
          total: Number(order.total || 0),
          created_date: order.created_at,
          history: trackingHistory
        }
      });
    } finally { 
      conn.release(); 
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Error obteniendo información de tracking' });
  }
});

// Helper function para generar historial de tracking
function generateTrackingHistory(currentStatus, createdAt) {
  const baseDate = new Date(createdAt);
  const history = [];
  
  // Estados en orden cronológico
  const statusFlow = [
    'Pre alerta',
    'Captado en agencia', 
    'Despachado',
    'En aduana',
    'En espera de pago',
    'Pago aprobado',
    'Entregado'
  ];
  
  const statusDescriptions = {
    'Pre alerta': 'Pre-alerta registrada en el sistema',
    'Captado en agencia': 'Paquete recibido en agencia de origen',
    'Despachado': 'Paquete despachado hacia destino',
    'En aduana': 'Paquete en proceso de aduanas',
    'En espera de pago': 'Pendiente de pago de aranceles',
    'Pago aprobado': 'Pago de aranceles completado',
    'Entregado': 'Paquete entregado al cliente'
  };
  
  const currentIndex = statusFlow.indexOf(currentStatus);
  
  // Generar historial hasta el estado actual
  for (let i = 0; i <= currentIndex && i < statusFlow.length; i++) {
    const status = statusFlow[i];
    const statusDate = new Date(baseDate);
    statusDate.setDate(statusDate.getDate() + i); // Agregar días progresivamente
    
    history.push({
      fecha: statusDate.toISOString().split('T')[0],
      estado: status,
      detalle: statusDescriptions[status] || status,
      completed: true
    });
  }
  
  // Agregar estados futuros como pendientes (solo si no está entregado)
  if (currentIndex < statusFlow.length - 1 && currentStatus !== 'Entregado') {
    for (let i = currentIndex + 1; i < statusFlow.length; i++) {
      const status = statusFlow[i];
      
      history.push({
        fecha: '---',
        estado: status,
        detalle: statusDescriptions[status] || status,
        completed: false
      });
    }
  }
  
  return history;
}

// --------- ADMIN: Addresses management ---------
app.get('/api/admin/addresses', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const conn = await pool.getConnection();
    try {
      let whereClause = '';
      let params = [];
      
      if (search.trim()) {
        whereClause = 'WHERE a.address LIKE ? OR u.username LIKE ?';
        params = [`%${search}%`, `%${search}%`];
      }
      
      // Contar total
      const [countResult] = await conn.query(`
        SELECT COUNT(*) as total 
        FROM addresses a 
        LEFT JOIN users u ON u.id = a.user_id 
        ${whereClause}
      `, params);
      
      // Obtener direcciones con paginación
      const [addresses] = await conn.query(`
        SELECT 
          a.id,
          a.address,
          a.city,
          a.user_id,
          u.username
        FROM addresses a
        LEFT JOIN users u ON u.id = a.user_id
        ${whereClause}
        ORDER BY a.id DESC
        LIMIT ? OFFSET ?
      `, [...params, Number(limit), offset]);
      
      const total = countResult[0].total;
      const pages = Math.ceil(total / Number(limit));
      
      res.json({
        ok: true,
        addresses: addresses || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages
        }
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error obteniendo direcciones:', e);
    res.status(500).json({ ok: false, error: 'Error obteniendo direcciones' });
  }
});

app.post('/api/admin/addresses', requireAdmin, async (req, res) => {
  try {
    const { user_id, address, city } = req.body;
    
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(`
        INSERT INTO addresses (user_id, address, city)
        VALUES (?, ?, ?)
      `, [user_id, address, city]);
      
      res.json({ ok: true, id: result.insertId });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error creando dirección:', e);
    res.status(500).json({ ok: false, error: 'Error creando dirección' });
  }
});

app.put('/api/admin/addresses/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { address, city } = req.body;
    
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        UPDATE addresses 
        SET address = ?, city = ?
        WHERE id = ?
      `, [address, city, Number(id)]);
      
      res.json({ ok: true });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error actualizando dirección:', e);
    res.status(500).json({ ok: false, error: 'Error actualizando dirección' });
  }
});

app.delete('/api/admin/addresses/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM addresses WHERE id = ?', [Number(id)]);
      res.json({ ok: true });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error eliminando dirección:', e);
    res.status(500).json({ ok: false, error: 'Error eliminando dirección' });
  }
});

// --------- ADMIN: Print Label ---------
app.get('/api/admin/orders/:id/print-label', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, error: 'ID de orden inválido' });
    }
    
    const conn = await pool.getConnection();
    try {
      // Obtener información completa de la orden para la etiqueta
      const [orders] = await conn.query(`
        SELECT 
          o.id,
          o.guide,
          o.tracking_code,
          o.status,
          o.total,
          o.created_at,
          COALESCE(c.names, u.username) AS client_name,
          COALESCE(c.email, '') AS client_email,
          COALESCE(c.phone, '') AS client_phone,
          CONCAT(
            COALESCE(a.address, ''), 
            CASE WHEN a.city IS NOT NULL THEN CONCAT(' / ', a.city) ELSE '' END
          ) AS client_address,
          p.tracking_code AS provider_code,
          p.name AS provider_name
        FROM orders o
        JOIN users u ON u.id = o.user_id
        LEFT JOIN customers c ON c.id = u.customer_id
        LEFT JOIN addresses a ON a.id = o.address_id
        LEFT JOIN providers p ON p.id = o.provider_id
        WHERE o.id = ?
      `, [Number(id)]);
      
      if (orders.length === 0) {
        return res.status(404).json({ ok: false, error: 'Orden no encontrada' });
      }
      
      const order = orders[0];
      
      // Generar HTML para la etiqueta
      const labelHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Etiqueta de Paquete - ${order.guide}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', Arial, sans-serif;
              background: white;
              margin: 0;
              padding: 10px;
            }
            
            .label {
              width: 4in;
              height: 6in;
              border: 3px solid #000;
              margin: 0 auto;
              background: white;
              display: flex;
              flex-direction: column;
              position: relative;
            }
            
            .header {
              text-align: center;
              padding: 15px 10px 10px 10px;
              border-bottom: 2px solid #000;
            }
            
            .logo-container {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 8px;
            }
            
            .logo {
              width: 80px;
              height: 80px;
              border: 3px solid #000;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              background: white;
            }
            
            .logo-text {
              font-size: 11px;
              font-weight: 700;
              line-height: 1.1;
              text-align: center;
            }
            
            .logo-subtitle {
              font-size: 8px;
              font-weight: 500;
              margin-top: 2px;
            }
            
            .address-info {
              font-size: 12px;
              font-weight: 600;
              color: #000;
              margin-bottom: 5px;
            }
            
            .warehouse-code {
              font-size: 14px;
              font-weight: 700;
              color: #000;
              margin-bottom: 5px;
            }
            
            .barcode-section {
              text-align: center;
              padding: 15px 10px;
              background: white;
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            .barcode {
              width: 100%;
              height: 60px;
              background: repeating-linear-gradient(
                90deg,
                #000 0px,
                #000 1px,
                #fff 1px,
                #fff 2px,
                #000 2px,
                #000 3px,
                #fff 3px,
                #fff 4px,
                #000 4px,
                #000 5px,
                #fff 5px,
                #fff 7px,
                #000 7px,
                #000 8px,
                #fff 8px,
                #fff 9px
              );
              margin: 10px 0;
              border: 1px solid #000;
            }
            
            .reference-code {
              font-size: 24px;
              font-weight: 700;
              color: #000;
              letter-spacing: 1px;
              margin: 10px 0;
            }
            
            .details-section {
              padding: 10px;
              border-top: 2px solid #000;
              font-size: 10px;
              line-height: 1.4;
            }
            
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              align-items: center;
            }
            
            .detail-label {
              font-weight: 600;
              color: #000;
            }
            
            .detail-value {
              font-weight: 500;
              color: #000;
              text-align: right;
              flex: 1;
              margin-left: 10px;
            }
            
            .client-name {
              font-size: 11px;
              font-weight: 700;
              text-align: center;
              margin-top: 5px;
              color: #000;
            }
            
            .tracking-code-small {
              font-size: 8px;
              color: #666;
              text-align: center;
              margin-top: 3px;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 5px;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .label { 
                margin: 0;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <!-- Header con logo y dirección -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">
                  <div class="logo-text">AMERICANBOX</div>
                  <div class="logo-subtitle">COURIER</div>
                </div>
              </div>
              <div class="address-info">8426 NW 70TH ST MIAMI FLORIDA Código postal 33166</div>
              <div class="warehouse-code">1 DE 1 (AMB)</div>
            </div>
            
            <!-- Sección de código de barras -->
            <div class="barcode-section">
              <div class="barcode"></div>
              <div class="reference-code">${order.guide}</div>
              ${order.tracking_code ? `<div class="tracking-code-small">${order.tracking_code}</div>` : ''}
            </div>
            
            <!-- Sección de detalles -->
            <div class="details-section">
              <div class="detail-row">
                <span class="detail-label">Referencia:</span>
                <span class="detail-value">${order.guide}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Peso en libras:</span>
                <span class="detail-value">2,67 / Kg: 1,21</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Categoría:</span>
                <span class="detail-value">B O 4X4</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destino:</span>
                <span class="detail-value">Ecuador - GUAYAS - GUAYAQUIL</span>
              </div>
              <div class="client-name">${order.client_name.toUpperCase()}</div>
              ${order.provider_code && order.provider_code !== 'N/A' ? `<div class="tracking-code-small">Proveedor: ${order.provider_code}</div>` : ''}
            </div>
          </div>
          
          <script>
            // Auto-imprimir cuando se carga la página
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
            }
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(labelHtml);
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error generando etiqueta:', e);
    res.status(500).json({ ok: false, error: 'Error generando etiqueta' });
  }
});

// --------- REPORTES ADMINISTRATIVOS ---------

// --------- ADMIN: Reporte indicador de pedidos ---------
app.get('/api/admin/reports/orders/indicator', requireAdmin, async (req, res) => {
  try {
    const { date_range, initial_status, final_status } = req.query;
    
    const conn = await pool.getConnection();
    try {
      let query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM orders 
        WHERE 1=1
      `;
      const params = [];
      
      // Filtro por rango de fechas
      if (date_range) {
        const dates = date_range.split(' to ');
        if (dates.length === 2) {
          query += ` AND DATE(created_at) BETWEEN ? AND ?`;
          params.push(dates[0], dates[1]);
        }
      }
      
      // Filtros por estado inicial y final (para reportes de transición)
      if (initial_status && final_status) {
        query += ` AND status IN (?, ?)`;
        params.push(initial_status, final_status);
      }
      
      query += ` GROUP BY status ORDER BY count DESC`;
      
      const [rows] = await conn.query(query, params);
      
      res.json({
        ok: true,
        rows: rows || [],
        total: rows?.reduce((sum, row) => sum + row.count, 0) || 0
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error en reporte indicador:', e);
    res.status(500).json({ ok: false, error: 'Error generando reporte indicador' });
  }
});

// --------- ADMIN: Reporte por cliente específico ---------
app.get('/api/admin/reports/orders/by-client', requireAdmin, async (req, res) => {
  try {
    const { client_id, client_name, date_range, status, page = 1, limit = 10 } = req.query;
    
    const conn = await pool.getConnection();
    try {
      let baseQuery = `
        FROM orders o 
        INNER JOIN users u ON o.user_id = u.id 
        INNER JOIN customers c ON u.customer_id = c.id
        LEFT JOIN addresses a ON o.address_id = a.id
        LEFT JOIN providers p ON o.provider_id = p.id
        WHERE 1=1
      `;
      const params = [];
      
      // Filtro por cliente específico
      if (client_id) {
        baseQuery += ` AND c.id = ?`;
        params.push(client_id);
      } else if (client_name) {
        baseQuery += ` AND (c.names LIKE ? OR c.email LIKE ?)`;
        params.push(`%${client_name}%`, `%${client_name}%`);
      }
      
      // Filtro por rango de fechas
      if (date_range) {
        const dates = date_range.split(' to ');
        if (dates.length === 2) {
          baseQuery += ` AND DATE(o.created_at) BETWEEN ? AND ?`;
          params.push(dates[0], dates[1]);
        }
      }
      
      // Filtro por estado
      if (status) {
        baseQuery += ` AND o.status = ?`;
        params.push(status);
      }
      
      // Consulta para el total de registros
      const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      const [countResult] = await conn.query(countQuery, params);
      const total = countResult[0]?.total || 0;
      
      // Consulta principal con paginación
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT 
          o.id,
          o.guide,
          o.status,
          o.total,
          o.weight_lbs,
          o.location,
          o.tracking_code,
          o.created_at as register_date,
          c.id as client_id,
          c.names as client_name,
          c.email as client_email,
          c.dni as client_dni,
          c.mobile as client_mobile,
          a.address as delivery_address,
          p.name as provider_name,
          p.tracking_code as provider_code
        ${baseQuery}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [orders] = await conn.query(dataQuery, [...params, parseInt(limit), offset]);
      
      // Estadísticas del cliente
      const statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN o.status = 'Pre alerta' THEN 1 END) as pre_alerta,
          COUNT(CASE WHEN o.status = 'Captado en agencia' THEN 1 END) as captado,
          COUNT(CASE WHEN o.status = 'Despacho' THEN 1 END) as despacho,
          COUNT(CASE WHEN o.status = 'En proceso de entrega' THEN 1 END) as en_proceso,
          COUNT(CASE WHEN o.status = 'Entregado' THEN 1 END) as entregado,
          COALESCE(SUM(o.total), 0) as total_amount,
          COALESCE(SUM(o.weight_lbs), 0) as total_weight
        ${baseQuery}
      `;
      
      const [statsResult] = await conn.query(statsQuery, params);
      const stats = statsResult[0] || {};
      
      res.json({
        ok: true,
        orders: orders || [],
        stats: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error en reporte por cliente:', e);
    res.status(500).json({ ok: false, error: 'Error generando reporte por cliente' });
  }
});

// --------- ADMIN: Lista de clientes para reportes ---------
app.get('/api/admin/reports/clients', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    const conn = await pool.getConnection();
    try {
      let query = `
        SELECT 
          c.id,
          c.names as name,
          c.email,
          c.dni,
          c.mobile,
          c.address,
          COUNT(o.id) as total_orders,
          COALESCE(SUM(o.total), 0) as total_amount,
          MAX(o.created_at) as last_order_date,
          u.username,
          u.role
        FROM customers c
        LEFT JOIN users u ON c.id = u.customer_id
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.role = 'customer'
      `;
      const params = [];
      
      if (q) {
        query += ` AND (c.names LIKE ? OR c.email LIKE ? OR c.dni LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
      }
      
      query += ` GROUP BY c.id, c.names, c.email, c.dni, c.mobile, c.address, u.username, u.role ORDER BY total_orders DESC, c.names ASC`;
      
      const [clients] = await conn.query(query, params);
      
      res.json({
        ok: true,
        clients: clients || []
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error obteniendo lista de clientes:', e);
    res.status(500).json({ ok: false, error: 'Error obteniendo clientes' });
  }
});

// --------- ADMIN: Reporte paquetes/pedidos ---------
app.get('/api/admin/reports/packages', requireAdmin, async (req, res) => {
  try {
    const { q, date_range, page = 1, limit = 10 } = req.query;
    
    const conn = await pool.getConnection();
    try {
      let baseQuery = `
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN customers c ON u.customer_id = c.id
        LEFT JOIN addresses a ON o.address_id = a.id
        LEFT JOIN providers p ON o.provider_id = p.id
        WHERE 1=1
      `;
      const params = [];
      
      // Búsqueda por texto
      if (q) {
        baseQuery += ` AND (o.guide LIKE ? OR o.tracking_code LIKE ? OR c.names LIKE ? OR c.email LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
      
      // Filtro por rango de fechas
      if (date_range) {
        const dates = date_range.split(' to ');
        if (dates.length === 2) {
          baseQuery += ` AND DATE(o.created_at) BETWEEN ? AND ?`;
          params.push(dates[0], dates[1]);
        }
      }
      
      // Consulta para el total de registros
      const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      const [countResult] = await conn.query(countQuery, params);
      const total = countResult[0]?.total || 0;
      
      // Consulta principal con paginación
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT 
          o.id,
          o.guide as hawb,
          c.names as sender,
          c.names as recipient,
          c.id as recipient_id,
          o.weight_lbs as weight_kg,
          o.total as fob_value,
          'Paquete courier' as description,
          1 as pieces,
          a.address as sender_address,
          a.address as recipient_address,
          o.guide as invoice_number,
          o.created_at as register_date,
          o.status,
          o.tracking_code,
          o.location,
          p.name as provider_name,
          c.email as customer_email
        ${baseQuery}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [packages] = await conn.query(dataQuery, [...params, parseInt(limit), offset]);
      
      res.json({
        ok: true,
        items: packages || [],
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error en reporte de paquetes:', e);
    res.status(500).json({ ok: false, error: 'Error generando reporte de paquetes' });
  }
});

// --------- ADMIN: Get location settings ---------
app.get('/api/admin/location-settings', requireAdmin, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [settings] = await conn.query(`
        SELECT 
          default_location,
          miami_address,
          doral_address
        FROM company_settings 
        LIMIT 1
      `);
      
      if (settings.length === 0) {
        return res.status(404).json({ ok: false, error: 'Configuraciones no encontradas' });
      }
      
      const locationSettings = settings[0];
      
      res.json({
        ok: true,
        data: {
          defaultLocation: locationSettings.default_location,
          locations: {
            miami: {
              name: 'Miami',
              value: 'miami',
              address: locationSettings.miami_address
            },
            doral: {
              name: 'Doral', 
              value: 'doral',
              address: locationSettings.doral_address
            }
          }
        }
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error obteniendo configuración de ubicaciones:', e);
    res.status(500).json({ ok: false, error: 'Error obteniendo configuración' });
  }
});

// --------- ADMIN: Update location settings ---------
app.put('/api/admin/location-settings', requireAdmin, async (req, res) => {
  try {
    const { defaultLocation, miamiAddress, doralAddress } = req.body;
    
    // Validar ubicación por defecto
    if (defaultLocation && !['miami', 'doral'].includes(defaultLocation)) {
      return res.status(400).json({ ok: false, error: 'Ubicación por defecto inválida' });
    }
    
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        UPDATE company_settings 
        SET 
          default_location = COALESCE(?, default_location),
          miami_address = COALESCE(?, miami_address),
          doral_address = COALESCE(?, doral_address),
          updated_at = NOW()
        WHERE id = 1
      `, [defaultLocation || null, miamiAddress || null, doralAddress || null]);
      
      res.json({ ok: true, message: 'Configuraciones de ubicación actualizadas' });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error actualizando configuración de ubicaciones:', e);
    res.status(500).json({ ok: false, error: 'Error actualizando configuración' });
  }
});

// ============= COMPLAINTS ENDPOINTS =============

// --------- CLIENT: Submit complaint ---------
app.post('/api/client/complaints', requireClient, async (req, res) => {
  try {
    const { subject, message, order_id, priority } = req.body;
    const userId = req.session.uid;
    
    if (!subject || !message) {
      return res.status(400).json({ ok: false, error: 'Asunto y mensaje son requeridos' });
    }
    
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`
        INSERT INTO complaints (
          user_id, 
          subject, 
          description, 
          order_id, 
          priority, 
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())
      `, [userId, subject, message, order_id || null, priority || 'medium']);
      
      res.json({ 
        ok: true, 
        id: result[0].insertId,
        message: 'Queja enviada correctamente'
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error creando queja:', e);
    res.status(500).json({ ok: false, error: 'Error enviando queja' });
  }
});

// --------- CLIENT: Get my complaints ---------
app.get('/api/client/complaints', requireClient, async (req, res) => {
  try {
    const userId = req.session.uid;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const conn = await pool.getConnection();
    try {
      // Contar total
      const [countResult] = await conn.query(`
        SELECT COUNT(*) as total 
        FROM complaints 
        WHERE user_id = ?
      `, [userId]);
      
      const total = countResult[0]?.total || 0;
      
      // Obtener quejas
      const [complaints] = await conn.query(`
        SELECT 
          c.id,
          c.subject,
          c.description as message,
          c.status,
          c.priority,
          c.admin_response,
          DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') as created_at,
          DATE_FORMAT(c.updated_at, '%Y-%m-%d %H:%i') as updated_at,
          o.guide as order_guide,
          admin_customer.names as admin_name
        FROM complaints c
        LEFT JOIN orders o ON c.order_id = o.id
        LEFT JOIN users u_admin ON c.admin_user_id = u_admin.id
        LEFT JOIN customers admin_customer ON u_admin.customer_id = admin_customer.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, Number(limit), offset]);
      
      res.json({
        ok: true,
        items: complaints || [],
        page: Number(page),
        limit: Number(limit),
        total: total,
        pages: Math.ceil(total / Number(limit))
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error obteniendo quejas:', e);
    res.status(500).json({ ok: false, error: 'Error obteniendo quejas' });
  }
});

// --------- ADMIN: Get all complaints ---------
app.get('/api/admin/complaints', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', priority = '', q = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const conn = await pool.getConnection();
    try {
      let whereConditions = ['1=1'];
      let queryParams = [];
      
      // Filtros
      if (status && status.trim()) {
        whereConditions.push('c.status = ?');
        queryParams.push(status.trim());
      }
      
      if (priority && priority.trim()) {
        whereConditions.push('c.priority = ?');
        queryParams.push(priority.trim());
      }
      
      if (q && q.trim()) {
        const like = `%${q.trim()}%`;
        whereConditions.push('(c.subject LIKE ? OR c.description LIKE ? OR customer.names LIKE ?)');
        queryParams.push(like, like, like);
      }
      
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
      // Contar total
      const [countResult] = await conn.query(`
        SELECT COUNT(*) as total 
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN customers customer ON u.customer_id = customer.id
        ${whereClause}
      `, queryParams);
      
      const total = countResult[0]?.total || 0;
      
      // Obtener quejas
      const [complaints] = await conn.query(`
        SELECT 
          c.id,
          c.subject,
          c.description as message,
          c.status,
          c.priority,
          c.admin_response,
          DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') as created_at,
          DATE_FORMAT(c.updated_at, '%Y-%m-%d %H:%i') as updated_at,
          customer.names as customer_name,
          customer.email as customer_email,
          o.guide as order_guide,
          admin_customer.names as admin_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN customers customer ON u.customer_id = customer.id
        LEFT JOIN orders o ON c.order_id = o.id
        LEFT JOIN users u_admin ON c.admin_user_id = u_admin.id
        LEFT JOIN customers admin_customer ON u_admin.customer_id = admin_customer.id
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN c.priority = 'high' THEN 1
            WHEN c.priority = 'medium' THEN 2
            WHEN c.priority = 'low' THEN 3
            ELSE 4
          END,
          c.created_at DESC
        LIMIT ? OFFSET ?
      `, [...queryParams, Number(limit), offset]);
      
      res.json({
        ok: true,
        items: complaints || [],
        page: Number(page),
        limit: Number(limit),
        total: total,
        pages: Math.ceil(total / Number(limit))
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error obteniendo quejas admin:', e);
    res.status(500).json({ ok: false, error: 'Error obteniendo quejas' });
  }
});

// --------- ADMIN: Respond to complaint ---------
app.put('/api/admin/complaints/:id/respond', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status } = req.body;
    const adminUserId = req.session.uid;
    
    if (!response) {
      return res.status(400).json({ ok: false, error: 'Respuesta es requerida' });
    }
    
    if (status && !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Estado inválido' });
    }
    
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`
        UPDATE complaints 
        SET 
          admin_response = ?,
          admin_user_id = ?,
          status = COALESCE(?, status),
          updated_at = NOW()
        WHERE id = ?
      `, [response, adminUserId, status || null, id]);
      
      if (result[0].affectedRows === 0) {
        return res.status(404).json({ ok: false, error: 'Queja no encontrada' });
      }
      
      res.json({ 
        ok: true, 
        message: 'Respuesta enviada correctamente'
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error respondiendo queja:', e);
    res.status(500).json({ ok: false, error: 'Error enviando respuesta' });
  }
});

// --------- ADMIN: Update complaint status ---------
app.put('/api/admin/complaints/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Estado inválido' });
    }
    
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(`
        UPDATE complaints 
        SET 
          status = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [status, id]);
      
      if (result[0].affectedRows === 0) {
        return res.status(404).json({ ok: false, error: 'Queja no encontrada' });
      }
      
      res.json({ 
        ok: true, 
        message: 'Estado actualizado correctamente'
      });
      
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error('❌ Error actualizando estado:', e);
    res.status(500).json({ ok: false, error: 'Error actualizando estado' });
  }
});
