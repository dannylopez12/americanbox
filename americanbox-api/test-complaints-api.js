const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool MySQL (copiado del server.js)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci',
});

async function testComplaintsAPI() {
  console.log('🧪 Probando funcionalidad de quejas...');
  
  try {
    const conn = await pool.getConnection();
    
    try {
      // Probar consulta de quejas para admin
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
        WHERE 1=1
        ORDER BY 
          CASE 
            WHEN c.priority = 'high' THEN 1
            WHEN c.priority = 'medium' THEN 2
            WHEN c.priority = 'low' THEN 3
            ELSE 4
          END,
          c.created_at DESC
        LIMIT 5
      `);
      
      console.log('✅ Query de quejas funcional');
      console.log(`📊 Total de quejas encontradas: ${complaints.length}`);
      
      if (complaints.length > 0) {
        console.log('\n📋 Quejas actuales:');
        complaints.forEach((complaint, index) => {
          console.log(`${index + 1}. ID: ${complaint.id}`);
          console.log(`   Cliente: ${complaint.customer_name || 'N/A'}`);
          console.log(`   Asunto: ${complaint.subject}`);
          console.log(`   Estado: ${complaint.status}`);
          console.log(`   Prioridad: ${complaint.priority}`);
          console.log(`   Creada: ${complaint.created_at}`);
          if (complaint.admin_response) {
            console.log(`   Respuesta Admin: ${complaint.admin_response.substring(0, 50)}...`);
          }
          console.log('');
        });
      }
      
      // Probar estructura de la tabla complaints
      const [tableInfo] = await conn.query(`
        DESCRIBE complaints
      `);
      
      console.log('📋 Estructura de tabla complaints:');
      tableInfo.forEach(field => {
        console.log(`- ${field.Field}: ${field.Type} ${field.Null === 'YES' ? '(nullable)' : '(required)'}`);
      });
      
    } finally {
      conn.release();
    }
    
    console.log('\n✅ Pruebas de funcionalidad completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
  
  process.exit(0);
}

testComplaintsAPI();