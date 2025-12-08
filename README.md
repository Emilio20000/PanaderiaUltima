# La Desesperanza - Panadería API

Sistema de gestión de panadería con carrito, compras, usuario y funcionalidades admin.

## Requisitos

- Node.js v16+
- npm
- MySQL (local o remoto como freesqldatabase.com)

## Instalación

1. Clonar el repo:
```bash
git clone https://github.com/Emilio20000/Panaderialocalhost.git
cd Panaderialocalhost
```

2. Instalar dependencias:
```bash
npm install
```

3. **Crear la base de datos**: Ejecutar `BaseDesesperanza.sql` en tu servidor MySQL (phpMyAdmin, CLI, etc.)
   - Si usas **freesqldatabase.com**, accede a phpMyAdmin desde el panel y copia/pega el contenido de `BaseDesesperanza.sql`
   - Asegúrate de ejecutar `CREATE DATABASE IF NOT EXISTS basedesesperanza` primero, o ajusta el nombre según tu BD

4. Configurar variables de entorno (opcional para desarrollo local):
   ```
   DB_HOST=sql5.freesqldatabase.com
   DB_USER=sql5811038
   DB_PASSWORD=E9Ets8Qxlp
   DB_NAME=sql5811038
   PORT=3000
   SESSION_SECRET=tu_secreto_seguro
   NODE_ENV=development
   ```

5. Ejecutar la app:
```bash
npm start
```

La app estará en `http://localhost:3000`

## Características Implementadas

### Autenticación & Usuarios
- ✅ **Login** con usuario y contraseña (bcrypt)
- ✅ **Registro** con email @gmail.com obligatorio (solo usuarios normales)
- ✅ **Admin** con email `user@gmail.com` (no se puede crear via registro)
- ✅ **Sesiones** con renovación automática (24h)
- ✅ **CRUD de usuarios** (solo admin)
- ✅ **Fondos/saldo** por usuario (máximo: $999,999,999,999)

### Productos
- ✅ **CRUD completo** (solo admin puede crear/editar/borrar)
- ✅ **Temporada**: Normal o Navideño
- ✅ **Validaciones** en servidor: precio > 0, cantidad >= 0, temporada válida
- ✅ **Stock** se decrementa al comprar, se elimina si llega a 0

### Carrito & Compras
- ✅ **Carrito** asociado a sesión (no requiere login)
- ✅ **Agregar/eliminar** productos del carrito
- ✅ **Validación de stock** antes de agregar
- ✅ **Compra con transacción**:
  - Valida fondos del usuario
  - Descuenta fondos
  - Crea registro en `ventas_cab` (cabecera) y `ventas_detalle`
  - Actualiza stock
  - Elimina producto si queda en 0 unidades
- ✅ **Historial** de compras personales (`/api/mis-ventas`)

### Admin
- ✅ **Historial de ventas** completo con detalles
- ✅ **Gestión de productos** (CRUD)
- ✅ **Gestión de usuarios** (CRUD, ver fondos, cambiar rol)
- ✅ **Vista de compras** agrupadas por id_venta

## API Endpoints

### Autenticación
- `POST /api/registro` - Registrar nuevo usuario (email @gmail.com)
- `POST /api/iniciar-sesion` - Login
- `POST /api/cerrar-sesion` - Logout
- `GET /api/usuario` - Verificar sesión actual

### Usuarios (Admin)
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario específico
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario
- `POST /api/usuarios/fondos` - Agregar fondos al perfil

### Productos
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto (admin)
- `PUT /api/productos/:id` - Actualizar producto (admin)
- `DELETE /api/productos/:id` - Eliminar producto (admin)

### Carrito
- `POST /api/carrito/agregar` - Agregar producto al carrito
- `GET /api/carrito` - Obtener carrito actual
- `POST /api/carrito/eliminar` - Eliminar producto del carrito
- `POST /api/carrito/comprar` - Realizar compra (requiere sesión)

### Ventas (Admin & Usuarios)
- `GET /api/ventas` - Historial de ventas (admin)
- `GET /api/ventas/:id` - Detalles de una venta (admin)
- `GET /api/mis-ventas` - Historial personal del usuario (autenticado)

## Validaciones

### Front-end (register.js, login.js, main.js)
- Email @gmail.com obligatorio en registro
- Usuario mínimo 3 caracteres, contraseña mínimo 6
- Cantidad válida en carrito

### Back-end (app.js)
- Email @gmail.com obligatorio en `/api/registro`
- Rol siempre 'user' en nuevo registro (no permite crear admins)
- Precio: 0 < p <= 10,000,000
- Cantidad: 0 <= q <= 1,000,000,000
- Fondos: 0 <= f <= 999,999,999,999
- Stock insuficiente
- Fondos insuficientes en compra
- Transacciones ACID en compras y eliminación de carrito

## Seguridad

- Contraseñas con **bcrypt** (10 rounds)
- **Sesiones regeneradas** en login
- **Placeholders SQL** en todas las queries (previenen inyección SQL)
- **Transacciones ACID** en compras
- **Validaciones en servidor** (no confiar en cliente)
- **CSRF/XSS básicos** controlados por sesión

## Despliegue en Render

1. Conectar repo a Render (o hacer push a GitHub primero)
2. Crear nuevo Web Service desde Render
3. Configurar **Environment Variables**:
   ```
   DB_HOST=sql5.freesqldatabase.com
   DB_USER=sql5811038
   DB_PASSWORD=E9Ets8Qxlp
   DB_NAME=sql5811038
   SESSION_SECRET=tu_secreto_muy_seguro_aqui
   NODE_ENV=production
   ```
4. Ejecutar `npm start` o `node app.js`
5. Asegurarse de que `BaseDesesperanza.sql` ya esté ejecutado en la BD

## Estructura de Archivos

```
.
├── app.js                      # API Express principal
├── package.json                # Dependencias
├── BaseDesesperanza.sql        # Esquema y datos iniciales
├── public/
│   ├── index.html              # Login y registro
│   ├── home.html               # Catálogo, carrito, admin
│   ├── login.js                # Script de login
│   ├── register.js             # Script de registro
│   ├── main.js                 # Frontend (productos, carrito, admin CRUD)
│   ├── auth.js                 # Helper de autenticación
│   ├── style.css               # Estilos
│   └── images/                 # Imágenes
└── README.md                   # Este archivo
```

## Notas

- Las contraseñas en texto plano en `BaseDesesperanza.sql` se hashean automáticamente al arrancar la app (función `rehashPlainPasswords()`)
- El admin por defecto es `admin` con email `user@gmail.com` y contraseña `admin123`
- Los usuarios se crean con fondos = 0; deben agregar fondos antes de comprar
- El carrito se asocia a `session.id` (no requiere login previo, pero la compra sí)

## Troubleshooting

### "Table 'sql5811038.usuarios' doesn't exist"
→ Ejecuta `BaseDesesperanza.sql` en tu BD

### "Error al crear producto"
→ Verifica que:
  - Eres admin (rol = 'admin')
  - La sesión está activa
  - El precio es válido (> 0)
  - La temporada es 'normal' o 'navideño'

### "Error al registrar usuario"
→ Asegúrate de:
  - Email @gmail.com
  - Usuario no existe
  - Usuario >= 3 caracteres, contraseña >= 6

---

Última actualización: Diciembre 2025
