# AmericanBox - Deployment en Hostinger

## 🚀 Pasos para deployment

### Paso 1: Subir archivos
1. **Conectar vía SSH**:
   ```bash
   ssh u582924658@45.152.46.128 -p 65002
   # Contraseña: 1532DAnILO-
   ```

2. **Subir archivos** (cualquiera de estas opciones):
   - **Opción A - File Manager**: Subir `americanbox-hostinger.zip` y descomprimir
   - **Opción B - SCP**: 
     ```bash
     scp -P 65002 americanbox-hostinger.zip u582924658@45.152.46.128:~/public_html/
     ```
   - **Opción C - Git**: 
     ```bash
     git clone https://github.com/dannylopez12/americanbox.git
     ```

### Paso 2: Configurar en Hostinger

1. **Conectar por SSH**:
   ```bash
   ssh u582924658@45.152.46.128 -p 65002
   ```

2. **Navegar y preparar**:
   ```bash
   cd ~/public_html/
   mkdir americanbox
   cd americanbox
   ```

3. **Copiar archivos necesarios**:
   ```bash
   # Si subiste el zip
   unzip ../americanbox-hostinger.zip
   
   # O copiar manualmente estos archivos:
   # - server-hostinger.js
   # - package-hostinger.json (renombrar a package.json)
   # - dist/ (carpeta completa)
   # - .env.hostinger (renombrar a .env)
   ```

4. **Instalar dependencias**:
   ```bash
   cp package-hostinger.json package.json
   cp .env.hostinger .env
   npm install
   ```

5. **Configurar PM2**:
   ```bash
   npm install -g pm2
   pm2 start server-hostinger.js --name "americanbox"
   pm2 startup
   pm2 save
   ```

### Paso 3: Configurar dominio

En el **panel de Hostinger**:
1. Ir a **Dominios** → **Gestionar**
2. **Configurar subdirectorio**: apuntar el dominio a `/public_html/americanbox/`
3. O configurar **proxy reverso** hacia `localhost:3000`

### 🔧 Comandos útiles

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs americanbox

# Reiniciar
pm2 restart americanbox

# Parar
pm2 stop americanbox

# Monitoreo
pm2 monit
```

### 📋 Archivos incluidos

- `server-hostinger.js` - Servidor Express completo
- `package-hostinger.json` - Dependencias 
- `.env.hostinger` - Variables de entorno
- `dist/` - Frontend compilado
- `deploy-hostinger.sh` - Script de deployment

### 🌐 URLs esperadas

- **Aplicación**: https://palevioletred-wasp-581512.hostingersite.com
- **API**: https://palevioletred-wasp-581512.hostingersite.com/api
- **Login**: admin/admin

### 🔥 Ventajas vs Vercel

- ✅ **Sin problemas de conexión**: Todo local
- ✅ **Sesiones persistentes**: Express sessions
- ✅ **Control total**: SSH access
- ✅ **Mejor rendimiento**: Servidor dedicado
- ✅ **Fácil debugging**: Logs directos