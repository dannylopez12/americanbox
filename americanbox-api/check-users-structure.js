const mysql = require('mysql2/promise');

async function checkUsersStructure() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'americanbox'
    });

    console.log('🔍 Checking database structure for users...\n');

    // Check tables
    const [tables] = await db.execute('SHOW TABLES');
    console.log('📊 Available tables:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    console.log('\n📋 Users table structure:');
    const [userColumns] = await db.execute('DESCRIBE users');
    userColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `KEY: ${col.Key}` : ''}`);
    });

    console.log('\n👥 Sample users data:');
    const [users] = await db.execute('SELECT id, username, email, full_name, phone, is_admin, created_at FROM users LIMIT 5');
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, User: ${user.username}, Email: ${user.email}, Admin: ${user.is_admin ? 'Yes' : 'No'}`);
    });

    console.log('\n📈 Users count:');
    const [count] = await db.execute('SELECT COUNT(*) as total FROM users');
    console.log(`   Total users: ${count[0].total}`);

    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersStructure();