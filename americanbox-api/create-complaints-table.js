const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'americanbox',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createComplaintsTable() {
  console.log('🏗️ Creating complaints table...');
  
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS complaints (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        order_id INT UNSIGNED NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
        admin_response TEXT NULL,
        admin_user_id INT UNSIGNED NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        resolved_at DATETIME NULL,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL,
        
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Complaints table created successfully');
    
    // Add some sample data
    console.log('🌱 Adding sample complaints...');
    
    const sampleComplaints = [
      {
        user_id: 8, // Usuario Prueba Casillero
        order_id: 25,
        subject: 'Retraso en la entrega',
        description: 'Mi paquete debería haber llegado hace 3 días y aún no tengo noticias. El tracking muestra "En proceso de entrega" desde hace una semana.',
        priority: 'medium'
      },
      {
        user_id: 1, // Danny Lopez
        subject: 'Problema con el peso del paquete',
        description: 'Me cobraron por 5 libras pero mi paquete solo pesa 3 libras según la báscula que tengo en casa. Necesito una revisión del peso.',
        priority: 'high'
      }
    ];
    
    for (const complaint of sampleComplaints) {
      await pool.query(
        'INSERT INTO complaints (user_id, order_id, subject, description, priority) VALUES (?, ?, ?, ?, ?)',
        [complaint.user_id, complaint.order_id || null, complaint.subject, complaint.description, complaint.priority]
      );
    }
    
    console.log('✅ Sample complaints added');
    
    // Show results
    const [results] = await pool.query(`
      SELECT 
        c.*,
        u.username,
        cust.names as customer_name,
        o.guide as order_guide
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN customers cust ON u.customer_id = cust.id
      LEFT JOIN orders o ON c.order_id = o.id
      ORDER BY c.created_at DESC
    `);
    
    console.log('📋 Current complaints:');
    results.forEach((complaint, i) => {
      console.log(`${i + 1}. ID: ${complaint.id}`);
      console.log(`   Cliente: ${complaint.customer_name || complaint.username}`);
      console.log(`   Asunto: ${complaint.subject}`);
      console.log(`   Estado: ${complaint.status}`);
      console.log(`   Prioridad: ${complaint.priority}`);
      console.log(`   Orden: ${complaint.order_guide || 'No especificada'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating complaints table:', error.message);
  } finally {
    await pool.end();
  }
}

createComplaintsTable();