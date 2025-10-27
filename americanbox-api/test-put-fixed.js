// Test del endpoint PUT corregido sin updated_at
const axios = require('axios');

async function testPutOrder() {
  try {
    console.log('🧪 Testing PUT orden corregido...\n');

    // 1. Hacer login como admin
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    console.log('✅ Login exitoso');
    const cookies = loginResponse.headers['set-cookie'];

    // 2. Obtener una orden existente para actualizar
    const ordersResponse = await axios.get('http://localhost:4000/api/admin/orders', {
      headers: {
        'Cookie': cookies.join('; ')
      }
    });

    const orders = ordersResponse.data.orders;
    if (orders.length === 0) {
      console.log('❌ No hay órdenes para actualizar');
      return;
    }

    const orderToUpdate = orders[0];
    console.log('📦 Orden a actualizar:', {
      id: orderToUpdate.id,
      guide: orderToUpdate.guide,
      status: orderToUpdate.status
    });

    // 3. Actualizar la orden
    const updatedData = {
      guide: orderToUpdate.guide + '-UPDATED',
      user_id: orderToUpdate.user_id,
      address_id: orderToUpdate.address_id,
      status: 'En tránsito',
      total: 150.99
    };

    console.log('\n🔄 Datos de actualización:', updatedData);

    const updateResponse = await axios.put(
      `http://localhost:4000/api/admin/orders/${orderToUpdate.id}`, 
      updatedData,
      {
        headers: {
          'Cookie': cookies.join('; '),
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ PUT Response:', updateResponse.data);

    // 4. Verificar que se actualizó correctamente
    const verifyResponse = await axios.get(`http://localhost:4000/api/admin/orders/${orderToUpdate.id}`, {
      headers: {
        'Cookie': cookies.join('; ')
      }
    });

    console.log('\n📋 Orden después de actualización:', verifyResponse.data.order);
    
  } catch (error) {
    console.error('❌ Full Error:', error);
    if (error.response) {
      console.error('❌ Error response:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error message:', error.message);
    }
  }
}

testPutOrder();