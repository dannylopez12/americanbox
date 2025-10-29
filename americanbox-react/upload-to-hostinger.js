import ftp from 'basic-ftp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadFiles() {
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

        // Primero, explorar la estructura
        console.log('📁 Explorando estructura del servidor...');

        // Listar archivos desde la raíz
        const rootList = await client.list();
        console.log('Contenido de la raíz:');
        rootList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

        // Intentar ir a public_html si existe
        let list;
        try {
            await client.cd('public_html');
            list = await client.list();
            console.log('\nContenido de public_html:');
            list.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));
        } catch {
            console.log('\n⚠️  No existe public_html, usando raíz');
            list = rootList;
        }

        // Buscar dónde está el index.html actual
        let remoteDir = '';
        let foundIndex = false;

        // Verificar si existe americanbox/
        if (list.some(item => item.name === 'americanbox' && item.isDirectory)) {
            console.log('\n✅ Encontrada carpeta americanbox/');
            await client.cd('americanbox');
            const listAmericanbox = await client.list();
            console.log('Contenido de americanbox:');
            listAmericanbox.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

            if (listAmericanbox.some(item => item.name === 'americanbox-react' && item.isDirectory)) {
                console.log('✅ Encontrada carpeta americanbox-react/');
                await client.cd('americanbox-react');
                const listReact = await client.list();
                console.log('Contenido de americanbox-react:');
                listReact.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));
                remoteDir = 'americanbox/americanbox-react';
                foundIndex = listReact.some(item => item.name === 'index.html');
            } else if (listAmericanbox.some(item => item.name === 'index.html')) {
                console.log('✅ Encontrado index.html en americanbox/');
                remoteDir = 'americanbox';
                foundIndex = true;
            }
        } else if (list.some(item => item.name === 'index.html')) {
            console.log('✅ Encontrado index.html en la raíz');
            remoteDir = '.';
            foundIndex = true;
        }

        if (!foundIndex) {
            console.log('\n⚠️  No se encontró index.html, usando: americanbox/americanbox-react');
            remoteDir = 'americanbox/americanbox-react';
        }

        // El sitio web REAL se sirve desde /domains/palevioletred-wasp-581512.hostingersite.com/public_html/
        console.log('\n🔍 Buscando la ubicación correcta del sitio web...');

        try {
            await client.cd('/domains/palevioletred-wasp-581512.hostingersite.com/public_html');
            const prodList = await client.list();
            console.log('✅ Encontrado /domains/palevioletred-wasp-581512.hostingersite.com/public_html/');
            console.log('Contenido:');
            prodList.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));

            remoteDir = 'domains/palevioletred-wasp-581512.hostingersite.com/public_html';
        } catch (e) {
            console.log('⚠️  No se pudo acceder a domains/, usando /americanbox');
            remoteDir = 'americanbox';
        }

        console.log(`\n📁 Usando directorio: /${remoteDir}`);
        await client.cd('/' + remoteDir);

        // Subir index.html
        console.log('\n📤 Subiendo index.html...');
        await client.uploadFrom(
            path.join(__dirname, 'dist', 'index.html'),
            'index.html'
        );
        console.log('✅ index.html subido');

        // Crear carpeta static si no existe
        console.log('\n📁 Verificando carpeta static/...');
        try {
            await client.cd('static');
            console.log('✅ Carpeta static existe');
        } catch {
            console.log('⚠️  Carpeta static no existe, creándola...');
            await client.ensureDir('static');
            console.log('✅ Carpeta static creada');
        }

        // Volver al directorio base
        await client.cd('/' + remoteDir);

        // Subir archivos de la carpeta static
        console.log('\n📤 Subiendo archivos de static/...');
        const staticFiles = fs.readdirSync(path.join(__dirname, 'dist', 'static'));

        for (const file of staticFiles) {
            const localPath = path.join(__dirname, 'dist', 'static', file);
            const remotePath = `static/${file}`;

            console.log(`  📄 Subiendo ${file}...`);
            await client.uploadFrom(localPath, remotePath);
            console.log(`  ✅ ${file} subido`);
        }

        console.log('\n🎉 ¡Todos los archivos se subieron exitosamente!');
        console.log('\n📝 Archivos subidos:');
        console.log('  - index.html');
        staticFiles.forEach(file => console.log(`  - static/${file}`));

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

console.log('🚀 Iniciando subida de archivos a Hostinger...\n');
uploadFiles();
