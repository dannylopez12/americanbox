const { db } = require('./firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Checking Firestore structure');

  try {
    // Obtener todas las collections
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    console.log('🔍 Available collections:', collectionNames);

    const collectionStructure = {};

    // Verificar estructura de cada collection relevante
    const relevantCollections = ['users', 'customers', 'products', 'categories', 'orders', 'addresses', 'vouchers'];

    for (const collectionName of relevantCollections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          collectionStructure[collectionName] = {
            documentId: doc.id,
            fields: Object.keys(data),
            sampleData: data
          };
          console.log(`🔍 ${collectionName} fields:`, Object.keys(data));
        } else {
          collectionStructure[collectionName] = { message: 'Collection exists but is empty' };
        }
      } catch (e) {
        console.log(`🔍 Collection ${collectionName} error:`, e.message);
        collectionStructure[collectionName] = { error: e.message };
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json({
      ok: true,
      collections: collectionNames,
      structure: collectionStructure
    });

  } catch (error) {
    console.error('🔍 Database structure check error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      ok: false
    });
  }
}