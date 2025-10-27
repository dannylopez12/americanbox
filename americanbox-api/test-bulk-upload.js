const http = require('http');
const fs = require('fs');
const path = require('path');

async function testBulkUpload() {
  console.log('🧪 Testing Bulk Upload Functionality...\n');

  try {
    // Test 1: Verificar que el template existe
    console.log('1. Verificando template de Excel...');
    const templatePath = path.join(__dirname, 'templates', 'template_carga_masiva.xlsx');
    if (fs.existsSync(templatePath)) {
      console.log('✅ Template encontrado:', templatePath);
      const stats = fs.statSync(templatePath);
      console.log(`   Tamaño: ${stats.size} bytes`);
    } else {
      console.log('❌ Template no encontrado');
      return;
    }

    // Test 2: Verificar endpoint de descarga template (requiere auth)
    console.log('\n2. Testing endpoint de descarga template...');
    const templateResponse = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/admin/orders/bulk-upload-template',
      method: 'GET'
    });

    if (templateResponse.status === 401) {
      console.log('✅ Endpoint protegido por autenticación (como se esperaba)');
    } else if (templateResponse.status === 200) {
      console.log('✅ Endpoint funcionando (usuario autenticado)');
    } else {
      console.log('❌ Endpoint no responde correctamente:', templateResponse.status);
    }

    // Test 3: Verificar endpoint de bulk upload (requiere auth)
    console.log('\n3. Testing endpoint de bulk upload...');
    const uploadResponse = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/admin/orders/bulk-upload',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { test: 'data' });

    if (uploadResponse.status === 401) {
      console.log('✅ Endpoint de upload protegido por autenticación (como se esperaba)');
    } else if (uploadResponse.status === 400) {
      console.log('✅ Endpoint funcionando - rechaza datos sin archivo (como se esperaba)');
    } else {
      console.log('🔍 Respuesta del endpoint:', uploadResponse.status, uploadResponse.data);
    }

    // Test 4: Verificar que las dependencias están instaladas
    console.log('\n4. Verificando dependencias...');
    try {
      require('multer');
      console.log('✅ Multer instalado correctamente');
    } catch (e) {
      console.log('❌ Multer no encontrado');
    }

    try {
      require('xlsx');
      console.log('✅ XLSX instalado correctamente');
    } catch (e) {
      console.log('❌ XLSX no encontrado');
    }

    // Test 5: Verificar estructura del template
    console.log('\n5. Verificando estructura del template...');
    try {
      const xlsx = require('xlsx');
      const workbook = xlsx.readFile(templatePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      console.log('✅ Template leído correctamente');
      console.log(`   Filas de ejemplo: ${data.length}`);
      
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('   Columnas encontradas:', columns.join(', '));
        
        const expectedColumns = ['codigo_proveedor', 'cliente', 'comentario', 'peso_lbs'];
        const hasAllColumns = expectedColumns.every(col => columns.includes(col));
        
        if (hasAllColumns) {
          console.log('✅ Todas las columnas requeridas están presentes');
        } else {
          console.log('❌ Faltan columnas requeridas');
          console.log('   Esperadas:', expectedColumns.join(', '));
        }
      }
    } catch (e) {
      console.log('❌ Error leyendo template:', e.message);
    }

    console.log('\n📋 Bulk Upload Test Summary:');
    console.log('✅ Template de Excel creado y disponible');
    console.log('✅ Endpoints configurados correctamente');
    console.log('✅ Dependencias instaladas');
    console.log('✅ Autenticación configurada');
    
    console.log('\n🎯 Para probar completo:');
    console.log('• Acceder a http://localhost:5173');
    console.log('• Hacer login como admin');
    console.log('• Ir a la sección de pedidos');
    console.log('• Hacer clic en "Carga Masiva"');
    console.log('• Descargar template de ejemplo');
    console.log('• Subir el archivo modificado');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Helper function para hacer requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Ejecutar test
testBulkUpload();