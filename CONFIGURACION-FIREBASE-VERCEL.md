# Guía de Configuración Firebase para Vercel

## 🎯 Resumen
Este proyecto ahora usa **Firebase** en lugar de MySQL. Necesitas configurar variables de entorno en Vercel.

---

## 📦 Paso 1: Instalar Dependencias

```powershell
cd americanbox-react
npm install firebase-admin
```

---

## 🔑 Paso 2: Obtener Credenciales del Cliente Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto: **americanbox-e368b**
3. Haz clic en el ⚙️ (Settings) > **Project Settings**
4. Scroll down a **Your apps**
5. Si no tienes una Web app, crea una:
   - Clic en el ícono **</>** (Web)
   - Nombre: `AmericanBox Web`
   - NO marques "Firebase Hosting"
   - Clic en **Register app**
6. Copia la configuración que aparece:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Copia este valor
  authDomain: "americanbox-e368b.firebaseapp.com",
  projectId: "americanbox-e368b",
  storageBucket: "americanbox-e368b.firebasestorage.app",
  messagingSenderId: "123456...", // ← Copia este valor
  appId: "1:123456..."            // ← Copia este valor
};
```

---

## ⚙️ Paso 3: Configurar Variables en Vercel

### Opción A: Desde la Web (Recomendado)

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto: **americanboxprueba1**
3. **Settings** > **Environment Variables**
4. Agrega las siguientes variables (copia-pega):

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Ver abajo ⬇️ | Production, Preview, Development |
| `VITE_FIREBASE_API_KEY` | `[Tu apiKey de Firebase Console]` | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | `americanbox-e368b.firebaseapp.com` | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | `americanbox-e368b` | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | `americanbox-e368b.firebasestorage.app` | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `[Tu messagingSenderId]` | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | `[Tu appId]` | Production, Preview, Development |

#### ⚠️ Valor para FIREBASE_SERVICE_ACCOUNT_KEY

**IMPORTANTE:** Este valor es el contenido completo del archivo:
- `americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json`

El JSON debe estar en **UNA SOLA LÍNEA** (sin saltos de línea).

**Cómo obtenerlo:**
1. Abre el archivo `americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json` en tu computadora
2. Copia todo el contenido (es un JSON)
3. Pégalo en una sola línea en Vercel (elimina saltos de línea si es necesario)

O usa este comando en PowerShell:
```powershell
Get-Content americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json -Raw | Set-Clipboard
```
Esto copiará el JSON al portapapeles listo para pegar en Vercel.

### Opción B: Desde CLI (Avanzado)

```powershell
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# En la carpeta del proyecto
cd americanbox-react

# Configurar variables (reemplaza con tus valores)
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# Pega el JSON cuando te lo pida

vercel env add VITE_FIREBASE_API_KEY production
# Pega tu API Key

# Repite para todas las variables...
```

---

## 🚀 Paso 4: Redeploy en Vercel

Después de configurar todas las variables:

1. Ve a **Deployments**
2. Busca el deployment más reciente
3. Haz clic en los **⋯** (tres puntos)
4. Selecciona **Redeploy**
5. Marca la casilla "Use existing Build Cache" para que sea más rápido
6. Clic en **Redeploy**

---

## ✅ Paso 5: Verificar

1. Espera a que termine el deployment (~2-3 min)
2. Abre tu sitio: `https://americanboxprueba1.vercel.app`
3. Intenta hacer login
4. **NO** deberías ver:
   - ❌ "Configuración de base de datos incompleta"
   - ❌ "Params are not set"
   - ❌ Error 500 en `/api/login`

Si ves alguno de estos errores, revisa:
- Que todas las variables estén configuradas
- Que `FIREBASE_SERVICE_ACCOUNT_KEY` esté en UNA SOLA LÍNEA
- Que los valores de `VITE_FIREBASE_*` sean correctos

---

## 🐛 Troubleshooting

### Error: "Params are not set"
**Causa:** Faltan las variables `VITE_FIREBASE_*`  
**Solución:** Verifica que configuraste todas las variables con el prefijo `VITE_`

### Error: "Configuración de base de datos incompleta"
**Causa:** Falta `FIREBASE_SERVICE_ACCOUNT_KEY` o está mal formateado  
**Solución:** 
1. Verifica que el JSON esté en UNA SOLA LÍNEA
2. No debe tener espacios extras ni saltos de línea
3. Debe empezar con `{` y terminar con `}`

### Error 500 en /api/login
**Causa:** Error en el backend al conectar con Firebase  
**Solución:**
1. Ve a Vercel > Deployments > [Tu deployment] > Functions
2. Haz clic en `/api/login` y revisa los logs
3. Busca mensajes de error específicos

---

## 📝 Notas Importantes

1. **Seguridad:** NUNCA commitees archivos `.env` o credenciales al repositorio
2. **Variables públicas:** Las que empiezan con `VITE_` son visibles en el navegador
3. **Variables privadas:** `FIREBASE_SERVICE_ACCOUNT_KEY` solo se usa en el backend
4. **Desarrollo local:** Usa el archivo `.env.local` para desarrollo (ya está en `.gitignore`)

---

## 📞 Ayuda

Si tienes problemas:
1. Revisa los logs de Vercel
2. Verifica que todas las variables estén configuradas
3. Asegúrate de haber redeployado después de agregar las variables
