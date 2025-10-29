// Servidor de prueba simple para verificar API con Firebase
const express = require('express');
const cors = require('cors');
const { db } = require('./api/lib/firebase');

const app = express();
const PORT = 4001; // Usar puerto diferente

app.use(cors());
app.use(express.json());

// Endpoint de prueba para obtener usuarios
app.get('/api/test/users', async (req, res) => {
  try {
    console.log('📡 Consultando usuarios en Firestore...');
    const usersSnapshot = await db.collection('users').get();

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Encontrados ${users.length} usuarios`);
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('❌ Error al consultar usuarios:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para obtener todas las colecciones
app.get('/api/test/collections', async (req, res) => {
  try {
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);

    res.json({
      success: true,
      collections: collectionNames
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   GET /api/test/users - Lista todos los usuarios`);
  console.log(`   GET /api/test/collections - Lista todas las colecciones`);
});