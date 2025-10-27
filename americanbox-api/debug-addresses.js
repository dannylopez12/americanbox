const http = require('http');

function testSpecificAddresses() {
  let sessionCookie = '';
  
  const postData = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });

  // Primero hacer login
  const loginReq = http.request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (loginRes) => {
    
    if (loginRes.headers['set-cookie']) {
      sessionCookie = loginRes.headers['set-cookie'].join('; ');
    }
    
    let data = '';
    loginRes.on('data', (chunk) => { data += chunk; });
    loginRes.on('end', () => {
      const loginResult = JSON.parse(data);
      console.log('📋 Login status:', loginRes.statusCode);
      console.log('📋 Login result:', loginResult);
      
      if (loginResult.ok) {
        // Ahora probar addresses con más detalle
        const addressReq = http.request({
          hostname: 'localhost',
          port: 4000,
          path: '/api/admin/addresses?page=1&limit=3',
          method: 'GET',
          headers: {
            'Cookie': sessionCookie
          }
        }, (addressRes) => {
          
          console.log('\\n📋 Address status:', addressRes.statusCode);
          console.log('📋 Address headers:', addressRes.headers);
          
          let addressData = '';
          addressRes.on('data', (chunk) => { 
            addressData += chunk; 
            console.log('📋 Chunk recibido:', chunk.toString().substring(0, 100));
          });
          
          addressRes.on('end', () => {
            console.log('📋 Respuesta completa addresses:', addressData);
            process.exit(0);
          });
        });
        
        addressReq.on('error', (e) => {
          console.error('❌ Error en request addresses:', e);
          process.exit(1);
        });
        
        addressReq.end();
      }
    });
  });

  loginReq.write(postData);
  loginReq.end();
}

testSpecificAddresses();