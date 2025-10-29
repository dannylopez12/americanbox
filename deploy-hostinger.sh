#!/bin/bash

echo "🚀 Iniciando deployment en Hostinger..."

# Crear directorios necesarios
mkdir -p ~/public_html/americanbox
cd ~/public_html/americanbox

# Limpiar directorio anterior (opcional)
# rm -rf *

echo "📦 Instalando dependencias..."
npm install

echo "🔧 Configurando variables de entorno..."
cat > .env << EOF
NODE_ENV=production
PORT=3000

# Base de datos local (Hostinger)
DB_HOST=localhost
DB_USER=u582924658_American
DB_PASSWORD=1532DAnILO
DB_NAME=u582924658_American
DB_PORT=3306

# URLs de la aplicación
FRONTEND_URL=https://palevioletred-wasp-581512.hostingersite.com
API_URL=https://palevioletred-wasp-581512.hostingersite.com/api
EOF

echo "🎯 Iniciando aplicación..."
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Iniciar aplicación con PM2
pm2 start server-hostinger.js --name "americanbox"
pm2 startup
pm2 save

echo "✅ Deployment completado!"
echo "🌐 Aplicación disponible en: https://palevioletred-wasp-581512.hostingersite.com"
echo "📊 Monitoreo: pm2 monit"
echo "🔄 Reiniciar: pm2 restart americanbox"