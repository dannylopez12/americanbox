# 🚀 Guía Rápida: Migrar a Firebase

## Paso 1: Configurar Firebase

### 1.1 Crear Proyecto
1. Ve a https://console.firebase.google.com/
2. Crea proyecto: `americanbox-e368b`
3. Habilita Firestore Database

### 1.2 Obtener Credenciales
1. Ve a Project Settings → Service accounts
2. "Generate new private key" → Descarga el JSON
3. Copia los valores del JSON

## Paso 2: Configurar Variables de Entorno

Edita el archivo `.env.migration` con tus credenciales reales:

```env
# Firebase (del JSON descargado)
FIREBASE_PROJECT_ID=americanbox-e368b
FIREBASE_PRIVATE_KEY_ID=abcdef123456...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@americanbox-e368b.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# MySQL (tu base actual)
DB_HOST=45.152.46.128
DB_USER=u582924658_American
DB_PASSWORD=1532DAnILO
DB_NAME=u582924658_American
DB_PORT=3306
```

## Paso 3: Probar Conexión

```bash
# Cargar variables de entorno
# En PowerShell:
$env:FIREBASE_PROJECT_ID="americanbox-e368b"
$env:FIREBASE_PRIVATE_KEY_ID="tu_valor"
# ... configura todas las variables

# Probar Firebase
npm run test-firebase
```

## Paso 4: Migrar Datos

```bash
# Una vez que Firebase funcione, migrar datos
npm run migrate
```

## Paso 5: Configurar Vercel

En Vercel → Environment Variables, agrega las mismas variables de Firebase (sin las de MySQL).

## 📊 Qué se migra:

- ✅ **users**: Usuarios del sistema
- ✅ **customers**: Clientes con precios personalizados
- ✅ **orders**: Órdenes con precio_por_libra
- ✅ **providers**: Proveedores de envío
- ✅ **addresses**: Direcciones

## 🎯 Resultado Final

Después de la migración:
- ✅ Vercel funcionará correctamente
- ✅ Los datos cargarán en producción
- ✅ Precios personalizados funcionarán
- ✅ Todo será serverless y escalable

¿Necesitas ayuda con algún paso específico?