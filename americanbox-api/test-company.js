const http = require('http');

function testCompanyEndpoint() {
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
      console.log('🔐 Login status:', loginRes.statusCode);
      
      if (loginResult.ok) {
        console.log('✅ Login exitoso');
        
        // Probar GET company
        console.log('\n🏢 Probando GET /api/admin/company...');
        const getReq = http.request({
          hostname: 'localhost',
          port: 4000,
          path: '/api/admin/company',
          method: 'GET',
          headers: {
            'Cookie': sessionCookie
          }
        }, (getRes) => {
          
          console.log('📋 GET Company status:', getRes.statusCode);
          
          let companyData = '';
          getRes.on('data', (chunk) => { companyData += chunk; });
          
          getRes.on('end', () => {
            if (getRes.statusCode === 200) {
              const result = JSON.parse(companyData);
              console.log('✅ GET Company funcionando');
              console.log('📊 Datos de compañía:', JSON.stringify(result, null, 2));
              
              // Probar PUT company con datos de prueba
              console.log('\n💾 Probando PUT /api/admin/company...');
              const testData = {
                ruc: '0993390119001',
                legal_name: 'TOALA MORAN JOSE ARMANDO',
                trade_name: 'AMERICAN-BOX S.A.S.',
                locker_address: '8426 NW 70TH ST MIAMI FLORIDA',
                postal_code: '33166',
                country_code: 'EC',
                courier_tag: 'ABC',
                cell_phone: '0963143856',
                phone: '982270674',
                website: 'https://www.americanboxcourier.com',
                description: 'Empresa de courier',
                mission: 'Nuestra misión es...',
                vision: 'Nuestra visión es...',
                iva_percent: 15,
                smtp_user: 'americanboxec@gmail.com',
                smtp_pass: 'password',
                smtp_host: 'smtp.gmail.com',
                smtp_port: 587
              };
              
              const putData = JSON.stringify(testData);
              
              const putReq = http.request({
                hostname: 'localhost',
                port: 4000,
                path: '/api/admin/company',
                method: 'PUT',
                headers: {
                  'Cookie': sessionCookie,
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(putData)
                }
              }, (putRes) => {
                
                console.log('📋 PUT Company status:', putRes.statusCode);
                
                let putResult = '';
                putRes.on('data', (chunk) => { putResult += chunk; });
                
                putRes.on('end', () => {
                  console.log('📋 PUT resultado:', putResult);
                  if (putRes.statusCode === 200) {
                    console.log('✅ PUT Company funcionando correctamente');
                  } else {
                    console.log('❌ Error en PUT Company');
                  }
                  process.exit(0);
                });
              });
              
              putReq.write(putData);
              putReq.end();
              
            } else {
              console.log('❌ Error en GET Company:', companyData);
              process.exit(1);
            }
          });
        });
        
        getReq.end();
      } else {
        console.log('❌ Error en login');
        process.exit(1);
      }
    });
  });

  loginReq.write(postData);
  loginReq.end();
}

testCompanyEndpoint();