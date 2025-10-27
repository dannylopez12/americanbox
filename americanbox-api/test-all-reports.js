const http = require('http');

let sessionCookie = '';

function makeRequest(path, method = 'GET', data = null, useSession = true) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useSession && sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(options, (res) => {
      let body = '';
      
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'][0].split(';')[0];
      }
      
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

async function testAllReportsEndpoints() {
  console.log('🧪 Testing All Reports Endpoints...\n');

  try {
    // Login first
    console.log('🔐 Logging in as admin...');
    const loginResult = await makeRequest('/api/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    }, false);
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed');
      return;
    }
    console.log('✅ Login successful\n');

    // Test all reports endpoints
    const endpoints = [
      '/api/admin/reports/packages',
      '/api/admin/reports/clients',
      '/api/admin/reports/orders/by-client?client_id=1&page=1&limit=5',
      '/api/admin/reports/orders/by-client?client_id=3&page=1&limit=5'
    ];

    for (const endpoint of endpoints) {
      console.log(`📊 Testing ${endpoint}...`);
      const result = await makeRequest(endpoint);
      
      if (result.status === 200) {
        console.log('✅ Success!');
        
        // Show record counts
        if (result.data.packages) {
          console.log(`   Records: ${result.data.packages.length} packages`);
        } else if (result.data.clients) {
          console.log(`   Records: ${result.data.clients.length} clients`);
        } else if (result.data.orders) {
          console.log(`   Records: ${result.data.orders.length} orders`);
          if (result.data.stats) {
            console.log(`   Stats: ${result.data.stats.total_orders} total orders, $${result.data.stats.total_amount} total amount`);
          }
        }
      } else {
        console.log('❌ Error:', result.status, result.data?.error || result.data);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testAllReportsEndpoints();