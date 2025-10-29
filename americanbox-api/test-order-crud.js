const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testOrderCRUD() {
  console.log('🧪 Testing Order CRUD Operations...\n');

  try {
    // Test 1: Login como admin
    console.log('1. 🔐 Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      username: 'admin',
      password: 'password'
    });
    
    if (loginResponse.data.ok) {
      console.log('   ✅ Login successful');
    } else {
      console.log('   ❌ Login failed');
      return;
    }

    // Extraer cookie de sesión
    const sessionCookie = loginResponse.headers['set-cookie']?.[0];
    if (!sessionCookie) {
      console.log('   ❌ No session cookie received');
      return;
    }

    const axiosInstance = axios.create({
      headers: { 'Cookie': sessionCookie }
    });

    // Test 2: Create order
    console.log('\n2. 📝 Testing order creation...');
    const createData = {
      guide: `TEST${Date.now()}`,
      user_id: 1,
      status: 'Pre alerta',
      total: 25.99
    };
    
    const createResponse = await axiosInstance.post(`${BASE_URL}/api/admin/orders`, createData);
    
    if (createResponse.data.ok) {
      console.log('   ✅ Order created successfully:', createResponse.data);
      const orderId = createResponse.data.orderId;

      // Test 3: Update order
      console.log('\n3. ✏️ Testing order update...');
      const updateData = {
        guide: `UPDATED${Date.now()}`,
        user_id: 1,
        status: 'Captado en agencia',
        total: 35.99
      };

      const updateResponse = await axiosInstance.put(`${BASE_URL}/api/admin/orders/${orderId}`, updateData);
      
      if (updateResponse.data.ok) {
        console.log('   ✅ Order updated successfully:', updateResponse.data);
      } else {
        console.log('   ❌ Order update failed:', updateResponse.data.error);
      }

      // Test 4: Delete order
      console.log('\n4. 🗑️ Testing order deletion...');
      const deleteResponse = await axiosInstance.delete(`${BASE_URL}/api/admin/orders/${orderId}`);
      
      if (deleteResponse.data.ok) {
        console.log('   ✅ Order deleted successfully:', deleteResponse.data);
      } else {
        console.log('   ❌ Order deletion failed:', deleteResponse.data.error);
      }
    } else {
      console.log('   ❌ Order creation failed:', createResponse.data.error);
    }

    // Test 5: List orders to verify operations
    console.log('\n5. 📋 Testing order list...');
    const listResponse = await axiosInstance.get(`${BASE_URL}/api/admin/orders/list?limit=5`);
    
    if (listResponse.data.ok) {
      console.log('   ✅ Orders listed successfully');
      console.log('   📊 Total orders:', listResponse.data.total);
      console.log('   📦 Sample orders:');
      listResponse.data.items.slice(0, 3).forEach(order => {
        console.log(`      - ${order.guide} (${order.status}) - User: ${order.user_id}`);
      });
    } else {
      console.log('   ❌ Order list failed:', listResponse.data.error);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run tests
testOrderCRUD();