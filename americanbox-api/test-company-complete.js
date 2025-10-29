const http = require('http');

// Test complete company functionality
async function testCompleteCompany() {
  console.log('\n=== TESTING COMPLETE COMPANY FUNCTIONALITY ===\n');

  // Test 1: GET company data
  console.log('1. Testing GET /api/admin/company...');
  try {
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/company',
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=s%3AadminSession123.abc123def456'
      }
    };

    const getResponse = await new Promise((resolve, reject) => {
      const req = http.request(getOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data),
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Response:`, JSON.stringify(getResponse.data, null, 2));
    
    if (getResponse.status === 200 && getResponse.data.ok) {
      console.log('   ✅ GET request successful');
      
      const companyData = getResponse.data.item;
      console.log('\n   Company fields available:');
      Object.keys(companyData || {}).forEach(key => {
        console.log(`     - ${key}: ${companyData[key]}`);
      });
    } else {
      console.log('   ❌ GET request failed');
      return;
    }

  } catch (error) {
    console.log('   ❌ GET Error:', error.message);
    return;
  }

  // Test 2: PUT company data
  console.log('\n2. Testing PUT /api/admin/company...');
  try {
    const updateData = {
      ruc: '1234567890001',
      razon_social: 'Test Company S.A.',
      nombre_comercial: 'Test Company',
      casillero_direccion: '123 Test Street, Miami, FL',
      codigo_postal: '33101',
      codigo_pais: 'US',
      siglas_courier: 'ABC',
      dir_matriz: 'Av. Principal 123, Quito, Ecuador',
      dir_emisor: 'Sucursal Centro',
      punto_emision: '001-001',
      telefono_cel: '+593987654321',
      telefono_conv: '+59323456789',
      web_url: 'https://testcompany.com',
      email: 'info@testcompany.com',
      mision: 'Nuestra misión es brindar el mejor servicio de courier.',
      vision: 'Ser la empresa líder en servicios de courier internacionales.',
      iva_percent: 15,
      regimen_tributario: 'General'
    };

    const putData = JSON.stringify(updateData);
    
    const putOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/company',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putData),
        'Cookie': 'connect.sid=s%3AadminSession123.abc123def456'
      }
    };

    const putResponse = await new Promise((resolve, reject) => {
      const req = http.request(putOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data),
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });
      req.on('error', reject);
      req.write(putData);
      req.end();
    });

    console.log(`   Status: ${putResponse.status}`);
    console.log(`   Response:`, JSON.stringify(putResponse.data, null, 2));
    
    if (putResponse.status === 200 && putResponse.data.ok) {
      console.log('   ✅ PUT request successful');
    } else {
      console.log('   ❌ PUT request failed');
    }

  } catch (error) {
    console.log('   ❌ PUT Error:', error.message);
  }

  // Test 3: Verify the update by getting data again
  console.log('\n3. Verifying update with another GET...');
  try {
    const verifyOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/company',
      method: 'GET',
      headers: {
        'Cookie': 'connect.sid=s%3AadminSession123.abc123def456'
      }
    };

    const verifyResponse = await new Promise((resolve, reject) => {
      const req = http.request(verifyOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: JSON.parse(data),
              headers: res.headers
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    console.log(`   Status: ${verifyResponse.status}`);
    
    if (verifyResponse.status === 200 && verifyResponse.data.ok) {
      console.log('   ✅ Verification successful');
      
      const updatedData = verifyResponse.data.item;
      console.log('\n   Updated company data:');
      console.log(`     RUC: ${updatedData.ruc}`);
      console.log(`     Razón Social: ${updatedData.razon_social}`);
      console.log(`     Email: ${updatedData.email}`);
      console.log(`     Teléfono: ${updatedData.telefono_cel}`);
      
    } else {
      console.log('   ❌ Verification failed');
    }

  } catch (error) {
    console.log('   ❌ Verification Error:', error.message);
  }

  console.log('\n=== COMPANY FUNCTIONALITY TEST COMPLETE ===\n');
}

testCompleteCompany();