const mysql = require('mysql2');

// Configuración de la base de datos
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  connectionLimit: 10
});

// Función para probar las estadísticas por estado
async function testOrderStatsByStatus() {
  try {
    const connection = pool.promise();
    
    console.log('🔍 Probando estadísticas por estado de paquetes...\n');
    
    // Consulta para ver todos los estados existentes
    const [allStatuses] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    console.log('📊 Estados actuales en la base de datos:');
    allStatuses.forEach(item => {
      console.log(`  - ${item.status}: ${item.count} paquetes`);
    });
    
    // Consulta corregida como en el servidor
    const [orderStats] = await connection.execute(`
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
    
    console.log('\n✅ Estadísticas calculadas correctamente:');
    const stats = orderStats[0];
    console.log(`  📍 Pre alerta: ${stats.prealerta}`);
    console.log(`  🏢 Captado en agencia: ${stats.captado}`);
    console.log(`  🚚 Despachado: ${stats.viajando}`);
    console.log(`  🛂 En aduana: ${stats.aduana}`);
    console.log(`  💸 En espera de pago: ${stats.esperaPago}`);
    console.log(`  ✅ Pago aprobado: ${stats.pagoOk}`);
    console.log(`  📦 Entregado: ${stats.entregado}`);
    console.log(`  📊 Total paquetes: ${stats.totalOrders}`);
    console.log(`  💰 Monto total: $${stats.totalAmount}`);
    
    // Verificación: la suma de todos los estados debe igual al total
    const sumByStatus = stats.prealerta + stats.captado + stats.viajando + 
                       stats.aduana + stats.esperaPago + stats.pagoOk + stats.entregado;
    
    console.log(`\n🔍 Verificación: ${sumByStatus} = ${stats.totalOrders} ${sumByStatus === stats.totalOrders ? '✅' : '❌'}`);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error en la consulta:', error);
    pool.end();
  }
}

testOrderStatsByStatus();