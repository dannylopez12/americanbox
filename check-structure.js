const ftp = require('basic-ftp');

async function checkStructure() {
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

    console.log('Listando directorio raíz...');
    const rootList = await client.list();
    console.log('Directorio raíz:', rootList.map(f => f.name));

    if (rootList.some(f => f.name === 'americanbox-react')) {
      console.log('Navegando a americanbox-react...');
      await client.cd('americanbox-react');

      const reactList = await client.list();
      console.log('Contenido de americanbox-react:', reactList.map(f => f.name));

      if (reactList.some(f => f.name === 'src')) {
        console.log('Navegando a src...');
        await client.cd('src');

        const srcList = await client.list();
        console.log('Contenido de src:', srcList.map(f => f.name));

        if (srcList.some(f => f.name === 'components')) {
          console.log('Navegando a components...');
          await client.cd('components');

          const componentsList = await client.list();
          console.log('Contenido de components:', componentsList.map(f => f.name));
        }
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.close();
  }
}

checkStructure();