// /api/login.js
import { auth, db } from './firebase.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Usuario y contraseña requeridos' });
    }

    console.log('🔍 Intentando login para:', username);

    // Buscar usuario en Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).limit(1).get();

    if (snapshot.empty) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash || user.password);

    if (!validPassword) {
      console.log('❌ Contraseña incorrecta para:', username);
      return res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
    }

    console.log('✅ Login exitoso:', username);

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
  } catch (err) {
    console.error('❌ Error en /api/login:', err.message);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
