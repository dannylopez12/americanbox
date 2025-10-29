const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

// Función para probar la consulta de pedidos
async function testOrdersQuery() {
  try {
    const connection = pool.promise();
    
    const [rows] = await connection.execute(`
      SELECT 
        o.id,
        o.guide,
        o.provider_code,
        COALESCE(c.name, c.email, 'N/A') as client,
        o.register_date,
        o.comment,
        o.weight_lbs,
        o.status,
        o.total
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      ORDER BY o.register_date DESC
      LIMIT 25
    `);

    console.log('✅ Consulta de pedidos exitosa');
    console.log(`📊 Encontrados ${rows.length} pedidos`);
    
    if (rows.length > 0) {
      console.log('\n🔍 Primer pedido:');
      console.log(JSON.stringify(rows[0], null, 2));
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error en la consulta:', error);
    pool.end();
  }
}

testOrdersQuery();