#!/bin/bash
# Script para desplegar AmericanBox en Hostinger

echo "🚀 Iniciando despliegue a Hostinger..."

# Verificar que el archivo ZIP existe
if [ ! -f "americanbox-api/americanbox-deployment.zip" ]; then
    echo "❌ Error: No se encontró el archivo americanbox-deployment.zip"
    echo "Ejecuta primero: deploy.bat"
    exit 1
fi

echo "📦 Archivo de despliegue encontrado: americanbox-deployment.zip"
echo ""
echo "📋 INSTRUCCIONES PARA SUBIR A HOSTINGER:"
echo "=========================================="
echo ""
echo "1. ACCEDER AL PANEL DE HOSTINGER:"
echo "   - Ve a tu panel de Hostinger (hPanel)"
echo "   - Ve a: Archivos → Administrador de archivos"
echo ""
echo "2. SUBIR ARCHIVOS:"
echo "   - Navega a: public_html/"
echo "   - Sube el archivo: americanbox-api/americanbox-deployment.zip"
echo "   - Una vez subido, descomprímelo en public_html/"
echo ""
echo "3. CONFIGURAR BASE DE DATOS:"
echo "   - Ve a: Bases de datos → MySQL"
echo "   - Importa: americanbox-api/americanbox_export.sql"
echo "   - Actualiza las credenciales en .env"
echo ""
echo "4. CONFIGURAR .htaccess (si es necesario):"
echo "   Crea o actualiza public_html/.htaccess con:"
cat << 'EOF'
# Redirigir API al backend
RewriteEngine On
RewriteRule ^api/(.*)$ api/server.js/$1 [L,QSA]

# Manejar rutas de React
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
EOF
echo ""
echo "5. CONFIGURAR VARIABLES DE ENTORNO:"
echo "   Edita public_html/.env con tus credenciales:"
cat << 'EOF'
# Base de datos Hostinger
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=tu_base_datos
DB_PORT=3306

# Configuración de aplicación
NODE_ENV=production
PORT=4000

# URLs de producción
CLIENT_URL=https://tu-dominio.com
API_URL=https://tu-dominio.com/api

# Sesiones (cambiar por una clave secreta segura)
SESSION_SECRET=tu_clave_secreta_muy_segura_aqui

# Configuración de archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
ALLOWED_ORIGINS=https://tu-dominio.com
EOF
echo ""
echo "6. INSTALAR DEPENDENCIAS EN HOSTINGER:"
echo "   Conecta por SSH a tu servidor y ejecuta:"
echo "   cd public_html"
echo "   npm install"
echo ""
echo "7. INICIAR APLICACIÓN:"
echo "   npm install -g pm2"
echo "   pm2 start server.js --name americanbox"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "8. VERIFICAR DESPLIEGUE:"
echo "   - Visita tu sitio web"
echo "   - Verifica que la API responda en /api"
echo "   - Prueba login y funcionalidades"
echo ""
echo "✅ ¡Archivos listos para subir!"
echo "📁 Ubicación del ZIP: americanbox-api/americanbox-deployment.zip"
echo ""
echo "💡 ¿Necesitas ayuda con algún paso específico?"