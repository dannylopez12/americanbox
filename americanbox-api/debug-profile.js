const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function debugProfile() {
  console.log('🔍 Debugging client profile endpoint...');
  
  try {
    const conn = await pool.getConnection();
    
    try {
      // First check the user exists and has customer_id
      console.log('\n1. Verificando usuario y customer_id...');
      const [users] = await conn.query('SELECT * FROM users WHERE username = ?', ['Dannyadmin1']);
      console.log('Usuario encontrado:', users[0]);
      
      if (!users[0]) {
        console.log('❌ Usuario no encontrado');
        return;
      }
      
      const userId = users[0].id;
      const customerId = users[0].customer_id;
      
      console.log(`\n2. Buscando datos del cliente (customer_id: ${customerId})...`);
      const [customers] = await conn.query('SELECT * FROM customers WHERE id = ?', [customerId]);
      console.log('Cliente encontrado:', customers[0]);
      
      console.log('\n3. Probando la consulta completa del perfil...');
      const [profileQuery] = await conn.query(`
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
      
      console.log('Resultado de la consulta:', profileQuery[0]);
      
      console.log('\n4. Probando consulta de direcciones...');
      const [addresses] = await conn.query(`
        SELECT id, address, city
        FROM addresses  
        WHERE user_id = ?
      `, [userId]);
      
      console.log('Direcciones encontradas:', addresses);
      
      console.log('\n✅ Todo parece correcto en las consultas individuales');
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

debugProfile();