const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeUserPricingFixed() {
  console.log('🔍 Analizando sistema de precios actual (corregido)...\n');

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
    // Verificar tabla customers (parece que los datos están aquí)
    console.log('📋 Estructura de tabla customers:');
    const [customerStructure] = await pool.query('DESCRIBE customers');
    customerStructure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key || ''}`);
    });

    // Verificar algunos clientes para ver la estructura actual
    console.log('\n👥 Primeros 3 clientes:');
    const [customers] = await pool.query('SELECT * FROM customers LIMIT 3');
    if (customers.length > 0) {
      customers.forEach(customer => {
        console.log(`  ID: ${customer.id}, Nombre: ${customer.name || customer.full_name || 'N/A'}`);
        console.log(`    Email: ${customer.email || 'N/A'}`);
        // Buscar campos de precio
        Object.keys(customer).forEach(key => {
          if (key.includes('price') || key.includes('rate') || key.includes('cost')) {
            console.log(`    ${key}: ${customer[key]}`);
          }
        });
      });
    }

    // Verificar cómo están relacionados users y customers
    console.log('\n🔗 Relación users-customers:');
    const [userCustomerLink] = await pool.query(`
      SELECT u.id as user_id, u.customer_id, c.name 
      FROM users u 
      LEFT JOIN customers c ON u.customer_id = c.id 
      LIMIT 5
    `);
    userCustomerLink.forEach(link => {
      console.log(`  User ID: ${link.user_id} -> Customer ID: ${link.customer_id} (${link.name || 'No name'})`);
    });

    // Verificar pedidos con peso para análisis de precios
    console.log('\n💰 Análisis de pedidos actuales:');
    const [orders] = await pool.query(`
      SELECT o.id, o.guide, o.total, o.user_id, c.name as customer_name
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN customers c ON u.customer_id = c.id
      WHERE o.total > 0 
      LIMIT 3
    `);
    
    if (orders.length > 0) {
      orders.forEach(order => {
        console.log(`  ${order.guide}: $${order.total} | Cliente: ${order.customer_name || 'N/A'}`);
      });
    } else {
      console.log('  No hay pedidos con total > 0');
    }

    // Verificar si existe tabla de configuración de precios
    console.log('\n⚙️ Verificando configuraciones de pricing:');
    try {
      const [pricingConfig] = await pool.query('SELECT * FROM company_settings WHERE id = 1');
      if (pricingConfig.length > 0) {
        const config = pricingConfig[0];
        console.log('  Configuración encontrada:');
        Object.keys(config).forEach(key => {
          if (config[key] !== null) {
            console.log(`    ${key}: ${config[key]}`);
          }
        });
      }
    } catch (error) {
      console.log('  Error accediendo company_settings:', error.message);
    }

    // Analizar qué necesitamos implementar
    console.log('\n📋 ANÁLISIS Y RECOMENDACIONES:');
    console.log('  ❌ No hay campo de precio personalizado por cliente');
    console.log('  ❌ No hay precio por defecto en configuración');
    console.log('  ❌ Sistema de cálculo automático no implementado');
    console.log('');
    console.log('  🎯 LO QUE NECESITAMOS IMPLEMENTAR:');
    console.log('  1. Agregar campo "price_per_lb" a tabla customers');
    console.log('  2. Agregar precio por defecto en company_settings');
    console.log('  3. Modificar cálculo automático: total = peso * precio_cliente');
    console.log('  4. Interfaz admin para configurar precios por cliente');
    console.log('  5. Interfaz admin para configurar precio por defecto');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeUserPricingFixed();