const mysql = require('mysql2/promise');
require('dotenv').config();

async function migratePricingSystem() {
  console.log('🔧 Migrando sistema de precios personalizado...\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    connectionLimit: 10,
    charset: 'utf8mb4_unicode_ci',
  });

  try {
    const conn = await pool.getConnection();

    // 1. Agregar campo price_per_lb a tabla customers
    console.log('1. Agregando campo price_per_lb a tabla customers...');
    try {
      await conn.query(`
        ALTER TABLE customers 
        ADD COLUMN price_per_lb DECIMAL(10,2) NULL DEFAULT NULL 
        COMMENT 'Precio por libra personalizado para este cliente'
      `);
      console.log('✅ Campo price_per_lb agregado a customers');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Campo price_per_lb ya existe en customers');
      } else {
        throw error;
      }
    }

    // 2. Agregar campos de configuración de precios a company_settings
    console.log('\n2. Agregando campos de precios a company_settings...');
    try {
      await conn.query(`
        ALTER TABLE company_settings 
        ADD COLUMN default_price_per_lb DECIMAL(10,2) NULL DEFAULT 3.50 
        COMMENT 'Precio por libra por defecto para nuevos clientes'
      `);
      console.log('✅ Campo default_price_per_lb agregado a company_settings');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Campo default_price_per_lb ya existe en company_settings');
      } else {
        throw error;
      }
    }

    try {
      await conn.query(`
        ALTER TABLE company_settings 
        ADD COLUMN auto_calculate_price TINYINT(1) DEFAULT 1 
        COMMENT 'Calcular automáticamente precio = peso * precio_por_libra'
      `);
      console.log('✅ Campo auto_calculate_price agregado a company_settings');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Campo auto_calculate_price ya existe en company_settings');
      } else {
        throw error;
      }
    }

    // 3. Verificar si existe configuración, si no, crear una por defecto
    console.log('\n3. Configurando valores por defecto...');
    const [existingConfig] = await conn.query('SELECT * FROM company_settings WHERE id = 1');
    
    if (existingConfig.length === 0) {
      await conn.query(`
        INSERT INTO company_settings (
          id, default_price_per_lb, auto_calculate_price, updated_at
        ) VALUES (1, 3.50, 1, NOW())
      `);
      console.log('✅ Configuración por defecto creada (precio: $3.50/lb)');
    } else {
      await conn.query(`
        UPDATE company_settings 
        SET default_price_per_lb = COALESCE(default_price_per_lb, 3.50),
            auto_calculate_price = COALESCE(auto_calculate_price, 1),
            updated_at = NOW()
        WHERE id = 1
      `);
      console.log('✅ Configuración existente actualizada');
    }

    // 4. Agregar campo weight_lbs a tabla orders si no existe
    console.log('\n4. Verificando campo weight_lbs en orders...');
    try {
      const [orderStructure] = await conn.query('DESCRIBE orders');
      const hasWeight = orderStructure.some(col => col.Field === 'weight_lbs');
      
      if (!hasWeight) {
        await conn.query(`
          ALTER TABLE orders 
          ADD COLUMN weight_lbs DECIMAL(8,2) NULL DEFAULT NULL 
          COMMENT 'Peso del paquete en libras'
        `);
        console.log('✅ Campo weight_lbs agregado a orders');
      } else {
        console.log('✅ Campo weight_lbs ya existe en orders');
      }
    } catch (error) {
      console.log('⚠️ Error verificando weight_lbs:', error.message);
    }

    // 5. Verificar la migración
    console.log('\n5. Verificando migración...');
    const [updatedCustomers] = await conn.query('DESCRIBE customers');
    const [updatedSettings] = await conn.query('DESCRIBE company_settings');
    
    console.log('\n📋 Nuevos campos en customers:');
    updatedCustomers.forEach(col => {
      if (col.Field === 'price_per_lb') {
        console.log(`  ✅ ${col.Field}: ${col.Type} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
      }
    });

    console.log('\n📋 Nuevos campos en company_settings:');
    updatedSettings.forEach(col => {
      if (col.Field.includes('price') || col.Field.includes('calculate')) {
        console.log(`  ✅ ${col.Field}: ${col.Type} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
      }
    });

    conn.release();

    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 Sistema de precios implementado:');
    console.log('  ✅ Precios personalizados por cliente (customers.price_per_lb)');
    console.log('  ✅ Precio por defecto global (company_settings.default_price_per_lb)');
    console.log('  ✅ Cálculo automático configurable (company_settings.auto_calculate_price)');
    console.log('  ✅ Campo de peso en pedidos (orders.weight_lbs)');
    console.log('\n🎯 Próximos pasos:');
    console.log('  • Implementar lógica de cálculo automático en API');
    console.log('  • Crear interfaz admin para configurar precios');
    console.log('  • Actualizar formularios de pedidos');

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
  } finally {
    await pool.end();
  }
}

migratePricingSystem();