# Variables de Entorno para Vercel

## 📋 Configurar estas variables en Vercel Dashboard

Ve a **Settings** > **Environment Variables** y agrega las siguientes:

---

### 🔐 FIREBASE_SERVICE_ACCOUNT_KEY (Backend - IMPORTANTE)

**Tipo:** Secret  
**Environment:** Production, Preview, Development  
**Valor:** (Copia el contenido del archivo JSON en UNA SOLA LÍNEA)

**Archivo:** `americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json`

**Cómo obtener el valor:**

Opción 1 - PowerShell (Recomendado):
```powershell
Get-Content americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json -Raw | Set-Clipboard
```
Esto copiará el JSON al portapapeles. Luego pégalo en Vercel.

Opción 2 - Manual:
1. Abre el archivo `americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json`
2. Copia TODO el contenido
3. Pégalo en Vercel (asegúrate que esté en UNA SOLA LÍNEA)

**⚠️ IMPORTANTE:** Este valor DEBE estar en UNA SOLA LÍNEA (sin saltos de línea)

---

### 🌐 Variables del Cliente Firebase (Frontend - Públicas)

Estas variables las obtienes de Firebase Console:
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **americanbox-e368b**
3. Ve a **Project Settings** (⚙️) > **General**
4. Scroll down a **Your apps** y selecciona tu Web app (o crea una si no existe)
5. En "SDK setup and configuration", selecciona **Config** y copia los valores

---

#### VITE_FIREBASE_API_KEY
**Tipo:** Plain Text  
**Environment:** Production, Preview, Development  
**Valor:** `[Copia desde Firebase Console]`

Ejemplo: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

#### VITE_FIREBASE_AUTH_DOMAIN
**Tipo:** Plain Text  
**Environment:** Production, Preview, Development  
**Valor:** `americanbox-e368b.firebaseapp.com`

---

#### VITE_FIREBASE_PROJECT_ID
**Tipo:** Plain Text  
**Environment:** Production, Preview, Development  
**Valor:** `americanbox-e368b`

---

#### VITE_FIREBASE_STORAGE_BUCKET
**Tipo:** Plain Text  
**Environment:** Production, Preview, Development  
**Valor:** `americanbox-e368b.firebasestorage.app`

---

#### VITE_FIREBASE_MESSAGING_SENDER_ID
**Tipo:** Plain Text  
**Environment:** Production, Preview, Development  
**Valor:** `[Copia desde Firebase Console]`

Ejemplo: `123456789012`

---

#### VITE_FIREBASE_APP_ID
**Tipo:** Plain Text  
**Environment:** Production, Preview, Development  
**Valor:** `[Copia desde Firebase Console]`

Ejemplo: `1:123456789012:web:abcdef1234567890`

---

## 🚀 Pasos para Configurar en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **americanboxprueba1**
3. Ve a **Settings** > **Environment Variables**
4. Agrega cada variable una por una:
   - Nombre: el nombre de la variable (ej: `FIREBASE_SERVICE_ACCOUNT_KEY`)
   - Value: el valor correspondiente
   - Environments: Selecciona **Production**, **Preview**, y **Development**
5. Haz clic en **Save**
6. Después de agregar todas las variables, ve a **Deployments**
7. Haz un **Redeploy** del último deployment para aplicar las nuevas variables

---

## ✅ Verificación

Después del redeploy, verifica que:
- La app carga sin errores de "Params are not set"
- El login funciona correctamente
- No hay errores 500 en `/api/login`

---

## 🔒 Seguridad

- **NUNCA** commitees archivos `.env` o `.env.local` al repositorio
- El archivo `FIREBASE_SERVICE_ACCOUNT_KEY` contiene credenciales sensibles
- Agrega `.env*` al `.gitignore`
