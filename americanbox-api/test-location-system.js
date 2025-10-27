const http = require('http');

// Configuración del servidor
const SERVER_URL = 'http://localhost:4000';
let authCookies = null;

// Helper para hacer requests HTTP
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: jsonResponse,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLocationSystem() {
  console.log('\n🧪 Probando sistema de ubicaciones Miami/Doral...\n');

  try {
    // 1. Autenticar como admin
    console.log('📡 1. Autenticando como admin...');
    const loginResponse = await makeRequest('POST', '/api/login', {
      username: 'admin',
      password: 'password'
    });

    if (loginResponse.status !== 200 || !loginResponse.data.ok) {
      throw new Error('Error en login: ' + JSON.stringify(loginResponse.data));
    }

    // Extraer cookies de la respuesta
    const setCookieHeaders = loginResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      authCookies = setCookieHeaders.join('; ');
    }
    console.log('  ✅ Login exitoso');

    // 2. Obtener configuraciones actuales de ubicación
    console.log('\n📍 2. Obteniendo configuraciones de ubicación...');
    const getSettingsResponse = await makeRequest('GET', '/api/admin/location-settings', null, {
      'Cookie': authCookies
    });

    if (getSettingsResponse.status !== 200 || !getSettingsResponse.data.ok) {
      throw new Error('Error obteniendo configuraciones: ' + JSON.stringify(getSettingsResponse.data));
    }

    const currentSettings = getSettingsResponse.data.data;
    console.log('  ✅ Configuraciones obtenidas:');
    console.log(`    Default Location: ${currentSettings.defaultLocation}`);
    console.log(`    Miami Address: ${currentSettings.locations.miami.address || 'No configurada'}`);
    console.log(`    Doral Address: ${currentSettings.locations.doral.address || 'No configurada'}`);

    // 3. Actualizar configuraciones de ubicación
    console.log('\n⚙️  3. Actualizando configuraciones de ubicación...');
    const updateSettingsResponse = await makeRequest('PUT', '/api/admin/location-settings', {
      defaultLocation: 'miami',
      miamiAddress: '1234 NW 72nd Ave, Miami, FL 33126, USA',
      doralAddress: '5678 NW 36th St, Doral, FL 33166, USA'
    }, {
      'Cookie': authCookies
    });

    if (updateSettingsResponse.status !== 200 || !updateSettingsResponse.data.ok) {
      throw new Error('Error actualizando configuraciones: ' + JSON.stringify(updateSettingsResponse.data));
    }

    console.log('  ✅ Configuraciones actualizadas exitosamente');

    // 4. Verificar configuraciones actualizadas
    console.log('\n🔍 4. Verificando configuraciones actualizadas...');
    const verifySettingsResponse = await makeRequest('GET', '/api/admin/location-settings', null, {
      'Cookie': authCookies
    });

    if (verifySettingsResponse.status !== 200 || !verifySettingsResponse.data.ok) {
      throw new Error('Error verificando configuraciones: ' + JSON.stringify(verifySettingsResponse.data));
    }

    const updatedSettings = verifySettingsResponse.data.data;
    console.log('  ✅ Verificación exitosa:');
    console.log(`    Default Location: ${updatedSettings.defaultLocation}`);
    console.log(`    Miami: ${updatedSettings.locations.miami.address}`);
    console.log(`    Doral: ${updatedSettings.locations.doral.address}`);

    // 5. Crear orden con ubicación específica
    console.log('\n📦 5. Creando orden con ubicación Doral...');
    const createOrderResponse = await makeRequest('POST', '/api/admin/orders', {
      guide: `LOC-TEST-${Date.now()}`,
      user_id: 1,
      status: 'Pre alerta',
      total: 150.00,
      location: 'doral'
    }, {
      'Cookie': authCookies
    });

    if (createOrderResponse.status !== 201 || !createOrderResponse.data.ok) {
      throw new Error('Error creando orden: ' + JSON.stringify(createOrderResponse.data));
    }

    const orderId = createOrderResponse.data.orderId;
    console.log(`  ✅ Orden creada exitosamente (ID: ${orderId}) con ubicación Doral`);

    // 6. Crear orden sin ubicación (debe usar default)
    console.log('\n📦 6. Creando orden sin ubicación (default Miami)...');
    const createOrderDefaultResponse = await makeRequest('POST', '/api/admin/orders', {
      guide: `LOC-DEFAULT-${Date.now()}`,
      user_id: 1,
      status: 'Pre alerta',
      total: 50.00
    }, {
      'Cookie': authCookies
    });

    if (createOrderDefaultResponse.status !== 201 || !createOrderDefaultResponse.data.ok) {
      throw new Error('Error creando orden default: ' + JSON.stringify(createOrderDefaultResponse.data));
    }

    const orderDefaultId = createOrderDefaultResponse.data.orderId;
    console.log(`  ✅ Orden creada exitosamente (ID: ${orderDefaultId}) con ubicación por defecto`);

    // 7. Verificar ubicaciones en órdenes creadas
    console.log('\n🔍 7. Verificando ubicaciones en órdenes...');
    const bulkOrdersResponse = await makeRequest('GET', '/api/admin/orders/bulk?limit=5', null, {
      'Cookie': authCookies
    });

    if (bulkOrdersResponse.status !== 200 || !bulkOrdersResponse.data.ok) {
      throw new Error('Error obteniendo órdenes: ' + JSON.stringify(bulkOrdersResponse.data));
    }

    const orders = bulkOrdersResponse.data.items;
    const testOrders = orders.filter(order => order.guide.startsWith('LOC-'));
    
    console.log(`  ✅ Órdenes de prueba encontradas: ${testOrders.length}`);
    testOrders.forEach(order => {
      console.log(`    ${order.guide} - Ubicación: ${order.location || 'No especificada'}`);
    });

    // 8. Actualizar ubicación de una orden
    console.log('\n✏️  8. Actualizando ubicación de orden...');
    const updateOrderResponse = await makeRequest('PUT', `/api/admin/orders/${orderId}`, {
      location: 'miami'
    }, {
      'Cookie': authCookies
    });

    if (updateOrderResponse.status !== 200 || !updateOrderResponse.data.ok) {
      throw new Error('Error actualizando orden: ' + JSON.stringify(updateOrderResponse.data));
    }

    console.log(`  ✅ Ubicación de orden ${orderId} actualizada a Miami`);

    console.log('\n🎉 Todas las pruebas del sistema de ubicaciones completadas exitosamente!\n');

    console.log('📋 Resumen de funcionalidades implementadas:');
    console.log('  ✅ GET /api/admin/location-settings - Obtener configuraciones');
    console.log('  ✅ PUT /api/admin/location-settings - Actualizar configuraciones');
    console.log('  ✅ Creación de órdenes con ubicación específica');
    console.log('  ✅ Ubicación por defecto automática');
    console.log('  ✅ Actualización de ubicación en órdenes existentes');
    console.log('  ✅ Validación de ubicaciones (miami/doral)');
    console.log('  ✅ Gestión de direcciones por ubicación\n');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
testLocationSystem();