const http = require('http');

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3AadminTest123.test' // Simulated session
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testReportsEndpoints() {
  console.log('🧪 Testing Reports Endpoints...\n');

  try {
    // Test packages report
    console.log('📦 Testing /api/admin/reports/packages...');
    const packagesResult = await makeRequest('/api/admin/reports/packages');
    console.log('Status:', packagesResult.status);
    
    if (packagesResult.status === 200) {
      console.log('✅ Success! Records:', packagesResult.data.packages?.length || 0);
      if (packagesResult.data.packages && packagesResult.data.packages.length > 0) {
        console.log('Sample package:', JSON.stringify(packagesResult.data.packages[0], null, 2));
      }
    } else {
      console.log('❌ Error:', packagesResult.data);
    }

    console.log('\n👥 Testing /api/admin/reports/clients...');
    const clientsResult = await makeRequest('/api/admin/reports/clients');
    console.log('Status:', clientsResult.status);
    
    if (clientsResult.status === 200) {
      console.log('✅ Success! Records:', clientsResult.data.clients?.length || 0);
      if (clientsResult.data.clients && clientsResult.data.clients.length > 0) {
        console.log('Sample client:', JSON.stringify(clientsResult.data.clients[0], null, 2));
      }
    } else {
      console.log('❌ Error:', clientsResult.data);
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testReportsEndpoints();