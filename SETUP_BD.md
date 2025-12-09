# Pasos para conectar la BD y hacer pruebas

## 1. Crear las tablas en freesqldatabase.com

### Opción A: Usar phpMyAdmin (más fácil)

1. Accede a tu cuenta en **freesqldatabase.com**
2. Clic en "phpMyAdmin"
3. Selecciona tu base de datos (ej. `sql5811038`)
4. Ve a la pestaña **"SQL"**
5. Copia y pega TODO el contenido de `BaseDesesperanza.sql`
6. Clic en **"Go"** para ejecutar

### Opción B: Usar línea de comandos (CLI)

```bash
# Si tienes MySQL instalado localmente:
mysql -h sql5.freesqldatabase.com -u sql5811038 -p < BaseDesesperanza.sql
# Te pedirá contraseña: E9Ets8Qxlp
```

---

## 2. Verificar que las tablas se crearon

En phpMyAdmin, verifica que existan:
- `usuarios`
- `productos`
- `carrito`
- `ventas`
- `ventas_cab`
- `ventas_detalle`

---

## 3. Pruebas locales

```bash
# 1. Arrancar la app
npm start

# 2. Abre en navegador
http://localhost:3000
```

### Casos de prueba:

**A) Login admin**
- Usuario: `admin`
- Contraseña: `admin123`
- Email (mostrado al iniciar): `user@gmail.com` ✅

**B) Registrar nuevo usuario**
- Clic en "Registrarse"
- Usuario: `test_user`
- Email: `test_user@gmail.com` (OBLIGATORIO @gmail.com)
- Contraseña: `123456`
- Clic "Registrarse"
- ✅ Debe aparecer "Registro exitoso"

**C) Login con nuevo usuario**
- Usuario: `test_user`
- Contraseña: `123456`
- ✅ Debe ir a home.html

**D) Agregar fondos**
- Estando logueado como usuario normal, ve al perfil (próxima feature)
- Agrega fondos (ej. $100)
- ✅ Los fondos deben aparecer en el perfil

**E) Carrito**
- Como admin, crea un producto nuevo:
  - Nombre: "Pan de maíz"
  - URL: `https://via.placeholder.com/150`
  - Precio: `5.00`
  - Cantidad: `50`
  - Temporada: "Normal"
  - Clic "Guardar"
- Como usuario normal, agrega al carrito
- Compra (si tienes fondos)
- ✅ Fondos se descuentan, producto se va del stock

**F) Admin - Historial de ventas**
- Logueate como admin
- Verás un botón "Historial de ventas" (próxima feature)
- ✅ Debe mostrar todas las compras con usuario, total, fecha

---

## 4. Desplegar en Render

1. Asegúrate de que el código esté en GitHub: **✅ LISTO** (ya hicimos push)
2. Crea nuevo Web Service en Render:
   - Conecta el repo: `Emilio20000/Panaderialocalhost`
   - Build command: `npm install`
   - Start command: `npm start`
3. Configura Environment Variables:
   ```
   DB_HOST=sql5.freesqldatabase.com
   DB_USER=sql5811038
   DB_PASSWORD=E9Ets8Qxlp
   DB_NAME=sql5811038
   SESSION_SECRET=miSecreto123456Seguro
   NODE_ENV=production
   ```
4. Deploy ✅
5. La app estará en: `https://tu-app-name.onrender.com`

---

## 5. Próximas features a implementar (opcional)

- [ ] Página de perfil de usuario (ver/editar fondos, historial)
- [ ] Agregar fondos desde interfaz
- [ ] Historial de ventas para admin (tabla/gráficos)
- [ ] Validaciones visuales de error (no usar alert)
- [ ] Logout seguro

---

## Troubleshooting

### "Table doesn't exist"
→ Ejecutaste el SQL? Verifica en phpMyAdmin que las tablas existan

### "Error al crear producto"
→ ¿Eres admin? Log in con `admin` / `admin123`

### "Solo se permiten correos @gmail.com"
→ En registro, usa un email que termine en `@gmail.com`

### "Fondos insuficientes"
→ Primero debes agregar fondos al perfil (feature próxima)

---

¡Avísame cuando hayas ejecutado el SQL y probado! 🚀
