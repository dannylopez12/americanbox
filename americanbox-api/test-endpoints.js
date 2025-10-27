const http = require('http');

// Test completo del sistema
const postData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let data = '';
  loginRes.on('data', (chunk) => { data += chunk; });
  loginRes.on('end', () => {
    const loginResult = JSON.parse(data);
    if (loginResult.ok && loginResult.token) {
      console.log('✅ Login exitoso con token:', loginResult.token.substring(0, 20) + '...');
      
      // Probar endpoint de addresses
      console.log('\n📋 Probando endpoint de addresses...');
      const addressOptions = {
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/addresses?page=1&limit=3',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + loginResult.token
        }
      };
      
      const addressReq = http.request(addressOptions, (addressRes) => {
        let addressData = '';
        addressRes.on('data', (chunk) => { addressData += chunk; });
        addressRes.on('end', () => {
          console.log('Status addresses:', addressRes.statusCode);
          if (addressRes.statusCode === 200) {
            console.log('✅ Endpoint addresses funcionando correctamente');
            const result = JSON.parse(addressData);
            console.log('Total addresses:', result.pagination?.total || 0);
          } else {
            console.log('❌ Error en addresses:', addressData);
          }
          
          // Ahora probar print-label
          console.log('\n🏷️ Probando print-label para orden 25...');
          const printOptions = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/admin/orders/25/print-label',
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + loginResult.token
            }
          };
          
          const printReq = http.request(printOptions, (printRes) => {
            let printData = '';
            printRes.on('data', (chunk) => { printData += chunk; });
            printRes.on('end', () => {
              console.log('Status print-label:', printRes.statusCode);
              if (printRes.statusCode === 200) {
                console.log('✅ Print-label funcionando correctamente');
                console.log('Tipo de contenido:', printRes.headers['content-type']);
                console.log('Longitud del HTML:', printData.length, 'caracteres');
              } else {
                console.log('❌ Error en print-label:', printData);
              }
              process.exit(0);
            });
          });
          
          printReq.on('error', (e) => {
            console.error('❌ Error en print-label:', e);
            process.exit(1);
          });
          
          printReq.end();
        });
      });
      
      addressReq.on('error', (e) => {
        console.error('❌ Error en addresses:', e);
        process.exit(1);
      });
      
      addressReq.end();
      
    } else {
      console.error('❌ Error en login:', loginResult);
      process.exit(1);
    }
  });
});

loginReq.on('error', (e) => {
  console.error('❌ Error conectando:', e);
  process.exit(1);
});

loginReq.write(postData);
loginReq.end();