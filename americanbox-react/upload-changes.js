import ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadChangedFiles() {
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

        // Explorar estructura del servidor
        console.log('📁 Explorando estructura del servidor...');

        const rootList = await client.list();
        console.log('Contenido de la raíz:');
        rootList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

        // Intentar ir a public_html
        let currentPath = '';
        try {
            await client.cd('public_html');
            currentPath = 'public_html';
            console.log('✅ Navegado a public_html');

            const publicHtmlList = await client.list();
            console.log('Contenido de public_html:');
            publicHtmlList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

            // Buscar carpeta americanbox
            const hasAmericanBox = publicHtmlList.some(item => item.name === 'americanbox' && item.isDirectory);
            if (hasAmericanBox) {
                await client.cd('americanbox');
                currentPath = 'public_html/americanbox';
                console.log('✅ Navegado a public_html/americanbox');
            } else {
                console.log('❌ No se encontró carpeta americanbox en public_html');
                console.log('Creando carpeta americanbox...');
                await client.send('MKD americanbox');
                await client.cd('americanbox');
                currentPath = 'public_html/americanbox';
            }

        } catch (error) {
            console.log('⚠️  No existe public_html, intentando con carpeta americanbox en raíz...');

            // Intentar ir directamente a americanbox
            const hasAmericanBox = rootList.some(item => item.name === 'americanbox' && item.isDirectory);
            if (hasAmericanBox) {
                await client.cd('americanbox');
                currentPath = 'americanbox';
                console.log('✅ Navegado a americanbox (raíz)');
            } else {
                console.log('❌ No se encontró carpeta americanbox');
                return;
            }
        }

        console.log(`📍 Ubicación actual: ${currentPath}`);

        // Listar contenido actual de la carpeta americanbox
        const list = await client.list();
        console.log('Contenido actual:');
        list.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

        // Navegar a la carpeta del frontend
        const hasReactFolder = list.some(item => item.name === 'americanbox-react' && item.isDirectory);
        if (hasReactFolder) {
            await client.cd('americanbox-react');
            currentPath = currentPath ? `${currentPath}/americanbox-react` : 'americanbox-react';
            console.log('✅ Navegado a carpeta del frontend');
        } else {
            console.log('❌ No se encontró carpeta americanbox-react');
            return;
        }

        console.log(`📍 Ubicación final: ${currentPath}`);

        // Verificar estructura actual
        const currentList = await client.list();
        console.log('Contenido actual:');
        currentList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

        // Subir AdminOrders.tsx corregido
        const adminOrdersPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminOrders.tsx');
        const remoteAdminOrdersPath = 'src/components/admin/AdminOrders.tsx';

        console.log(`\n📤 Subiendo AdminOrders.tsx...`);
        console.log(`   Local: ${adminOrdersPath}`);
        console.log(`   Remoto: ${remoteAdminOrdersPath}`);

        if (fs.existsSync(adminOrdersPath)) {
            await client.uploadFrom(adminOrdersPath, remoteAdminOrdersPath);
            console.log('✅ AdminOrders.tsx subido exitosamente!');
        } else {
            console.log('❌ Error: AdminOrders.tsx no encontrado localmente');
        }

        // Verificar si necesitamos reconstruir el frontend
        console.log('\n🔄 Verificando si es necesario reconstruir el frontend...');

        // Verificar si existe dist/
        const hasDist = list.some(item => item.name === 'dist' && item.isDirectory);
        if (hasDist) {
            console.log('📁 Encontrada carpeta dist/, el frontend ya está construido');
            console.log('💡 Los cambios se aplicarán automáticamente al recargar la página');
        } else {
            console.log('⚠️  No se encontró carpeta dist/, puede ser necesario reconstruir');
        }

        console.log('\n🎉 ¡Subida completada!');
        console.log('🔄 Recarga tu navegador para ver los cambios');

    } catch (error) {
        console.error('❌ Error durante la subida:', error);
    } finally {
        client.close();
    }
}

uploadChangedFiles().catch(console.error);