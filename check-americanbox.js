const ftp = require('basic-ftp');

async function checkAmericanbox() {
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

    console.log('Navegando a americanbox...');
    await client.cd('americanbox');

    const americanboxList = await client.list();
    console.log('Contenido de americanbox:', americanboxList.map(f => f.name));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.close();
  }
}

checkAmericanbox();