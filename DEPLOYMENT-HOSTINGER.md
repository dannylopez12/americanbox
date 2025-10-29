# 🚀 Guía de Despliegue en Hostinger - AmericanBox

## 📋 Preparación para Producción

### 1. 🗄️ **Base de Datos en Hostinger**

#### Acceder a tu Panel de Hostinger:
1. Ve a **hPanel** → **Bases de datos MySQL**
2. Crear nueva base de datos:
   - **Nombre**: `americanbox_prod`
   - **Usuario**: Crear usuario con permisos completos
   - **Contraseña**: Generar contraseña segura
3. **Anotar datos de conexión:**
   ```
   Host: localhost (o el que te proporcione Hostinger)
   Puerto: 3306
   Base de datos: americanbox_prod
   Usuario: tu_usuario
   Contraseña: tu_contraseña
   ```

#### Importar Estructura de Base de Datos:
1. Exporta tu base de datos local con **estructura y datos**
2. Ve a **phpMyAdmin** en Hostinger
3. Selecciona tu base de datos
4. **Importar** → Subir tu archivo `.sql`

---

### 2. ⚙️ **Configuración del Backend**

#### Variables de Entorno para Producción:
Crear archivo `.env.production`:

```env
# Base de datos Hostinger
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=americanbox_prod
DB_PORT=3306

# Configuración de aplicación
NODE_ENV=production
PORT=4000

# Sesiones (cambiar por una clave secreta segura)
SESSION_SECRET=tu_clave_secreta_muy_segura_aqui

# URLs de producción
CLIENT_URL=https://tu-dominio.com
API_URL=https://tu-dominio.com/api

# Configuración de archivos
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
ALLOWED_ORIGINS=https://tu-dominio.com
```

#### Preparar server.js para producción:
```javascript
// Agregar al inicio del server.js
const isProduction = process.env.NODE_ENV === 'production';

// Configurar CORS para producción
const corsOptions = {
  origin: isProduction ? process.env.ALLOWED_ORIGINS : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Servir archivos estáticos del frontend en producción
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../americanbox-react/dist')));
  
  // Manejar rutas del frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../americanbox-react/dist/index.html'));
  });
}
```

---

### 3. 🎨 **Configuración del Frontend**

#### Crear archivo de configuración para producción:
`americanbox-react/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
```

#### Configurar variables de entorno:
`americanbox-react/.env.production`:

```env
VITE_API_URL=https://tu-dominio.com/api
VITE_NODE_ENV=production
```

#### Actualizar api.ts para producción:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  // ... resto del código
}
```

---

### 4. 📦 **Scripts de Build**

#### package.json del backend:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "npm run build:frontend",
    "build:frontend": "cd ../americanbox-react && npm run build"
  }
}
```

#### package.json del frontend:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

### 5. 🔄 **Proceso de Despliegue**

#### Opción A: Usando File Manager de Hostinger

1. **Construir el proyecto localmente:**
   ```bash
   # En americanbox-react
   npm run build
   
   # En americanbox-api
   npm run build
   ```

2. **Subir archivos:**
   - Sube `americanbox-api/` completo a `public_html/api/`
   - Sube `americanbox-react/dist/` a `public_html/`
   - Sube `node_modules` del backend

3. **Configurar .htaccess en public_html:**
   ```apache
   # Redirigir API al backend
   RewriteEngine On
   RewriteRule ^api/(.*)$ api/server.js/$1 [L,QSA]
   
   # Manejar rutas de React
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

#### Opción B: Usando Git (Recomendado)

1. **Crear repositorio Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin tu-repositorio.git
   git push origin main
   ```

2. **En Hostinger, usar Git Deploy:**
   - Panel → **Git** → **Crear nuevo repositorio**
   - Conectar con tu repositorio
   - Configurar auto-deploy

---

### 6. 🔧 **Configuración del Servidor**

#### Si Hostinger soporta Node.js:

1. **Crear app en Node.js:**
   - Panel → **Node.js** → **Crear aplicación**
   - Seleccionar versión de Node (16+)
   - Configurar punto de entrada: `server.js`

2. **Variables de entorno:**
   - Agregar todas las variables del `.env.production`

#### Si solo soporta PHP (Hosting compartido):

Necesitarás usar **Vercel**, **Railway** o **Heroku** para el backend:

1. **Backend en Vercel:**
   ```json
   // vercel.json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```

2. **Frontend en Hostinger:**
   - Solo sube `dist/` a `public_html/`
   - Configura variables de entorno para apuntar a Vercel

---

### 7. 🔐 **Configuración de Seguridad**

#### SSL Certificate:
- Hostinger suele incluir SSL gratuito
- Verificar que esté habilitado en el panel

#### Variables de seguridad:
```env
SESSION_SECRET=clave-super-secreta-256-bits
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

---

### 8. ✅ **Lista de Verificación Final**

- [ ] Base de datos creada e importada
- [ ] Variables de entorno configuradas
- [ ] Frontend construido (`npm run build`)
- [ ] Backend subido con `node_modules`
- [ ] SSL habilitado
- [ ] Dominios configurados
- [ ] Pruebas de conexión API
- [ ] Pruebas de login/registro
- [ ] Pruebas de funcionalidades principales

---

### 9. 🐛 **Troubleshooting Común**

#### Error de conexión DB:
- Verificar host de base de datos
- Comprobar usuario/contraseña
- Revisar permisos de usuario

#### Error 500:
- Revisar logs del servidor
- Verificar `node_modules` completos
- Comprobar versión de Node.js

#### CORS Error:
- Verificar `ALLOWED_ORIGINS`
- Configurar headers correctos
- Revisar protocolo HTTP/HTTPS

---

### 10. 📞 **Contacto y Soporte**

Si necesitas ayuda con algún paso específico, comparte:
1. Tipo de hosting de Hostinger que tienes
2. Mensajes de error específicos
3. Logs del servidor

¡Tu aplicación está lista para producción! 🚀