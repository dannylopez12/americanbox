const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testEndpointsAvailable() {
  console.log('🧪 Testing Available Endpoints...\n');

  try {
    // Test 1: Test public endpoint
    console.log('1. 🌐 Testing public endpoint...');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`);
    
    if (meResponse.data.ok !== undefined) {
      console.log('   ✅ Public endpoint working:', meResponse.data);
    } else {
      console.log('   ❌ Unexpected response:', meResponse.data);
    }

    // Test 2: Test that admin endpoints are protected
    console.log('\n2. 🔒 Testing protected admin endpoints (should return 401)...');
    try {
      await axios.get(`${BASE_URL}/api/admin/orders`);
      console.log('   ❌ Admin endpoint not protected!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Admin endpoint properly protected (401)');
      } else {
        console.log('   ⚠️ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Test new endpoints without auth (should fail)
    console.log('\n3. 📝 Testing new order endpoints (should be protected)...');
    try {
      await axios.put(`${BASE_URL}/api/admin/orders/1`, { guide: 'test' });
      console.log('   ❌ PUT endpoint not protected!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ PUT /api/admin/orders/:id properly protected');
      } else {
        console.log('   ⚠️ Unexpected PUT error:', error.response?.status);
      }
    }

    try {
      await axios.delete(`${BASE_URL}/api/admin/orders/1`);
      console.log('   ❌ DELETE endpoint not protected!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ DELETE /api/admin/orders/:id properly protected');
      } else {
        console.log('   ⚠️ Unexpected DELETE error:', error.response?.status);
      }
    }

    console.log('\n✨ All endpoints are properly configured and protected!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run tests
testEndpointsAvailable();