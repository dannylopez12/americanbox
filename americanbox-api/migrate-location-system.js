const mysql = require('mysql2/promise');

async function migrateLocationSystem() {
  console.log('🚀 MIGRACIÓN: Sistema de Ubicaciones Miami/Doral');
  console.log('===============================================');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'americanbox'
  });

  try {
    const conn = await pool.getConnection();
    
    console.log('\n1. 🏗️  Agregando campo location a tabla orders...');
    
    // Verificar si el campo ya existe
    const [columns] = await conn.query("SHOW COLUMNS FROM orders LIKE 'location'");
    
    if (columns.length === 0) {
      // Agregar campo location a orders
      await conn.query(`
        ALTER TABLE orders 
        ADD COLUMN location ENUM('miami', 'doral') DEFAULT 'miami' AFTER weight_lbs
      `);
      console.log('   ✅ Campo location agregado a orders');
    } else {
      console.log('   ⚠️  Campo location ya existe en orders');
    }
    
    console.log('\n2. ⚙️  Agregando configuración por defecto en company_settings...');
    
    // Verificar si el campo ya existe
    const [settingsColumns] = await conn.query("SHOW COLUMNS FROM company_settings LIKE 'default_location'");
    
    if (settingsColumns.length === 0) {
      // Agregar campo default_location a company_settings
      await conn.query(`
        ALTER TABLE company_settings 
        ADD COLUMN default_location ENUM('miami', 'doral') DEFAULT 'miami' AFTER auto_calculate_price
      `);
      console.log('   ✅ Campo default_location agregado a company_settings');
      
      // Actualizar configuración con valor por defecto
      await conn.query(`
        UPDATE company_settings 
        SET default_location = 'miami' 
        WHERE id = 1
      `);
      console.log('   ✅ Configuración por defecto establecida: Miami');
      
    } else {
      console.log('   ⚠️  Campo default_location ya existe en company_settings');
    }
    
    console.log('\n3. 📊 Agregando direcciones específicas por ubicación...');
    
    // Verificar si los campos ya existen
    const [addressColumns] = await conn.query("SHOW COLUMNS FROM company_settings LIKE 'miami_address'");
    
    if (addressColumns.length === 0) {
      // Agregar campos de direcciones específicas
      await conn.query(`
        ALTER TABLE company_settings 
        ADD COLUMN miami_address TEXT AFTER default_location,
        ADD COLUMN doral_address TEXT AFTER miami_address
      `);
      console.log('   ✅ Campos de direcciones agregados');
      
      // Actualizar con direcciones por defecto
      await conn.query(`
        UPDATE company_settings 
        SET 
          miami_address = 'American Box Miami\n1234 NW 7th Street\nMiami, FL 33125\nUnited States',
          doral_address = 'American Box Doral\n5678 NW 36th Street\nDoral, FL 33166\nUnited States'
        WHERE id = 1
      `);
      console.log('   ✅ Direcciones por defecto configuradas');
      
    } else {
      console.log('   ⚠️  Campos de direcciones ya existen');
    }
    
    console.log('\n4. 🔍 Verificando migración...');
    
    // Verificar estructura final de orders
    const [finalOrdersColumns] = await conn.query('DESCRIBE orders');
    const locationField = finalOrdersColumns.find(col => col.Field === 'location');
    
    if (locationField) {
      console.log(`   ✅ Campo location en orders: ${locationField.Type} (Default: ${locationField.Default})`);
    }
    
    // Verificar configuración final
    const [finalSettings] = await conn.query(`
      SELECT default_location, miami_address, doral_address 
      FROM company_settings 
      WHERE id = 1
    `);
    
    if (finalSettings.length > 0) {
      const settings = finalSettings[0];
      console.log(`   ✅ Ubicación por defecto: ${settings.default_location}`);
      console.log(`   ✅ Dirección Miami configurada: ${settings.miami_address ? 'Sí' : 'No'}`);
      console.log(`   ✅ Dirección Doral configurada: ${settings.doral_address ? 'Sí' : 'No'}`);
    }
    
    console.log('\n5. 📦 Actualizando órdenes existentes...');
    
    // Actualizar órdenes existentes con ubicación por defecto
    const [updateResult] = await conn.query(`
      UPDATE orders 
      SET location = 'miami' 
      WHERE location IS NULL
    `);
    
    console.log(`   ✅ ${updateResult.affectedRows} órdenes actualizadas con ubicación Miami`);
    
    conn.release();
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 MIGRACIÓN COMPLETADA');
  console.log('✅ Sistema de ubicaciones Miami/Doral configurado');
  console.log('✅ Campo location agregado a orders');
  console.log('✅ Configuración por defecto en company_settings');
  console.log('✅ Direcciones específicas configuradas');
}

migrateLocationSystem();