const mysql = require('mysql2/promise');

async function addPricePerPoundToUsers() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();

    console.log('🔍 Verificando si existe la columna price_per_pound...');

    const [columns] = await conn.query("DESCRIBE users");
    const hasPricePerPound = columns.some(col => col.Field === 'price_per_pound');

    if (hasPricePerPound) {
      console.log('✅ La columna price_per_pound ya existe');
    } else {
      console.log('📝 Agregando columna price_per_pound...');
      await conn.query(`
        ALTER TABLE users
        ADD COLUMN price_per_pound DECIMAL(8,2) DEFAULT 0.00
        COMMENT 'Precio por libra para este usuario'
      `);
      console.log('✅ Columna price_per_pound agregada exitosamente');
    }

    // Verificar la estructura actualizada
    console.log('\n🔍 Estructura actualizada de users:');
    const [updatedColumns] = await conn.query('DESCRIBE users');
    updatedColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || ''}`);
    });

    conn.release();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addPricePerPoundToUsers();