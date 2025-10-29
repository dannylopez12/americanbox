const mysql = require('mysql2/promise');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 Checking database structure');

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    console.log('🔍 DB connection established');

    // Obtener todas las tablas
    const [tables] = await connection.execute("SHOW TABLES");
    console.log('🔍 Available tables:', tables.map(t => Object.values(t)[0]));

    const tableStructure = {};

    // Verificar estructura de cada tabla relevante
    const relevantTables = ['users', 'customers', 'products', 'categories', 'orders', 'addresses', 'vouchers'];

    for (const tableName of relevantTables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        tableStructure[tableName] = columns.map(col => ({
          Field: col.Field,
          Type: col.Type,
          Null: col.Null,
          Key: col.Key,
          Default: col.Default,
          Extra: col.Extra
        }));
        console.log(`🔍 ${tableName} columns:`, columns.map(c => c.Field));
      } catch (e) {
        console.log(`🔍 Table ${tableName} error:`, e.message);
        tableStructure[tableName] = { error: e.message };
      }
    }

    await connection.end();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json({
      ok: true,
      tables: tables.map(t => Object.values(t)[0]),
      structure: tableStructure
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