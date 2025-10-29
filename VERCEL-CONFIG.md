# Vercel Deployment Configuration

## 🚨 CRÍTICO: Variables de Entorno Requeridas

**El login NO funcionará hasta que configures las variables de entorno en Vercel.**

### Pasos para configurar:

1. **Ve a Vercel Dashboard**: https://vercel.com/dashboard
2. **Selecciona tu proyecto** `americanbox`
3. **Ve a Settings** → **Environment Variables**
4. **Agrega estas variables**:

```
DB_HOST=tu-host-mysql-hostinger
DB_USER=tu-usuario-mysql
DB_PASSWORD=tu-password-mysql
DB_NAME=tu-base-datos
NODE_ENV=production
```

### Valores típicos para Hostinger:
- **DB_HOST**: `154.49.142.XXX` (IP de tu servidor MySQL)
- **DB_USER**: `u582924658` (tu usuario de Hostinger)
- **DB_PASSWORD**: La contraseña que configuraste
- **DB_NAME**: `u582924658_americanbox` (tu base de datos)

## Problemas Comunes

### "Configuración de base de datos incompleta"
- Falta configurar variables de entorno en Vercel

### "Credenciales inválidas"
- Usuario/contraseña incorrectos
- Usuario no existe en tabla `users`

### No redirige después del login
- Revisa consola del navegador (F12)
- Backend debe devolver `redirect` correcto

## Testing

```bash
# Test API
curl https://tu-app.vercel.app/api/test

# Test login
curl -X POST https://tu-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"tu-pass"}'
```