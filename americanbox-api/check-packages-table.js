const mysql = require('mysql2/promise');

async function checkPackagesTable() {
  try {
    const db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'americanbox'
    });

    console.log('🔍 Checking packages table and related structures...\n');

    // Check if packages table exists
    try {
      const [cols] = await db.execute('DESCRIBE packages');
      console.log('✅ Packages table exists with columns:');
      cols.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
      
      // Check sample data
      const [sample] = await db.execute('SELECT COUNT(*) as count FROM packages');
      console.log(`\n📊 Total packages: ${sample[0].count}`);
      
      if (sample[0].count > 0) {
        const [firstPackage] = await db.execute('SELECT * FROM packages LIMIT 1');
        console.log('\n📦 Sample package data:');
        console.log(firstPackage[0]);
      }
    } catch (e) {
      console.log('❌ Packages table does not exist:', e.message);
      
      // Check what tables exist
      const [tables] = await db.execute('SHOW TABLES');
      console.log('\n📋 Available tables:');
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
      
      // Check if there's an orders table instead
      try {
        const [orderCols] = await db.execute('DESCRIBE orders');
        console.log('\n✅ Orders table exists with columns:');
        orderCols.forEach(col => {
          console.log(`   - ${col.Field} (${col.Type})`);
        });
        
        const [orderCount] = await db.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`\n📊 Total orders: ${orderCount[0].count}`);
      } catch (orderE) {
        console.log('\n❌ Orders table also does not exist');
      }
    }

    await db.end();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

checkPackagesTable();