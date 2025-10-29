# 🚀 Migración a PlanetScale para Vercel

## Problema Actual
Vercel serverless functions no pueden conectarse directamente a bases de datos MySQL en hosting compartido (como Hostinger). Esto causa que no carguen los datos en producción.

## Solución: PlanetScale
PlanetScale es una base de datos MySQL compatible con Vercel, optimizada para serverless.

## Pasos para Migrar

### 1. Crear cuenta en PlanetScale
1. Ve a [planetscale.com](https://planetscale.com)
2. Regístrate con tu cuenta (gratuito para empezar)
3. Crea una nueva base de datos llamada `americanbox_prod`

### 2. Migrar tu base de datos actual
1. Exporta tu base de datos actual desde Hostinger/phpMyAdmin:
   ```sql
   mysqldump -u TU_USUARIO -p TU_BASE_DATOS > americanbox_backup.sql
   ```

2. En PlanetScale, ve a "Import database" y sube el archivo SQL

### 3. Configurar variables de entorno en Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega estas variables (las obtienes de PlanetScale → Connect):

```
DB_HOST=aws.connect.psdb.cloud
DB_USER=tu_usuario_planetscale
DB_PASSWORD=tu_password_planetscale
DB_NAME=americanbox_prod
DB_PORT=3306
```

### 4. Probar la conexión
Después de configurar las variables, haz deploy y verifica que los datos carguen.

## Alternativas si no quieres usar PlanetScale

### Opción A: Railway
1. Ve a [railway.app](https://railway.app)
2. Crea un proyecto MySQL
3. Migra tu base de datos
4. Configura las variables de entorno igual que arriba

### Opción B: Vercel Postgres
1. En Vercel, ve a Storage → Create Database → Postgres
2. Tendrías que migrar de MySQL a PostgreSQL (cambio más grande)

## ¿Por qué PlanetScale?
- ✅ Compatible con MySQL (tu código actual funciona)
- ✅ Optimizado para serverless
- ✅ Gratuito para desarrollo
- ✅ Escalabilidad automática
- ✅ Backups automáticos

## Verificación
Después de la migración, verifica que funcionen:
- ✅ Login de administradores
- ✅ Lista de usuarios
- ✅ Gestión de clientes
- ✅ Creación de órdenes
- ✅ Precios por libra personalizados