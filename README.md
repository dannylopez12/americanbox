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

1. **Conectar con Vercel**
   - Fork este repositorio
   - Conecta tu cuenta de Vercel
   - Importa el proyecto

2. **Variables de Entorno**
   ```env
   DB_HOST=tu-host-db
   DB_USER=tu-usuario
   DB_PASSWORD=tu-contraseña
   DB_NAME=americanbox_prod
   SESSION_SECRET=clave-super-secreta
   ```

3. **Base de Datos**
   - Usar PlanetScale, Railway o tu proveedor preferido
   - Importar esquema desde `database-schema.sql`

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