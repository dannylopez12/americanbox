// Endpoint de login para Vercel Serverless Functions
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { auth } = require('./firebase');

console.log('🔧 Login function loaded');
console.log('Environment variables:', {
  DB_HOST: process.env.DB_HOST ? 'SET' : 'NOT SET',
  DB_USER: process.env.DB_USER ? 'SET' : 'NOT SET',
  DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT SET',
  DB_NAME: process.env.DB_NAME ? 'SET' : 'NOT SET',
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET'
});

module.exports = async function handler(req, res) {
  console.log('🔐 Login request received:', req.method, req.url);

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    // Verificar variables de entorno
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not set');
      return res.status(500).json({ 
        ok: false, 
        error: 'Configuración de Firebase incompleta - verifica variables de entorno en Vercel' 
      });
    }

    const { idToken } = req.body;

    if (!idToken) {
      console.log('❌ Missing idToken');
      return res.status(400).json({ 
        ok: false, 
        error: 'idToken requerido' 
      });
    }

    console.log('🔍 Verifying Firebase token');

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log('✅ Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.error('❌ Invalid token:', error);
      return res.status(401).json({ 
        ok: false, 
        error: 'Token inválido' 
      });
    }

    // Aquí puedes buscar info adicional en MySQL o Firestore si es necesario
    // Por ahora, devolver info del token
    const user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      username: decodedToken.email, // O decodedToken.name si está disponible
      isAdmin: false, // Lógica para determinar admin
      role: 'user'
    };

    // Login exitoso - determinar redirect basado en rol
    const isAdmin = user.isAdmin || user.role === 'admin';
    const redirect = isAdmin ? '/dashboard' : '/client';
    
    return res.status(200).json({
      ok: true,
      redirect: redirect,
      user: user
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}