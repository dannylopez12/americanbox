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

async function testWithAuth() {
  console.log('🧪 Testing Reports with Authentication...\n');

  try {
    // First, login as admin
    console.log('🔐 Logging in as admin...');
    const loginResult = await makeRequest('/api/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    }, false);
    
    console.log('Login Status:', loginResult.status);
    console.log('Login Response:', loginResult.data);
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed, cannot test protected endpoints');
      return;
    }

    // Wait a moment for session to be established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test packages report
    console.log('\n📦 Testing /api/admin/reports/packages...');
    const packagesResult = await makeRequest('/api/admin/reports/packages');
    console.log('Status:', packagesResult.status);
    
    if (packagesResult.status === 200) {
      console.log('✅ Success! Records:', packagesResult.data.packages?.length || 0);
      if (packagesResult.data.packages && packagesResult.data.packages.length > 0) {
        const sample = packagesResult.data.packages[0];
        console.log('Sample package fields:', Object.keys(sample));
      }
    } else {
      console.log('❌ Error:', packagesResult.data);
    }

    // Test clients report
    console.log('\n👥 Testing /api/admin/reports/clients...');
    const clientsResult = await makeRequest('/api/admin/reports/clients');
    console.log('Status:', clientsResult.status);
    
    if (clientsResult.status === 200) {
      console.log('✅ Success! Records:', clientsResult.data.clients?.length || 0);
      if (clientsResult.data.clients && clientsResult.data.clients.length > 0) {
        const sample = clientsResult.data.clients[0];
        console.log('Sample client fields:', Object.keys(sample));
      }
    } else {
      console.log('❌ Error:', clientsResult.data);
    }

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testWithAuth();