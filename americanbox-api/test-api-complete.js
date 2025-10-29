const axios = require('axios');

// Configuración base
const API_URL = 'http://localhost:4000';
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Para cookies de sesión
  timeout: 10000
});

async function runFullAPITests() {
  console.log('🧪 Iniciando pruebas completas de API...\n');
  
  let sessionCookie = null;
  
  try {
    // 1. Prueba de salud básica
    console.log('1️⃣ Prueba de salud básica');
    const healthResponse = await axiosInstance.get('/api/health');
    console.log(`   ✅ Estado: ${healthResponse.status} - ${JSON.stringify(healthResponse.data)}\n`);
    
    // 2. Login como admin
    console.log('2️⃣ Login de administrador');
    const loginResponse = await axiosInstance.post('/api/login', {
      username: 'admin',
      password: 'password'
    });
    
    if (loginResponse.data.ok) {
      console.log('   ✅ Login exitoso');
      // Guardar cookies para siguientes requests
      sessionCookie = loginResponse.headers['set-cookie'];
      if (sessionCookie) {
        axiosInstance.defaults.headers.Cookie = sessionCookie.join('; ');
      }
    } else {
      throw new Error('Login falló: ' + loginResponse.data.error);
    }
    
    // 3. Probar endpoints de admin
    console.log('\n3️⃣ Probando endpoints de administración:');
    
    const adminEndpoints = [
      { name: 'Stats', url: '/api/admin/stats' },
      { name: 'Customers', url: '/api/admin/customers' },
      { name: 'Products', url: '/api/admin/products' },
      { name: 'Categories', url: '/api/admin/categories' },
      { name: 'Vouchers', url: '/api/admin/vouchers' },
      { name: 'Invoices', url: '/api/admin/invoices' },
      { name: 'Accounts Receivable', url: '/api/admin/accounts-receivable' },
      { name: 'Orders', url: '/api/admin/orders' }
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await axiosInstance.get(endpoint.url);
        const data = response.data;
        
        if (data.ok) {
          let summary = '';
          if (data.items && Array.isArray(data.items)) {
            summary = `${data.items.length} elementos`;
            if (data.total !== undefined) summary += ` (total: ${data.total})`;
          } else if (data.stats) {
            const stats = Object.keys(data.stats).map(key => `${key}: ${data.stats[key]}`).join(', ');
            summary = `stats: ${stats}`;
          } else {
            summary = 'datos recibidos';
          }
          console.log(`   ✅ ${endpoint.name}: ${summary}`);
        } else {
          console.log(`   ❌ ${endpoint.name}: ${data.error || 'Error desconocido'}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: ${error.response?.data?.error || error.message}`);
      }
    }
    
    // 4. Prueba de creación (POST)
    console.log('\n4️⃣ Probando operaciones CRUD:');
    
    // Crear nuevo customer
    try {
      const newCustomer = {
        name: 'Cliente Test API',
        email: 'test@api.com',
        phone: '555-0123',
        address: 'Calle Test 123',
        city: 'Ciudad Test',
        gender: 'other'
      };
      
      const createResponse = await axiosInstance.post('/api/admin/customers', newCustomer);
      if (createResponse.data.ok) {
        console.log(`   ✅ Crear customer: Cliente creado con ID ${createResponse.data.id}`);
        
        // Actualizar el customer recién creado
        const updateData = { ...newCustomer, name: 'Cliente Test API (Actualizado)' };
        const updateResponse = await axiosInstance.put(`/api/admin/customers/${createResponse.data.id}`, updateData);
        if (updateResponse.data.ok) {
          console.log(`   ✅ Actualizar customer: Cliente actualizado`);
        } else {
          console.log(`   ❌ Actualizar customer: ${updateResponse.data.error}`);
        }
        
        // Eliminar el customer de prueba
        const deleteResponse = await axiosInstance.delete(`/api/admin/customers/${createResponse.data.id}`);
        if (deleteResponse.data.ok) {
          console.log(`   ✅ Eliminar customer: Cliente eliminado`);
        } else {
          console.log(`   ❌ Eliminar customer: ${deleteResponse.data.error}`);
        }
      } else {
        console.log(`   ❌ Crear customer: ${createResponse.data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ CRUD customers: ${error.response?.data?.error || error.message}`);
    }
    
    // 5. Prueba de paginación
    console.log('\n5️⃣ Probando paginación:');
    try {
      const paginationResponse = await axiosInstance.get('/api/admin/customers?page=1&limit=2');
      if (paginationResponse.data.ok) {
        const { page, limit, total, pages, items } = paginationResponse.data;
        console.log(`   ✅ Paginación: Página ${page}/${pages}, ${items.length}/${total} elementos (limit: ${limit})`);
      } else {
        console.log(`   ❌ Paginación: ${paginationResponse.data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Paginación: ${error.response?.data?.error || error.message}`);
    }
    
    // 6. Prueba de búsqueda
    console.log('\n6️⃣ Probando búsqueda:');
    try {
      const searchResponse = await axiosInstance.get('/api/admin/customers?q=test');
      if (searchResponse.data.ok) {
        console.log(`   ✅ Búsqueda: ${searchResponse.data.items.length} resultados para "test"`);
      } else {
        console.log(`   ❌ Búsqueda: ${searchResponse.data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Búsqueda: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('\n🎉 Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Instalar axios si no está disponible
async function installAxiosIfNeeded() {
  try {
    require('axios');
  } catch (err) {
    console.log('📦 Instalando axios...');
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npm install axios', (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    console.log('✅ Axios instalado');
  }
}

// Ejecutar pruebas
installAxiosIfNeeded().then(() => {
  runFullAPITests();
}).catch(console.error);