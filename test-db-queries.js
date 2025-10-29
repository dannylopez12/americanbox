const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env.hostinger' });

async function testEndpoints() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    console.log('🔍 Testing database queries...\n');

    // Test 1: Users table
    try {
      console.log('1. Testing users table...');
      const [users] = await connection.execute(`
        SELECT id, username, name, is_admin, created_at, last_login, active
        FROM users LIMIT 1
      `);
      console.log('✅ Users query OK, found:', users.length, 'records');
    } catch (e) {
      console.log('❌ Users query FAILED:', e.message);
    }

    // Test 2: Orders table structure
    try {
      console.log('\n2. Testing orders table structure...');
      const [columns] = await connection.execute('DESCRIBE orders');
      console.log('Orders columns:', columns.map(c => c.Field));
    } catch (e) {
      console.log('❌ Orders DESCRIBE FAILED:', e.message);
    }

    // Test 3: Orders query
    try {
      console.log('\n3. Testing orders query...');
      const [orders] = await connection.execute(`
        SELECT o.id, o.tracking_number, o.status, o.total_amount, o.created_at,
               c.name as customer_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC LIMIT 1
      `);
      console.log('✅ Orders query OK, found:', orders.length, 'records');
    } catch (e) {
      console.log('❌ Orders query FAILED:', e.message);
    }

    // Test 4: Revenue query
    try {
      console.log('\n4. Testing revenue query...');
      const [revenue] = await connection.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
               SUM(total_amount) as revenue, COUNT(*) as orders_count
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC LIMIT 1
      `);
      console.log('✅ Revenue query OK, found:', revenue.length, 'records');
    } catch (e) {
      console.log('❌ Revenue query FAILED:', e.message);
    }

    // Test 5: Vouchers table
    try {
      console.log('\n5. Testing vouchers table...');
      const [vouchers] = await connection.execute(`
        SELECT id, code, discount_type, discount_value, usage_limit, used_count, created_at, active
        FROM vouchers LIMIT 1
      `);
      console.log('✅ Vouchers query OK, found:', vouchers.length, 'records');
    } catch (e) {
      console.log('❌ Vouchers query FAILED:', e.message);
    }

    await connection.end();
    console.log('\n🔍 Testing completed!');

  } catch (e) {
    console.error('❌ Connection error:', e.message);
  }
}

testEndpoints();