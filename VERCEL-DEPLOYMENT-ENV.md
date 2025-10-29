# 🚀 Vercel Deployment Guide

## Configuración de Variables de Entorno

Para configurar tu aplicación en Vercel, necesitas copiar las siguientes variables de entorno desde el archivo `.env` local a la configuración de tu proyecto en Vercel.

### Pasos para configurar en Vercel:

1. Ve a [vercel.com](https://vercel.com) y accede a tu dashboard
2. Selecciona tu proyecto "americanbox" o crea uno nuevo conectando tu repositorio de GitHub
3. Ve a la pestaña **"Settings"** → **"Environment Variables"**
4. Copia cada variable del archivo `.env` local y pégala en Vercel

### Variables de Entorno Requeridas:

```bash
FIREBASE_PROJECT_ID=americanbox-e368b
FIREBASE_PRIVATE_KEY_ID=763442ab426bd23169d91b92b65fc3c9e30cdf04
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCPiKCpwYXbyAYR\npo0tmv+57AMp0L8mYrysD7wGvdZ2eE8/XnUS93K/nFl70zckhGIj1lggqNMBhjWl\n4CUE3OT9L+KreCv3jxz0yXZPNVvco+4aPgHGsAxCW2q5IkhhL30yKjccPH27LrJz\nZElZ40DEb5WRls1QA1cd2mKTN1bAtnlO9Pl6UYhsvNR0faOx/fqRgAWAQ1KKOtAe\neBTX9gjUwMmS4K7u/XBffp3HuqarXsR8RjwubPdzV+b9mjPOnejl8XrIn471m/GT\nYppmryvlDPv/OygFn4iuGmFMulzPzINxeDhuEM4oVT9YUG4y3Vr3ZBBuiYR7HrJZ\n8xdjG/EjAgMBAAECggEAFKl0M1ZZPiJaWU0dUpzW8OfcLAym5PresnLQvDRfZzjP\nc6MAfcVNk+6zuk2qnkueUw6xK1ZnivchHuqYJE3mJYUF/21dAECY8wCoqCNZa3bV\nDkWx0hfCqVoT5WhdfKauQjvt01c+juUHKZxHVjS5Z0MG3Wk/eflZH5eHNtkHAyuq\nLYdI/izYJhtxSEHPF2rKk1o09ReoLxRt9RYmsEDxEHcw22sC4e0Rz2cHRJqI15jW\n188Vb0fHf94dSnluVpfjosVznp0a2bK1Co/MUHKOOeW5qamvdRd+b1fzOF7lhs94\nSUSN5LaE+q7UYKg2tsNK1ePckYR4SDbq40xk3xp6WQKBgQDF8/OqS44W6lByL9VQ\nSu+AYtO7s/8OlKFP3Xk75SZKbcYw7cLjJSH5Xu7wfMkFPCnB3WFkJhKZt3ybokH1\nHJ+Soh4fXfuOxJrCr1CUowDqKqUd4WWPRZ2p7CW7/PGObOJe4qaDeNkJIMqOFkFv\nkxUG6sWwjt2clVbPYc1lsrWSSwKBgQC5n4AbpQGC6eNietgu5jiGF0LTvwj4u8xQ\nyNm7eRQZKL72Q4OOAw0NjNsPGnCuGTpl80qj6ekJW1ZfLBwIMEoC7FfblZp8ehnx\nN+e0JLhv1kZuP9NZqD4WYW7/YiuEwNuF8xD0g+zjh1h/0nv8zVxeDqvLSbqul3VD\n+iJQzoGViQKBgQCXW+xBl1oDHZD7bqW9qj6tPWPGj2AEBxO9HIx5hsKbgIpdmT8+\nLYNnyPYMfm26igEn0h2I1S+9x7YIzq1+PS+qkDlWJKeXx67KFAEaVfT6GDd+vHzK\nayGd7wn/Tu5ox8rjYIyP1JSnTSJ0OII6TQ1z54nXcbXz56CkG5VRIK+DNwKBgBhA\nIEp8SjBCQjSxe+DUrvnFvDNRt+hXEKBVPSzi6p9G1Xvy4hMBjwkAJ/ZXK/Vy0lBT\ncqLrgkh4qFYSuy7OsDylh+zmJKKyiQUcmqbMTVQ/GEB7Ei+abVIbNJckyi6zy3o6\ngTKQsbggDI3Wf+BNLA4VuJf8b+kzXFyfJzCLah6RAoGBAL1d/olqO0QmtWK5D78S\nP6ShWY5Ds596rS0vUy23LF7b2Kl50WSMmq8c08Jof7d5KQpICIi5TKUCTUFTTZy5\neEYi8cjAUdRGqJkCARkksVd5bvUdI2tVUCe/tMA7pzkEgF+lwNhElg5b2NiRL7qv\nvyDFcgFqZy/9lt8Ff/DCOEIa\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@americanbox-e368b.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=105122186295108952007
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40americanbox-e368b.iam.gserviceaccount.com
FIREBASE_TYPE=service_account
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

### ⚠️ Importante:
- **NO subas el archivo `.env` a GitHub** - ya está en `.gitignore`
- **Copia manualmente** cada variable a Vercel
- **Verifica** que todas las variables estén configuradas correctamente
- **Re-despliega** tu aplicación después de agregar las variables

### Después de configurar las variables:
1. Haz commit y push de tus cambios a GitHub
2. Vercel detectará automáticamente el cambio y re-desplegará
3. Tu aplicación debería funcionar correctamente con Firebase/Firestore

### Verificación:
Una vez desplegado, puedes verificar que las variables estén funcionando visitando cualquier endpoint de la API que use Firebase.