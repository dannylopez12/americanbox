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

async function testRedirects() {
  console.log('🧪 Testing Redirect URLs for different user types...\n');

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

    // Get all users
    const usersResult = await makeRequest('/api/admin/users?page=1&limit=20');
    
    if (usersResult.status === 200 && usersResult.data.items) {
      const adminUsers = usersResult.data.items.filter(u => u.role === 'admin');
      const customerUsers = usersResult.data.items.filter(u => u.role === 'customer');
      
      console.log(`Found ${adminUsers.length} admin users and ${customerUsers.length} customer users\n`);
      
      // Test admin redirect
      if (adminUsers.length > 0) {
        const adminUser = adminUsers[0];
        console.log(`🔄 Testing admin redirect for: ${adminUser.names || adminUser.username}...`);
        
        const adminLoginResult = await makeRequest(`/api/admin/users/${adminUser.id}/login-as`, 'POST');
        if (adminLoginResult.status === 200) {
          console.log('✅ Admin redirect:', adminLoginResult.data.redirect);
          console.log('   Expected: /dashboard');
          console.log('   Match:', adminLoginResult.data.redirect === '/dashboard' ? '✅' : '❌');
        }
        console.log('');
      }
      
      // Test customer redirect  
      if (customerUsers.length > 0) {
        const customerUser = customerUsers[0];
        console.log(`🔄 Testing customer redirect for: ${customerUser.names || customerUser.username}...`);
        
        const customerLoginResult = await makeRequest(`/api/admin/users/${customerUser.id}/login-as`, 'POST');
        if (customerLoginResult.status === 200) {
          console.log('✅ Customer redirect:', customerLoginResult.data.redirect);
          console.log('   Expected: /client');
          console.log('   Match:', customerLoginResult.data.redirect === '/client' ? '✅' : '❌');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing redirects:', error.message);
  }
}

testRedirects();