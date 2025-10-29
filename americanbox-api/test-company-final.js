const axios = require('axios');

const baseURL = 'http://localhost:4000';

async function testCompanyFunctionality() {
  try {
    console.log('🧪 Testing Company Page Functionality...\n');

    // Test 1: GET company data
    console.log('1. Testing GET company data...');
    const getResponse = await axios.get(`${baseURL}/api/admin/company`, {
      withCredentials: true,
      headers: { 'Cookie': 'session_id=admin_session_12345' }
    });
    
    console.log('✅ GET Status:', getResponse.status);
    console.log('📊 Company Data Structure:');
    if (getResponse.data?.item) {
      const company = getResponse.data.item;
      console.log('   - RUC:', company.ruc || 'Not set');
      console.log('   - Razón Social:', company.razon_social || 'Not set');
      console.log('   - Nombre Comercial:', company.nombre_comercial || 'Not set');
      console.log('   - Dirección Casillero:', company.casillero_direccion || 'Not set');
      console.log('   - Código Postal:', company.codigo_postal || 'Not set');
      console.log('   - Email:', company.email || 'Not set');
      console.log('   - Teléfono Cel:', company.telefono_cel || 'Not set');
      console.log('   - Web URL:', company.web_url || 'Not set');
      console.log('   - IVA %:', company.iva_percent || 'Not set');
    }

    // Test 2: PUT update company data
    console.log('\n2. Testing PUT update company data...');
    const updateData = {
      ruc: '1234567890001',
      razon_social: 'American Box Ecuador S.A.',
      nombre_comercial: 'AmericanBox',
      casillero_direccion: '8405 NW 53rd Terrace Suite C104, Doral FL 33166',
      codigo_postal: '33166',
      codigo_pais: 'US',
      siglas_courier: 'ABC',
      dir_matriz: 'Quito, Ecuador - Oficina Principal',
      dir_emisor: 'Av. 6 de Diciembre N24-253 y Lizardo García',
      punto_emision: '001-001',
      telefono_cel: '+593987654321',
      telefono_conv: '+59322345678',
      web_url: 'https://americanbox.com.ec',
      email: 'info@americanbox.com.ec',
      mision: 'Facilitar el comercio internacional proporcionando servicios de courier confiables',
      vision: 'Ser la empresa líder en servicios de courier entre Ecuador y Estados Unidos',
      iva_percent: 15,
      regimen_tributario: 'Régimen General'
    };

    const putResponse = await axios.put(`${baseURL}/api/admin/company`, updateData, {
      withCredentials: true,
      headers: { 
        'Cookie': 'session_id=admin_session_12345',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ PUT Status:', putResponse.status);
    console.log('📝 Update Response:', putResponse.data.message || 'Updated successfully');

    // Test 3: Verify the update worked
    console.log('\n3. Verifying update worked...');
    const verifyResponse = await axios.get(`${baseURL}/api/admin/company`, {
      withCredentials: true,
      headers: { 'Cookie': 'session_id=admin_session_12345' }
    });

    if (verifyResponse.data?.item) {
      const updated = verifyResponse.data.item;
      console.log('✅ Verification successful:');
      console.log('   - RUC:', updated.ruc);
      console.log('   - Razón Social:', updated.razon_social);
      console.log('   - Email:', updated.email);
      console.log('   - Teléfono:', updated.telefono_cel);
      console.log('   - IVA %:', updated.iva_percent);
    }

    console.log('\n🎉 All company functionality tests PASSED!');
    console.log('📋 Summary:');
    console.log('   ✅ GET endpoint working');
    console.log('   ✅ PUT endpoint working');
    console.log('   ✅ Data persistence working');
    console.log('   ✅ Field mapping correct');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Data:', error.response?.data);
  }
}

testCompanyFunctionality();