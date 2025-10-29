const ftp = require('basic-ftp');

async function uploadAdminOrders() {
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

    console.log('Navegando a americanbox/americanbox-react/src/components/admin...');
    await client.cd('americanbox/americanbox-react/src/components/admin');

    console.log('Subiendo AdminOrders.tsx...');
    await client.uploadFrom('americanbox-react/src/components/admin/AdminOrders.tsx', 'AdminOrders.tsx');

    console.log('✅ Archivo AdminOrders.tsx subido exitosamente!');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.close();
  }
}

uploadAdminOrders();