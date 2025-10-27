const axios = require('axios');

const baseURL = 'http://localhost:4000';

async function testEndpointsWithAuth() {
  try {
    console.log('🔐 Logging in as admin first...\n');
    
    // Login first
    const loginResponse = await axios.post(`${baseURL}/api/login`, {
      username: 'admin',
      password: 'admin123'
    }, { withCredentials: true });

    console.log('Login Status:', loginResponse.status);
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    console.log('🧪 Testing endpoints with proper authentication...\n');

    // Test 1: GET /api/admin/users
    console.log('1. Testing GET /api/admin/users with pagination...');
    const usersResponse = await axios.get(`${baseURL}/api/admin/users?page=1&limit=10`, {
      withCredentials: true,
      headers: { 'Cookie': cookieHeader }
    });
    
    console.log('✅ GET Users Status:', usersResponse.status);
    console.log('👥 Users found:', usersResponse.data?.users?.length || 0);
    console.log('📊 Total users:', usersResponse.data?.total || 0);
    
    if (usersResponse.data?.users?.length > 0) {
      console.log('   Sample user:');
      const user = usersResponse.data.users[0];
      console.log('     - ID:', user.id);
      console.log('     - Username:', user.username);
      console.log('     - Role:', user.role);
      console.log('     - Full name:', user.full_name);
      console.log('     - Email:', user.email);
    }

    // Test 2: GET /api/admin/account/profile
    console.log('\n2. Testing GET /api/admin/account/profile...');
    const profileResponse = await axios.get(`${baseURL}/api/admin/account/profile`, {
      withCredentials: true,
      headers: { 'Cookie': cookieHeader }
    });
    
    console.log('✅ GET Profile Status:', profileResponse.status);
    if (profileResponse.data?.profile) {
      console.log('👤 Admin profile:');
      console.log('   - Username:', profileResponse.data.profile.username);
      console.log('   - Full name:', profileResponse.data.profile.full_name);
      console.log('   - Email:', profileResponse.data.profile.email);
      console.log('   - Role:', profileResponse.data.profile.role);
      console.log('   - Is Admin:', profileResponse.data.profile.is_admin);
    }

    // Test 3: Test other existing endpoints to make sure they still work
    console.log('\n3. Testing existing endpoints still work...');
    const statsResponse = await axios.get(`${baseURL}/api/admin/stats`, {
      withCredentials: true,
      headers: { 'Cookie': cookieHeader }
    });
    
    console.log('✅ GET Stats Status:', statsResponse.status);
    console.log('📊 Stats working:', statsResponse.data?.ok ? 'Yes' : 'No');

    console.log('\n🎉 All endpoints working correctly!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Authentication working');
    console.log('   ✅ /api/admin/users endpoint added successfully');
    console.log('   ✅ /api/admin/account/profile endpoint added successfully');
    console.log('   ✅ Existing endpoints still functional');
    console.log('   ✅ 404 errors resolved');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
      console.error('404 Error - Endpoint not found');
    } else if (error.response?.status === 403) {
      console.error('403 Error - Authentication issue');
    }
  }
}

testEndpointsWithAuth();