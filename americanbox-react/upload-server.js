import ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadServerFile() {
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

        // Navegar a la carpeta americanbox
        console.log('📁 Navegando a carpeta americanbox...');
        await client.cd('americanbox');

        // Navegar a la carpeta americanbox-api
        console.log('📁 Navegando a carpeta americanbox-api...');
        await client.cd('americanbox-api');

        console.log('📍 Ubicación final: americanbox/americanbox-api');

        // Verificar estructura actual
        const currentList = await client.list();
        console.log('Contenido actual:');
        currentList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

        // Subir server.js corregido
        const serverPath = path.join(__dirname, '..', 'americanbox-api', 'server.js');
        const remoteServerPath = 'server.js';

        console.log(`\n📤 Subiendo server.js...`);
        console.log(`   Local: ${serverPath}`);
        console.log(`   Remoto: ${remoteServerPath}`);

        if (fs.existsSync(serverPath)) {
            await client.uploadFrom(serverPath, remoteServerPath);
            console.log('✅ server.js subido exitosamente!');
        } else {
            console.log('❌ Error: server.js no encontrado localmente');
            console.log('Ruta buscada:', serverPath);
        }

        console.log('\n🎉 ¡Subida del servidor completada!');
        console.log('🔄 El servidor se reiniciará automáticamente');

    } catch (error) {
        console.error('❌ Error durante la subida:', error);
    } finally {
        client.close();
    }
}

uploadServerFile().catch(console.error);