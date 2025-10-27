# 🎯 Sistema de Quejas y Sugerencias - Guía Completa

## ✅ COMPLETADO - Sistema Funcional

El sistema de quejas y sugerencias ya está completamente implementado y funcionando. Aquí te explico cómo usar ambos lados:

---

## 📱 LADO DEL CLIENTE

### 1. Acceder a Quejas
- Inicia sesión como cliente
- En el dashboard, verás en el menú lateral: **"Quejas y Sugerencias"**
- Haz clic para acceder a la sección

### 2. Enviar Nueva Queja
- Haz clic en **"Nueva Queja"**
- Completa el formulario:
  - **Asunto**: Título breve de la queja
  - **Mensaje**: Descripción detallada
  - **Prioridad**: Baja, Media, Alta, Crítica
- Haz clic en **"Enviar Queja"**

### 3. Ver Mis Quejas
- La sección muestra todas tus quejas enviadas
- Puedes ver:
  - ✅ Estado (Pendiente, En Proceso, Resuelta, Cerrada)
  - 📊 Prioridad
  - 📅 Fecha de creación
  - 💬 Respuesta del admin (si existe)

---

## 👨‍💼 LADO DEL ADMIN

### 1. Acceder a Quejas del Admin
- Inicia sesión como administrador
- En el menú lateral, busca **"Paquetería"** → **"T. Reclamo"**
- Esta sección ahora muestra las quejas de los clientes

### 2. Ver Quejas de Clientes
La interfaz del admin muestra:
- 📋 Lista de todas las quejas
- 👤 Información del cliente (nombre, email)
- 📊 Estado y prioridad
- 📅 Fechas de creación y actualización
- 💬 Respuestas previas del admin

### 3. Filtros Disponibles
- 🔍 **Búsqueda**: Por asunto, mensaje o nombre del cliente
- 📊 **Estado**: Pendiente, En Progreso, Resuelta, Cerrada
- ⚡ **Prioridad**: Baja, Media, Alta, Crítica
- 🧹 **Limpiar**: Quita todos los filtros

### 4. Responder a Quejas
- Haz clic en **"Responder"** en cualquier queja
- Se abre un modal con:
  - 📋 **Queja original**: Texto completo
  - ✍️ **Campo de respuesta**: Escribe tu respuesta
  - 📊 **Cambiar estado**: Actualiza el estado de la queja
- Haz clic en **"Enviar Respuesta"**

### 5. Cambio Rápido de Estado
- Usa el dropdown al lado del botón "Responder"
- Cambia directamente el estado sin escribir respuesta

---

## 🗄️ BASE DE DATOS

### Tabla: `complaints`
```sql
- id: Identificador único
- user_id: ID del cliente que envía la queja
- subject: Asunto de la queja
- description: Descripción detallada
- status: pending | in_progress | resolved | closed
- priority: low | medium | high | critical
- admin_response: Respuesta del administrador
- admin_user_id: ID del admin que respondió
- order_id: Orden relacionada (opcional)
- created_at: Fecha de creación
- updated_at: Fecha de última actualización
```

---

## 🔗 ENDPOINTS DISPONIBLES

### Cliente:
- `POST /api/client/complaints` - Enviar queja
- `GET /api/client/complaints` - Ver mis quejas

### Admin:
- `GET /api/admin/complaints` - Ver todas las quejas
- `PUT /api/admin/complaints/:id/respond` - Responder a queja
- `PUT /api/admin/complaints/:id/status` - Cambiar solo el estado

---

## 🧪 DATOS DE PRUEBA

Ya tienes 2 quejas de muestra en la base de datos:

1. **Danny Lopez**: "Problema con el peso del paquete" (Prioridad: Alta)
2. **Usuario Prueba Casillero**: "Retraso en la entrega" (Prioridad: Media)

---

## 🎉 ¡LISTO PARA USAR!

El sistema está completamente funcional. Los clientes pueden enviar quejas desde su dashboard y los administradores pueden gestionarlas desde la sección "T. Reclamo" en el admin.

**¡Pruébalo ahora mismo!** 🚀