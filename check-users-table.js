const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env.local' });

async function checkUsersTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });

    const [columns] = await connection.execute('DESCRIBE users');
    console.log('Users table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
    });

    await connection.end();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

checkUsersTable();