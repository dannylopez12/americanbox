#!/bin/bash
# Script de despliegue para AmericanBox

echo "🚀 Iniciando proceso de despliegue para producción..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio americanbox-api"
    exit 1
fi

echo "📦 1. Instalando dependencias del backend..."
npm install --production=false

echo "🎨 2. Construyendo frontend..."
cd ../americanbox-react
npm install
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: No se pudo construir el frontend"
    exit 1
fi

echo "✅ Frontend construido correctamente"

cd ../americanbox-api

echo "🗄️  3. Exportando base de datos..."
npm run export:db

echo "📋 4. Creando paquete de despliegue..."

# Crear directorio temporal
mkdir -p deploy-package
cd deploy-package

# Copiar archivos del backend
echo "📁 Copiando archivos del backend..."
cp -r ../node_modules ./
cp ../server.js ./
cp ../package.json ./
cp ../.env.production ./.env
cp -r ../uploads ./ 2>/dev/null || echo "ℹ️  No hay directorio uploads"

# Copiar frontend construido
echo "📁 Copiando frontend construido..."
cp -r ../../americanbox-react/dist/* ./

# Copiar archivos de configuración
cp ../../.htaccess ./

echo "📦 Creando archivo comprimido..."
tar -czf ../americanbox-production.tar.gz ./*

cd ..
rm -rf deploy-package

echo ""
echo "✅ ¡Despliegue preparado!"
echo "📁 Archivo creado: americanbox-production.tar.gz"
echo ""
echo "🚀 Pasos siguientes:"
echo "1. Sube americanbox-production.tar.gz a tu hosting"
echo "2. Descomprime en public_html/"
echo "3. Configura variables de entorno en .env"
echo "4. Importa americanbox_export.sql en tu base de datos"
echo "5. Configura permisos de archivos si es necesario"
echo ""
echo "📞 ¿Necesitas ayuda? Revisa DEPLOYMENT-HOSTINGER.md"