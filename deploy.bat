@echo off
REM Script de despliegue para AmericanBox en Windows

echo 🚀 Iniciando proceso de despliegue para producción...

REM Verificar que estamos en el directorio correcto
if not exist "americanbox-api\package.json" (
    echo ❌ Error: Ejecuta este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

echo 📦 1. Instalando dependencias del backend...
cd americanbox-api
call npm install --production=false

echo 🎨 2. Construyendo frontend...
cd ..\americanbox-react
call npm install
call npm run build

if not exist "dist" (
    echo ❌ Error: No se pudo construir el frontend
    pause
    exit /b 1
)

echo ✅ Frontend construido correctamente

cd ..\americanbox-api

echo 🗄️  3. Exportando base de datos...
call npm run export:db

echo 📋 4. Creando paquete de despliegue...

REM Crear directorio temporal
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package
cd deploy-package

REM Copiar archivos del backend
echo 📁 Copiando archivos del backend...
xcopy ..\node_modules node_modules\ /E /I /Q
copy ..\server.js .
copy ..\package.json .
copy ..\.env.production .env
if exist ..\uploads xcopy ..\uploads uploads\ /E /I /Q

REM Copiar frontend construido
echo 📁 Copiando frontend construido...
xcopy ..\..\americanbox-react\dist\* . /E /Q

REM Copiar archivos de configuración
copy ..\..\*.htaccess . 2>nul

echo 📦 Los archivos están listos en deploy-package\

cd ..

echo.
echo ✅ ¡Despliegue preparado!
echo 📁 Archivos preparados en: americanbox-api\deploy-package\
echo.
echo 🚀 Pasos siguientes:
echo 1. Comprime la carpeta deploy-package en un ZIP
echo 2. Sube el ZIP a tu hosting y descomprímelo en public_html/
echo 3. Configura variables de entorno en .env
echo 4. Importa americanbox_export.sql en tu base de datos
echo 5. Configura permisos de archivos si es necesario
echo.
echo 📞 ¿Necesitas ayuda? Revisa DEPLOYMENT-HOSTINGER.md
echo.
pause