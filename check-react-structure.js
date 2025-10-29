const ftp = require('basic-ftp');

async function checkReactStructure() {
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

    console.log('Navegando a americanbox/americanbox-react...');
    await client.cd('americanbox/americanbox-react');

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

        if (componentsList.some(f => f.name === 'admin')) {
          console.log('Navegando a admin...');
          await client.cd('admin');

          const adminList = await client.list();
          console.log('Contenido de admin:', adminList.map(f => f.name));
        }
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.close();
  }
}

checkReactStructure();