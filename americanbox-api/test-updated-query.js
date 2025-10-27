const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

// Función para probar la consulta actualizada
async function testUpdatedOrdersQuery() {
  try {
    const connection = pool.promise();
    
    // Probar la consulta actualizada
    const [rows] = await connection.execute(`
      SELECT 
        o.id,
        o.guide,
        'N/A' as provider_code,
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
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    console.log('✅ Consulta actualizada exitosa');
    console.log(`📊 Encontrados ${rows.length} pedidos`);
    
    if (rows.length > 0) {
      console.log('\n🔍 Primeros pedidos:');
      rows.forEach((order, index) => {
        console.log(`${index + 1}. ${order.guide} - ${order.client} - ${order.status} - $${order.total}`);
      });
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error en la consulta:', error);
    pool.end();
  }
}

testUpdatedOrdersQuery();