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

async function testUsersEndpoint() {
  console.log('🧪 Testing /api/admin/users endpoint...\n');

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

    // Test users endpoint
    console.log('👥 Testing /api/admin/users...');
    const usersResult = await makeRequest('/api/admin/users?page=1&limit=10');
    
    console.log('Status:', usersResult.status);
    
    if (usersResult.status === 200) {
      console.log('✅ Success!');
      console.log('Users found:', usersResult.data.items?.length || 0);
      console.log('Total pages:', usersResult.data.pages);
      console.log('Total users:', usersResult.data.total);
      
      if (usersResult.data.items && usersResult.data.items.length > 0) {
        console.log('\nSample user fields:', Object.keys(usersResult.data.items[0]));
        console.log('Sample user:', JSON.stringify(usersResult.data.items[0], null, 2));
      }
    } else {
      console.log('❌ Error:', usersResult.data?.error || usersResult.data);
    }

    // Test login-as endpoint
    if (usersResult.data.items && usersResult.data.items.length > 0) {
      const firstUser = usersResult.data.items[0];
      console.log(`\n🔄 Testing login-as for user: ${firstUser.names || firstUser.username}...`);
      
      const loginAsResult = await makeRequest(`/api/admin/users/${firstUser.id}/login-as`, 'POST');
      console.log('Login-as Status:', loginAsResult.status);
      
      if (loginAsResult.status === 200) {
        console.log('✅ Login-as Success!');
        console.log('Redirect:', loginAsResult.data.redirect);
        console.log('Message:', loginAsResult.data.message);
      } else {
        console.log('❌ Login-as Error:', loginAsResult.data?.error || loginAsResult.data);
      }
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

testUsersEndpoint();