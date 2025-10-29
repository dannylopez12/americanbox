const fs = require('fs');
const path = require('path');

function checkMigrationReadiness() {
  console.log('🔍 Verificando preparación para migración...\n');

  const checks = [
    {
      name: 'Archivo .env.migration',
      check: () => fs.existsSync('.env.migration'),
      message: '❌ Falta .env.migration - ejecuta: npm run setup-firebase'
    },
    {
      name: 'Dependencias Firebase',
      check: () => {
        try {
          require('firebase-admin');
          return true;
        } catch {
          return false;
        }
      },
      message: '❌ Falta firebase-admin - ejecuta: npm install'
    },
    {
      name: 'Dependencias MySQL',
      check: () => {
        try {
          require('mysql2');
          return true;
        } catch {
          return false;
        }
      },
      message: '❌ Falta mysql2 - ejecuta: npm install'
    },
    {
      name: 'Script de migración',
      check: () => fs.existsSync('migrate-to-firebase.js'),
      message: '❌ Falta migrate-to-firebase.js'
    },
    {
      name: 'Script de prueba Firebase',
      check: () => fs.existsSync('test-firebase.js'),
      message: '❌ Falta test-firebase.js'
    }
  ];

  let allGood = true;

  checks.forEach(({ name, check, message }) => {
    const result = check();
    if (result) {
      console.log(`✅ ${name}: OK`);
    } else {
      console.log(`❌ ${name}: FALLÓ`);
      console.log(`   ${message}`);
      allGood = false;
    }
  });

  console.log('\n' + '='.repeat(50));

  if (allGood) {
    console.log('🎉 ¡Todo está listo para la migración!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. npm run test-firebase  # Probar conexión');
    console.log('2. npm run migrate        # Migrar datos');
    console.log('3. Configurar Vercel      # Variables de entorno');
  } else {
    console.log('⚠️  Corrige los problemas antes de continuar.');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  checkMigrationReadiness();
}

module.exports = { checkMigrationReadiness };