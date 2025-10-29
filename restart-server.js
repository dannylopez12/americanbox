const { spawn } = require('child_process');

// Script para reiniciar el servidor en Hostinger
console.log('🔄 Intentando reiniciar el servidor...');

// En Hostinger, el servidor probablemente se ejecuta con PM2
// Vamos a intentar reiniciar usando PM2
const pm2Restart = spawn('pm2', ['restart', 'americanbox'], {
  stdio: 'inherit',
  shell: true
});

pm2Restart.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Servidor reiniciado exitosamente con PM2');
  } else {
    console.log('⚠️  No se pudo reiniciar con PM2, intentando método alternativo...');

    // Método alternativo: matar procesos de node y reiniciar
    const killNode = spawn('pkill', ['-f', 'node'], {
      stdio: 'inherit',
      shell: true
    });

    killNode.on('close', () => {
      console.log('🔄 Reiniciando servidor...');
      const startServer = spawn('node', ['server-hostinger.js'], {
        detached: true,
        stdio: 'ignore'
      });

      startServer.unref();
      console.log('✅ Servidor reiniciado');
    });
  }
});

pm2Restart.on('error', () => {
  console.log('⚠️  PM2 no disponible, intentando método alternativo...');

  // Método alternativo directo
  const killNode = spawn('pkill', ['-f', 'node'], {
    stdio: 'inherit',
    shell: true
  });

  killNode.on('close', () => {
    console.log('🔄 Reiniciando servidor...');
    const startServer = spawn('node', ['server-hostinger.js'], {
      detached: true,
      stdio: 'ignore'
    });

    startServer.unref();
    console.log('✅ Servidor reiniciado');
  });
});