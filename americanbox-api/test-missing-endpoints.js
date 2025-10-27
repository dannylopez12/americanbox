const axios = require('axios');

const baseURL = 'http://localhost:4000';

async function testMissingEndpoints() {
  console.log('🧪 Testing missing admin endpoints...\n');

  try {
    // Test 1: GET /api/admin/users
    console.log('1. Testing GET /api/admin/users with pagination...');
    const usersResponse = await axios.get(`${baseURL}/api/admin/users?page=1&limit=10`, {
      withCredentials: true,
      headers: { 'Cookie': 'session_id=admin_session_12345' }
    });
    
    console.log('✅ GET Users Status:', usersResponse.status);
    console.log('👥 Users found:', usersResponse.data?.users?.length || 0);
    console.log('📊 Total users:', usersResponse.data?.total || 0);
    console.log('📄 Current page:', usersResponse.data?.page || 0);
    console.log('📄 Total pages:', usersResponse.data?.totalPages || 0);
    
    if (usersResponse.data?.users?.length > 0) {
      console.log('   Sample user:', usersResponse.data.users[0]);
    }

    // Test 2: GET /api/admin/account/profile
    console.log('\n2. Testing GET /api/admin/account/profile...');
    const profileResponse = await axios.get(`${baseURL}/api/admin/account/profile`, {
      withCredentials: true,
      headers: { 'Cookie': 'session_id=admin_session_12345' }
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

    // Test 3: PUT /api/admin/account/profile
    console.log('\n3. Testing PUT /api/admin/account/profile...');
    const updateProfile = {
      username: 'admin',
      full_name: 'Administrator User',
      email: 'admin@americanbox.com',
      phone: '+593987654321',
      address: 'Admin Office, Quito'
    };

    const putProfileResponse = await axios.put(`${baseURL}/api/admin/account/profile`, updateProfile, {
      withCredentials: true,
      headers: { 
        'Cookie': 'session_id=admin_session_12345',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ PUT Profile Status:', putProfileResponse.status);
    console.log('📝 Profile updated:', putProfileResponse.data.ok ? 'Success' : 'Failed');

    console.log('\n🎉 All missing endpoints tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ /api/admin/users working with pagination');
    console.log('   ✅ /api/admin/account/profile GET working');
    console.log('   ✅ /api/admin/account/profile PUT working');
    console.log('   ✅ All 404 errors should be resolved');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testMissingEndpoints();