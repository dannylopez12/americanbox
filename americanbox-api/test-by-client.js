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
      
      // Capture session cookie from login
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'][0].split(';')[0];
        console.log('🍪 Session captured:', sessionCookie);
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

async function testByClientEndpoint() {
  console.log('🧪 Testing /api/admin/reports/orders/by-client...\n');

  try {
    // First, login as admin
    console.log('🔐 Logging in as admin...');
    const loginResult = await makeRequest('/api/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    }, false);
    
    console.log('Login Status:', loginResult.status);
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed, cannot test protected endpoints');
      return;
    }

    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test by-client endpoint with client_id=1
    console.log('\n📊 Testing /api/admin/reports/orders/by-client?client_id=1&page=1&limit=10...');
    const result1 = await makeRequest('/api/admin/reports/orders/by-client?client_id=1&page=1&limit=10');
    console.log('Status:', result1.status);
    
    if (result1.status === 200) {
      console.log('✅ Success! Orders:', result1.data.orders?.length || 0);
      console.log('✅ Stats:', result1.data.stats ? 'Available' : 'Missing');
      console.log('✅ Pagination:', result1.data.pagination ? 'Available' : 'Missing');
      
      if (result1.data.orders && result1.data.orders.length > 0) {
        console.log('Sample order fields:', Object.keys(result1.data.orders[0]));
      }
    } else {
      console.log('❌ Error:', result1.data);
    }

    // Test by-client endpoint with client_id=3
    console.log('\n📊 Testing /api/admin/reports/orders/by-client?client_id=3&page=1&limit=10...');
    const result2 = await makeRequest('/api/admin/reports/orders/by-client?client_id=3&page=1&limit=10');
    console.log('Status:', result2.status);
    
    if (result2.status === 200) {
      console.log('✅ Success! Orders:', result2.data.orders?.length || 0);
    } else {
      console.log('❌ Error:', result2.data);
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testByClientEndpoint();