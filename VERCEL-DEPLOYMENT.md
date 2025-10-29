# 🚀 Guía de Deploy en Vercel - AmericanBox

## ✅ COMPLETADO: Código en GitHub
- ✅ Repositorio: https://github.com/dannylopez12/americanbox
- ✅ Código subido exitosamente
- ✅ Archivos de configuración listos

---

## 📋 PASOS PARA DEPLOY EN VERCEL

### 1. 🔗 **Conectar con Vercel**

1. Ve a **[vercel.com](https://vercel.com)**
2. **Iniciar sesión** con tu cuenta de GitHub
3. Haz clic en **"New Project"**
4. **Importar** el repositorio `dannylopez12/americanbox`
5. Haz clic en **"Import"**

### 2. ⚙️ **Configuración del Proyecto**

En la pantalla de configuración:

#### **Framework Preset**: `Other`
#### **Root Directory**: `.` (dejar por defecto)
#### **Build Command**: `npm run build` (en americanbox-react)
#### **Output Directory**: `americanbox-react/dist`
#### **Install Command**: `npm install`

### 3. 🗄️ **Base de Datos (PlanetScale - RECOMENDADO)**

#### Opción A: PlanetScale (Gratis y Fácil)
1. Ve a **[planetscale.com](https://planetscale.com)**
2. Crear cuenta con GitHub
3. **New Database** → Nombre: `americanbox-prod`
4. **Región**: `us-east-1` (más cerca)
5. En **Connect** → Copiar string de conexión

#### Opción B: Railway
1. Ve a **[railway.app](https://railway.app)**
2. **New Project** → **MySQL**
3. Copiar datos de conexión

#### Opción C: Usar tu BD existente
- Host público de tu servidor
- Puerto accesible desde internet

### 4. 🔐 **Variables de Entorno en Vercel**

En el dashboard de Vercel, ve a **Settings** → **Environment Variables**:

```env
# Base de datos (completar con tus datos)
DB_HOST=tu-host-de-bd
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña  
DB_NAME=americanbox_prod
DB_PORT=3306

# Configuración
NODE_ENV=production
SESSION_SECRET=clave-super-secreta-aqui-256-bits

# URLs (Vercel las configura automáticamente)
CLIENT_URL=https://tu-app.vercel.app
API_URL=https://tu-app.vercel.app/api

# Configuración adicional
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
```

### 5. 📊 **Importar Base de Datos**

#### Si usas PlanetScale:
1. En tu dashboard de PlanetScale
2. **Console** → **Import** 
3. Subir el archivo `americanbox_export.sql`

#### Si usas Railway:
1. **Connect** → Usar cliente MySQL
2. Importar desde `americanbox_export.sql`

#### Crear archivo SQL de exportación:
```bash
# En tu proyecto local
cd americanbox-api
npm run export:db
```

### 6. 🚀 **Deploy**

1. Haz clic en **"Deploy"** en Vercel
2. Esperar a que termine el build (5-10 minutos)
3. ¡Tu app estará live!

---

## 🔧 **Configuración Avanzada**

### Dominios Personalizados
1. **Settings** → **Domains**
2. Agregar tu dominio
3. Configurar DNS según instrucciones

### Variables por Ambiente
- **Production**: Variables principales
- **Preview**: Para testing
- **Development**: Para desarrollo local

---

## 🐛 **Troubleshooting**

### Error de Build
- Revisar logs en Vercel
- Verificar que `vercel.json` está configurado
- Comprobar dependencias en package.json

### Error de Base de Datos
- Verificar string de conexión
- Comprobar que la BD está importada
- Revisar variables de entorno

### Error 500
- Ver **Functions** logs en Vercel
- Revisar API endpoints
- Verificar variables de entorno

---

## 📱 **Testing**

### URLs de Testing:
- **Homepage**: `https://tu-app.vercel.app`
- **Admin**: `https://tu-app.vercel.app/admin`
- **API**: `https://tu-app.vercel.app/api/status`

### Cuentas de Prueba:
```
Admin:
- Email: admin@americanbox.com
- Password: admin123

Cliente:
- Registrar nueva cuenta desde la web
```

---

## ✅ **Checklist Final**

- [ ] Código subido a GitHub ✅
- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Base de datos creada e importada
- [ ] Deploy exitoso
- [ ] Homepage carga correctamente
- [ ] Admin dashboard funciona
- [ ] API endpoints responden
- [ ] Login/registro funcionan

---

## 🎉 **¡LISTO!**

Tu aplicación AmericanBox estará disponible en:
**https://americanbox-dannylopez12.vercel.app** (o el dominio que elijas)

### Próximos pasos:
1. **Dominio personalizado**: americanbox.com
2. **SSL automático**: Vercel lo incluye
3. **CDN global**: Automático con Vercel
4. **Analytics**: Activar en Vercel dashboard

¿Necesitas ayuda con algún paso? ¡Pregúntame! 🚀