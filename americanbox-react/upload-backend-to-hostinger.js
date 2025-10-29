import ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadBackend() {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log('🔗 Conectando a Hostinger...');
        await client.access({
            host: '45.152.46.128',
            user: 'u582924658',
            password: '1532DAnILO-',
            secure: false
        });

        console.log('✅ Conectado exitosamente!\n');

        // Verificar que existe la carpeta americanbox/americanbox-api/
        console.log('📁 Verificando estructura del backend...');

        try {
            await client.cd('americanbox/americanbox-api');
            const apiList = await client.list();
            console.log('✅ Encontrada carpeta americanbox/americanbox-api/');
            console.log('Contenido actual:');
            apiList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));
        } catch (e) {
            console.log('❌ Error: No se encontró la carpeta americanbox/americanbox-api/');
            console.log('Asegúrate de que el backend esté desplegado correctamente.');
            throw e;
        }

        // Subir server.js
        console.log('\n📤 Subiendo server.js...');
        const localServerPath = path.join(__dirname, '..', 'americanbox-api', 'server.js');
        const remoteServerPath = 'server.js';

        console.log(`📄 Subiendo desde: ${localServerPath}`);
        console.log(`📄 Subiendo a: americanbox/americanbox-api/${remoteServerPath}`);

        await client.uploadFrom(localServerPath, remoteServerPath);
        console.log('✅ server.js subido exitosamente');

        // Verificar que se subió correctamente
        console.log('\n🔍 Verificando subida...');
        const verifyList = await client.list();
        const serverFile = verifyList.find(item => item.name === 'server.js');
        if (serverFile) {
            console.log(`✅ Verificado: server.js (${serverFile.size} bytes)`);
        } else {
            console.log('⚠️  Advertencia: No se pudo verificar la subida de server.js');
        }

        console.log('\n🎉 ¡Backend actualizado exitosamente!');
        console.log('\n📝 Cambios implementados:');
        console.log('  ✅ Endpoint de impresión de etiquetas');
        console.log('  ✅ Generación automática de números de guía');
        console.log('  ✅ Asignación automática de usuarios');
        console.log('  ✅ Endpoint para cambio de estados');
        console.log('  ✅ Campo price_per_pound en usuarios');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

console.log('🚀 Iniciando subida del backend a Hostinger...\n');
uploadBackend();