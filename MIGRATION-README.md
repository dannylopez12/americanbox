# 🚀 American Box - Migración a Firebase

## 📋 Estado Actual
Tu aplicación funciona localmente con MySQL, pero falla en Vercel porque las funciones serverless no pueden conectarse a bases de datos MySQL en hosting compartido.

## 🎯 Solución: Firebase/Firestore
Hemos implementado una migración completa a Firebase/Firestore, que es compatible con Vercel serverless.

## 📁 Archivos Creados/Modificados

### ✅ Firebase Configuration
- `api/lib/firebase.js` - Configuración de Firebase Admin SDK
- `setup-firebase.js` - Script interactivo para configurar credenciales

### ✅ APIs Convertidas
- `api/admin/users.js` - Convertido a Firestore
- `api/admin/orders.js` - Convertido a Firestore
- `api/test-db.js` - Actualizado para Firebase

### ✅ Migración
- `migrate-to-firebase.js` - Script completo de migración de datos
- `test-firebase.js` - Script para probar conexión Firebase

### ✅ Documentación
- `FIREBASE-MIGRATION-GUIDE.md` - Guía completa de migración
- `MIGRATION-QUICKSTART.md` - Guía rápida de inicio

## 🚀 Pasos para Migrar

### 1. Configurar Firebase Project
```bash
# Ve a https://console.firebase.google.com/
# Crea un nuevo proyecto llamado "americanbox"
# Habilita Firestore Database
# Ve a Project Settings → Service Accounts
# Genera nueva clave privada → Descarga el JSON
```

### 2. Configurar Credenciales
```bash
npm run setup-firebase
```
Este comando te preguntará por:
- Project ID
- Private Key ID
- Private Key (completa)
- Client Email
- Client ID
- Client X509 Cert URL

### 3. Probar Conexión
```bash
npm run test-firebase
```

### 4. Migrar Datos
```bash
npm run migrate
```
Esto migrará:
- ✅ Usuarios (con precios personalizados por libra)
- ✅ Clientes
- ✅ Órdenes
- ✅ Proveedores
- ✅ Direcciones
- ✅ Configuraciones de empresa

### 5. Configurar Vercel
En tu proyecto Vercel, agrega estas variables de entorno:

```env
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="tu-private-key-completa"
FIREBASE_CLIENT_EMAIL=tu-client-email
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_CLIENT_X509_CERT_URL=tu-cert-url
```

## 🔍 Verificar Migración

### Probar APIs en Local
```bash
# Probar usuarios
curl http://localhost:3000/api/admin/users

# Probar órdenes
curl http://localhost:3000/api/admin/orders
```

### Desplegar a Vercel
```bash
npm run build
# Desplegar normalmente a Vercel
```

## 📊 Estructura de Datos Firestore

```
/americanbox/
├── users/           # Usuarios con precios personalizados
├── customers/       # Clientes
├── orders/          # Órdenes
├── providers/       # Proveedores
├── addresses/       # Direcciones
└── company_settings/# Configuraciones
```

## 🆘 Solución de Problemas

### Error de Conexión Firebase
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que el service account tenga permisos de Firestore

### Datos No Aparecen
- Ejecuta `npm run test-firebase` para verificar conexión
- Revisa los logs de migración para errores

### Vercel No Despliega
- Verifica que las variables de entorno estén en Vercel
- Revisa los logs de build en Vercel

## 📞 Soporte
Si tienes problemas, revisa:
1. `FIREBASE-MIGRATION-GUIDE.md` - Guía detallada
2. `MIGRATION-QUICKSTART.md` - Pasos rápidos
3. Los logs de los comandos de migración

¡Tu aplicación estará funcionando en Vercel con Firebase! 🎉