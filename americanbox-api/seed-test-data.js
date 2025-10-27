const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedTestData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME,
      charset: 'utf8mb4_unicode_ci',
    });

    console.log('🌱 Creando datos de prueba...\n');
    
    // 1. Agregar facturas de prueba
    console.log('📄 Agregando facturas...');
    const invoices = [
      {
        number: 'FAC-001-001-000001',
        client_name: 'Empresa ABC S.A.',
        register_date: '2025-01-15',
        due_date: '2025-02-15',
        subtotal: 1200.00,
        iva: 144.00,
        discount: 50.00,
        total: 1294.00
      },
      {
        number: 'FAC-001-001-000002',
        client_name: 'Distribuidora XYZ Ltda.',
        register_date: '2025-01-16',
        due_date: '2025-02-16',
        subtotal: 2500.00,
        iva: 300.00,
        discount: 0.00,
        total: 2800.00
      },
      {
        number: 'FAC-001-001-000003',
        client_name: 'Comercial 123 C.A.',
        register_date: '2025-01-17',
        due_date: '2025-02-17',
        subtotal: 850.00,
        iva: 102.00,
        discount: 25.00,
        total: 927.00
      },
      {
        number: 'FAC-001-001-000004',
        client_name: 'Inversiones Beta',
        register_date: '2025-01-18',
        due_date: '2025-02-18',
        subtotal: 3200.00,
        iva: 384.00,
        discount: 100.00,
        total: 3484.00
      },
      {
        number: 'FAC-001-001-000005',
        client_name: 'Grupo Gamma Ltda.',
        register_date: '2025-01-19',
        due_date: '2025-02-19',
        subtotal: 1750.00,
        iva: 210.00,
        discount: 75.00,
        total: 1885.00
      }
    ];

    for (const invoice of invoices) {
      await connection.execute(`
        INSERT INTO invoices (number, client_name, register_date, due_date, subtotal, iva, discount, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id
      `, [invoice.number, invoice.client_name, invoice.register_date, invoice.due_date, 
          invoice.subtotal, invoice.iva, invoice.discount, invoice.total]);
    }
    console.log(`  ✅ ${invoices.length} facturas agregadas`);

    // 2. Agregar cuentas por cobrar
    console.log('\n💰 Agregando cuentas por cobrar...');
    const accountsReceivable = [
      {
        client_name: 'Empresa ABC S.A.',
        invoice_number: 'FAC-001-001-000001',
        debt: 1294.00,
        balance: 1294.00,
        sale_date: '2025-01-15',
        due_date: '2025-02-15',
        status: 'pending'
      },
      {
        client_name: 'Distribuidora XYZ Ltda.',
        invoice_number: 'FAC-001-001-000002',
        debt: 2800.00,
        balance: 2800.00,
        sale_date: '2025-01-16',
        due_date: '2025-02-16',
        status: 'overdue'
      },
      {
        client_name: 'Comercial 123 C.A.',
        invoice_number: 'FAC-001-001-000003',
        debt: 927.00,
        balance: 0.00,
        sale_date: '2025-01-17',
        due_date: '2025-02-17',
        status: 'paid'
      },
      {
        client_name: 'Inversiones Beta',
        invoice_number: 'FAC-001-001-000004',
        debt: 3484.00,
        balance: 1984.00,
        sale_date: '2025-01-18',
        due_date: '2025-02-18',
        status: 'partial'
      },
      {
        client_name: 'Grupo Gamma Ltda.',
        invoice_number: 'FAC-001-001-000005',
        debt: 1885.00,
        balance: 1885.00,
        sale_date: '2025-01-19',
        due_date: '2025-02-19',
        status: 'pending'
      }
    ];

    for (const ar of accountsReceivable) {
      await connection.execute(`
        INSERT INTO accounts_receivable (client_name, invoice_number, debt, balance, sale_date, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id=id
      `, [ar.client_name, ar.invoice_number, ar.debt, ar.balance, ar.sale_date, ar.due_date, ar.status]);
    }
    console.log(`  ✅ ${accountsReceivable.length} cuentas por cobrar agregadas`);

    // 3. Agregar más productos si es necesario
    console.log('\n📦 Verificando productos...');
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (productCount[0].count < 10) {
      const additionalProducts = [
        { name: 'Smartphone Galaxy S25', price: 899.99, category_id: 1 },
        { name: 'Laptop Gaming RTX 5080', price: 2499.99, category_id: 1 },
        { name: 'Auriculares Bluetooth Pro', price: 299.99, category_id: 1 },
        { name: 'Tablet 12" 5G', price: 699.99, category_id: 1 },
        { name: 'Smartwatch Ultra', price: 599.99, category_id: 1 }
      ];

      for (const product of additionalProducts) {
        await connection.execute(`
          INSERT INTO products (name, price, category_id)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id
        `, [product.name, product.price, product.category_id]);
      }
      console.log(`  ✅ ${additionalProducts.length} productos adicionales agregados`);
    } else {
      console.log('  ℹ️  Ya hay suficientes productos');
    }

    // 4. Verificar resultados finales
    console.log('\n📊 Estado final de las tablas:');
    const tablesToCheck = ['customers', 'products', 'categories', 'vouchers', 'invoices', 'accounts_receivable'];
    
    for (const table of tablesToCheck) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${rows[0].count} registros`);
    }

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedTestData();