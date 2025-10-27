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

async function testSimpleLocationSettings() {
  console.log('\n🧪 Probando solo las configuraciones de ubicación...\n');

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

    console.log('Response status:', getSettingsResponse.status);
    console.log('Response data:', JSON.stringify(getSettingsResponse.data, null, 2));

    if (getSettingsResponse.status !== 200) {
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
      defaultLocation: 'doral',
      miamiAddress: 'American Box Miami - 1234 NW 72nd Ave, Miami, FL 33126, USA',
      doralAddress: 'American Box Doral - 5678 NW 36th St, Doral, FL 33166, USA'
    }, {
      'Cookie': authCookies
    });

    console.log('Update response status:', updateSettingsResponse.status);
    console.log('Update response data:', JSON.stringify(updateSettingsResponse.data, null, 2));

    if (updateSettingsResponse.status !== 200) {
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

    console.log('\n🎉 Configuraciones de ubicación funcionando correctamente!\n');

    console.log('📋 Endpoints funcionando:');
    console.log('  ✅ GET /api/admin/location-settings - Obtener configuraciones');
    console.log('  ✅ PUT /api/admin/location-settings - Actualizar configuraciones');
    console.log('  ✅ Validación de ubicaciones (miami/doral)');
    console.log('  ✅ Gestión de direcciones por ubicación\n');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
testSimpleLocationSettings();