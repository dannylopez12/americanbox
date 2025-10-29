const ftp = require('basic-ftp');

async function uploadServer() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('Conectando a Hostinger...');
    await client.access({
      host: '45.152.46.128',
      user: 'u582924658',
      password: '1532DAnILO-',
      port: 21
    });

    console.log('Navegando al directorio americanbox...');
    await client.cd('americanbox');

    console.log('Subiendo server-hostinger.js...');
    await client.uploadFrom('server-hostinger.js', 'server-hostinger.js');

    console.log('✅ Archivo subido exitosamente!');
    console.log('El servidor debería reiniciarse automáticamente o puedes reiniciarlo manualmente.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.close();
  }
}

uploadServer();