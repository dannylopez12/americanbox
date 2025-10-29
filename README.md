# 📦 AmericanBox - Sistema de Gestión de Paquetería

![AmericanBox](https://img.shields.io/badge/AmericanBox-Sistema%20de%20Paquetería-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MySQL](https://img.shields.io/badge/MySQL-8-orange)

Sistema completo de gestión de paquetería con dashboard administrativo y portal de cliente.

## 🚀 Características Principales

- **Dashboard Administrativo**: Gestión completa de órdenes, clientes y paquetes
- **Portal de Cliente**: Seguimiento de paquetes y gestión de perfil
- **Sistema de Quejas**: Comunicación cliente-administrador
- **Carga Masiva**: Subida de paquetes vía Excel
- **Tracking de Proveedores**: Integración con múltiples carriers
- **Pricing Dinámico**: Precios personalizados por cliente
- **Reportes Avanzados**: Análisis y exportación de datos
- **Ubicaciones Múltiples**: Miami y Doral

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** + Express
- **MySQL** con mysql2
- **Autenticación** con sesiones
- **Upload de archivos** con Multer
- **Procesamiento Excel** con XLSX

### Frontend
- **React 18** + TypeScript
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Recharts** para gráficos

## 📁 Estructura del Proyecto

```
americanbox/
├── americanbox-api/           # Backend API
│   ├── server.js             # Servidor principal
│   ├── package.json          # Dependencias backend
│   └── uploads/              # Archivos subidos
├── americanbox-react/        # Frontend React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── lib/             # Utilidades y API client
│   │   └── hooks/           # Custom hooks
│   ├── package.json         # Dependencias frontend
│   └── vite.config.ts       # Configuración Vite
├── vercel.json              # Configuración Vercel
└── README.md               # Este archivo
```

## 🚀 Despliegue

### Desarrollo Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/dannylopez12/americanbox.git
   cd americanbox
   ```

2. **Backend**
   ```bash
   cd americanbox-api
   npm install
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd americanbox-react
   npm install
   npm run dev
   ```

### Producción en Vercel

> ⚠️ **Importante**: Este proyecto usa **Firebase/Firestore** como base de datos, optimizada para serverless y Vercel.

#### 1. **Configurar Firebase**
- ✅ Sigue la guía completa: [FIREBASE-MIGRATION-GUIDE.md](./FIREBASE-MIGRATION-GUIDE.md)
- ✅ Crea proyecto en Firebase Console
- ✅ Configura Firestore Database
- ✅ Obtén credenciales de service account

#### 2. **Variables de Entorno en Vercel**
```env
FIREBASE_PROJECT_ID=americanbox-prod
FIREBASE_PRIVATE_KEY_ID=tu-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@americanbox-prod.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=tu-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

#### 3. **Migrar Datos**
```bash
# Instalar dependencias
npm install

# Migrar datos de MySQL a Firebase
node migrate-to-firebase.js
```

#### 4. **Deploy y Verificar**
- Vercel detectará automáticamente la configuración
- El frontend se construirá desde `americanbox-react/`
- Las APIs serverless usarán Firebase/Firestore

## 🗄️ Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema (admin/client)
- **orders**: Órdenes y paquetes
- **addresses**: Direcciones de envío
- **categories**: Categorías de productos
- **providers**: Proveedores de shipping
- **complaints**: Sistema de quejas y sugerencias

### Configuración

```sql
CREATE DATABASE americanbox_prod;
-- Importar desde americanbox_export.sql
```

## 🔐 Autenticación

### Roles de Usuario
- **Admin**: Acceso completo al sistema
- **Client**: Portal de cliente con funcionalidades limitadas

### Endpoints Principales

#### Autenticación
- `POST /api/register` - Registro de usuarios
- `POST /api/login` - Inicio de sesión
- `POST /api/logout` - Cerrar sesión

#### Admin
- `GET /api/admin/stats` - Estadísticas del dashboard
- `GET /api/admin/orders` - Gestión de órdenes
- `GET /api/admin/complaints` - Gestión de quejas

#### Cliente
- `GET /api/client/orders` - Mis órdenes
- `POST /api/client/complaints` - Enviar quejas

## 📊 Funcionalidades Avanzadas

### Sistema de Quejas
- Clientes pueden enviar quejas y sugerencias
- Administradores pueden responder y gestionar estados
- Sistema de prioridades (Baja, Media, Alta, Crítica)

### Carga Masiva de Paquetes
- Upload de archivos Excel
- Procesamiento automático con validaciones
- Template descargable para usuarios

### Tracking de Proveedores
- Integración con múltiples carriers
- Códigos de tracking automáticos
- Estados de envío en tiempo real

### Pricing Dinámico
- Precios personalizados por cliente
- Cálculo automático basado en peso
- Sistema de tarifas flexibles

## 🛡️ Seguridad

- Autenticación basada en sesiones
- Validación de datos en backend
- Sanitización de inputs
- Rate limiting para APIs
- CORS configurado correctamente

## 📈 Performance

- Código minificado en producción
- Lazy loading de componentes
- Optimización de imágenes
- Cache de recursos estáticos
- Compresión GZIP habilitada

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, por favor abre un [issue](https://github.com/dannylopez12/americanbox/issues).

---

**Desarrollado con ❤️ para AmericanBox**