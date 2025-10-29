import ftp from 'basic-ftp';

async function checkLocation() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: '45.152.46.128',
            user: 'u582924658',
            password: '1532DAnILO-',
            secure: false
        });

        // Verificar domains/
        console.log('\n📁 Verificando /domains/...');
        try {
            await client.cd('/domains');
            const domainsList = await client.list();
            console.log('Dominios encontrados:');
            domainsList.forEach(item => {
                if (item.isDirectory) console.log(`  📁 ${item.name}`);
            });

            // Buscar el dominio del sitio
            const siteDomain = domainsList.find(item =>
                item.name.includes('palevioletred') ||
                item.name.includes('hostingersite')
            );

            if (siteDomain) {
                console.log(`\n✅ Encontrado: ${siteDomain.name}`);
                await client.cd(siteDomain.name);

                // Buscar public_html
                const siteList = await client.list();
                const publicHtml = siteList.find(item => item.name === 'public_html');

                if (publicHtml) {
                    console.log('✅ Encontrado public_html/');
                    await client.cd('public_html');
                    const htmlList = await client.list();
                    console.log('\nContenido de public_html:');
                    htmlList.forEach(item => {
                        console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`);
                    });
                }
            }
        } catch (e) {
            console.log('No se pudo acceder a /domains:', e.message);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.close();
    }
}

checkLocation();
