require('dotenv').config({ path: '.env.migration' });
const mysql = require('mysql2/promise');
const { db } = require('./api/lib/firebase');

async function migrateData() {
  console.log('🚀 Iniciando migración de MySQL a Firebase...');

  let connection;
  try {
    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'americanbox',
      port: process.env.DB_PORT || 3306,
    });

    console.log('✅ Conectado a MySQL');

    // Migrar usuarios
    console.log('📦 Migrando usuarios...');
    const [users] = await connection.execute('SELECT * FROM users');
    console.log(`📊 Encontrados ${users.length} usuarios`);

    for (const user of users) {
      const userData = {
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        is_admin: user.is_admin === 1,
        role: user.role || (user.is_admin === 1 ? 'admin' : 'customer'),
        created_at: user.created_at,
        last_login: user.last_login,
        active: user.active === 1,
        // Convertir campos MySQL a Firestore
        names: user.full_name || user.username,
        mobile: user.phone,
        customer_id: user.customer_id
      };

      await db.collection('users').doc(user.id.toString()).set(userData);
      console.log(`✅ Migrado usuario: ${user.username}`);
    }

    // Migrar clientes
    console.log('📦 Migrando clientes...');
    const [customers] = await connection.execute('SELECT * FROM customers');
    console.log(`📊 Encontrados ${customers.length} clientes`);

    for (const customer of customers) {
      const customerData = {
        names: customer.names,
        email: customer.email,
        image_url: customer.image_url,
        dni: customer.dni,
        mobile: customer.mobile,
        phone: customer.phone,
        address: customer.address,
        birthdate: customer.birthdate,
        gender: customer.gender,
        identification_type: customer.identification_type,
        send_email_invoice: customer.send_email_invoice === 1,
        price_per_lb: customer.price_per_lb ? parseFloat(customer.price_per_lb) : null,
        created_at: customer.created_at,
        user_id: customer.user_id
      };

      await db.collection('customers').doc(customer.id.toString()).set(customerData);
      console.log(`✅ Migrado cliente: ${customer.names}`);
    }

    // Migrar órdenes
    console.log('📦 Migrando órdenes...');
    const [orders] = await connection.execute(`
      SELECT o.*, c.names as customer_name, c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.user_id = c.user_id
    `);
    console.log(`📊 Encontrados ${orders.length} órdenes`);

    for (const order of orders) {
      const orderData = {
        guide: order.guide,
        user_id: order.user_id,
        address_id: order.address_id,
        status: order.status,
        total: order.total ? parseFloat(order.total) : 0,
        weight_lbs: order.weight_lbs ? parseFloat(order.weight_lbs) : null,
        location: order.location,
        provider_id: order.provider_id,
        tracking_code: order.tracking_code,
        price_per_lb: order.price_per_lb ? parseFloat(order.price_per_lb) : null,
        created_at: order.created_at,
        updated_at: order.updated_at,
        // Información adicional para facilitar consultas
        client_name: order.customer_name,
        client_email: order.customer_email
      };

      await db.collection('orders').doc(order.id.toString()).set(orderData);
      console.log(`✅ Migrada orden: ${order.guide}`);
    }

    // Migrar proveedores
    console.log('📦 Migrando proveedores...');
    const [providers] = await connection.execute('SELECT * FROM providers');
    console.log(`📊 Encontrados ${providers.length} proveedores`);

    for (const provider of providers) {
      const providerData = {
        name: provider.name,
        tracking_code: provider.tracking_code,
        active: provider.active === 1,
        created_at: provider.created_at
      };

      await db.collection('providers').doc(provider.id.toString()).set(providerData);
      console.log(`✅ Migrado proveedor: ${provider.name}`);
    }

    // Migrar direcciones
    console.log('📦 Migrando direcciones...');
    const [addresses] = await connection.execute('SELECT * FROM addresses');
    console.log(`📊 Encontrados ${addresses.length} direcciones`);

    for (const address of addresses) {
      const addressData = {
        user_id: address.user_id,
        address: address.address,
        city: address.city,
        province: address.province,
        zip_code: address.zip_code,
        country: address.country,
        is_default: address.is_default === 1,
        created_at: address.created_at
      };

      await db.collection('addresses').doc(address.id.toString()).set(addressData);
    }

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Usuarios: ${users.length}`);
    console.log(`   - Clientes: ${customers.length}`);
    console.log(`   - Órdenes: ${orders.length}`);
    console.log(`   - Proveedores: ${providers.length}`);
    console.log(`   - Direcciones: ${addresses.length}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión MySQL cerrada');
    }
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateData().then(() => {
    console.log('🏁 Proceso de migración finalizado');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { migrateData };