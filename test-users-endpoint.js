const fetch = require('node-fetch');
const fs = require('fs');

const API_BASE = 'https://palevioletred-wasp-581512.hostingersite.com';

async function loginAsAdmin() {
  try {
    console.log('� Intentando login como admin...');

    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log(`📊 Login Status: ${response.status}`);

    // Guardar cookies de sesión
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      fs.writeFileSync('./session-cookies.txt', cookies);
      console.log('� Cookies de sesión guardadas');
    }

    const data = await response.json();
    console.log('📦 Respuesta login:', JSON.stringify(data, null, 2));

    return cookies;

  } catch (error) {
    console.error('❌ Error en login:', error.message);
    return null;
  }
}

async function testUsersEndpointDirect() {
  try {
    console.log('🔍 Probando endpoint /api/admin/users directamente...');

    // Crear un agente que mantenga cookies
    const https = require('https');
    const agent = new https.Agent({
      rejectUnauthorized: false // Para certificados auto-firmados si es necesario
    });

    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      agent: agent
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Content-Type: ${response.headers.get('content-type')}`);

    const data = await response.json();
    console.log('📦 Respuesta:', JSON.stringify(data, null, 2));

    if (response.status === 403) {
      console.log('🚫 Acceso denegado - El usuario no está autenticado como admin');
      console.log('💡 Solución: El usuario debe hacer login como admin en la aplicación web');
    }

  } catch (error) {
    console.error('❌ Error al probar el endpoint:', error.message);
  }
}

async function main() {
  console.log('🌐 Probando conexión con la API de Hostinger...');
  console.log(`📍 URL: ${API_BASE}`);

  // Probar el endpoint directamente (debería fallar con 403 si no hay sesión)
  await testUsersEndpointDirect();

  console.log('\n� RECOMENDACIONES:');
  console.log('1. Asegúrate de estar logueado como admin en la aplicación web');
  console.log('2. Verifica que las cookies de sesión sean válidas');
  console.log('3. Si el problema persiste, puede ser un problema de CORS entre dominios');
}

main();