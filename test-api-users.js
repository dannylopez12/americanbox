const https = require('https');

// Función para hacer una petición GET con cookies
function makeRequest(url, cookies = '') {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Cookie': cookies
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testAPI() {
  console.log('🔍 Probando API de usuarios...\n');

  try {
    // Primero intentamos sin cookies (debería fallar con 403)
    console.log('1. Probando sin autenticación:');
    const response1 = await makeRequest('https://palevioletred-wasp-581512.hostingersite.com/api/admin/users');
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(response1.data, null, 2));
    console.log('');

    // Si hay cookies en el navegador, el usuario podría proporcionarlas
    console.log('2. Para probar con autenticación, necesitas:');
    console.log('   - Abrir el navegador en tu sitio');
    console.log('   - Loguearte como admin');
    console.log('   - Abrir DevTools (F12)');
    console.log('   - Ir a Application > Cookies');
    console.log('   - Copiar el valor de la cookie de sesión');
    console.log('   - Pegarlo aquí para probar');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();