const express = require('express');
const mysql = require('mysql2');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const PORT = process.env.PORT || 3000;
const app = express();

// Configuración de body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sesiones (configuración segura para producción)
app.use(session({
  secret: process.env.SESSION_SECRET || 'cambiame_en_produccion',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60, // 1 hora
    secure: process.env.NODE_ENV === 'production' // Solo HTTPS en producción
  }
}));

// Servir contenido estático (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de base de datos
let pool;
if (process.env.DATABASE_URL) {
  // Configuración PostgreSQL para producción
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necesario para Render
    }
  });
} else {
  // Configuración MySQL para desarrollo local
  pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'n0m3l0',
    database: 'basedesesperanza',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Helper: middleware para asegurar sesión / roles
function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ error: 'No autorizado' });
}

function requireRole(rol) {
  return (req, res, next) => {
    if (req.session && req.session.usuario && req.session.usuario.rol === rol) return next();
    return res.status(403).json({ error: 'Permiso denegado' });
  };
}

// --- Rutas de autenticación ---
app.post('/api/iniciar-sesion', (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

  pool.query('SELECT id, usuario, contrasena, rol FROM usuarios WHERE usuario = ?', [usuario], (err, rows) => {
    if (err) {
      console.error('Error en BD al iniciar sesión:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    if (rows.length === 0) return res.status(400).json({ error: 'Credenciales inválidas' });
    const datosUsuario = rows[0];
    // ATENCIÓN: aquí se compara en texto claro. Para producción usar hashing (bcrypt).
    if (datosUsuario.contrasena !== contrasena) return res.status(400).json({ error: 'Credenciales inválidas' });

    // Guardar en sesión
    req.session.usuario = { id: datosUsuario.id, usuario: datosUsuario.usuario, rol: datosUsuario.rol };
    return res.json({ ok: true, rol: datosUsuario.rol });
  });
});

app.post('/api/cerrar-sesion', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destruyendo sesión:', err);
      return res.status(500).json({ error: 'No se pudo cerrar sesión' });
    }
    res.json({ ok: true });
  });
});

app.get('/api/usuario', (req, res) => {
  if (req.session && req.session.usuario) return res.json({ usuario: req.session.usuario });
  return res.status(401).json({ error: 'No autenticado' });
});

// --- Productos (CRUD) ---
app.get('/api/productos', (req, res) => {
  pool.query('SELECT id, nombre, url_imagen, precio, cantidad, temporada FROM productos', (err, rows) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    res.json(rows);
  });
});

app.post('/api/productos', requireAuth, requireRole('admin'), (req, res) => {
  const { nombre, url_imagen, precio, cantidad, temporada } = req.body;
  if (!nombre || !url_imagen || precio == null || cantidad == null || !temporada) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, url_imagen, precio, cantidad, temporada' });
  }
  pool.query('INSERT INTO productos (nombre, url_imagen, precio, cantidad, temporada) VALUES (?, ?, ?, ?, ?)',
    [nombre, url_imagen, precio, cantidad, temporada], (err, result) => {
      if (err) {
        console.error('Error insert product:', err);
        return res.status(500).json({ error: 'Error al crear producto' });
      }
      res.json({ ok: true, id: result.insertId });
    });
});

app.put('/api/productos/:id', requireAuth, requireRole('admin'), (req, res) => {
  const id = req.params.id;
  const { nombre, url_imagen, precio, cantidad, temporada } = req.body;
  if (!nombre || !url_imagen || precio == null || cantidad == null || !temporada) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, url_imagen, precio, cantidad, temporada' });
  }
  pool.query('UPDATE productos SET nombre=?, url_imagen=?, precio=?, cantidad=?, temporada=? WHERE id=?',
    [nombre, url_imagen, precio, cantidad, temporada, id], (err, result) => {
      if (err) {
        console.error('Error actualizando producto:', err);
        return res.status(500).json({ error: 'Error al actualizar producto' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ ok: true });
    });
});

app.delete('/api/productos/:id', requireAuth, requireRole('admin'), (req, res) => {
  const id = req.params.id;
  pool.query('DELETE FROM productos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error borrando producto:', err);
      return res.status(500).json({ error: 'Error al borrar producto' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true });
  });
});

// --- Carrito ---
// Añadir al carrito por sesión
app.post('/api/carrito/agregar', (req, res) => {
  const idSesion = req.session.id;
  const { id_producto, cantidad } = req.body;
  if (!id_producto || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'id_producto y cantidad válidos son requeridos' });
  }

  // Solo verificar que haya suficiente stock, pero no reservarlo aún
  pool.query('SELECT cantidad FROM productos WHERE id = ?', [id_producto], (err, rows) => {
    if (err) {
      console.error('Error comprobando stock:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const disponible = rows[0].cantidad;
    if (cantidad > disponible) {
      return res.status(400).json({ error: 'Cantidad solicitada mayor al stock disponible' });
    }

    // Comprobar si ya hay fila en carrito
    pool.query('SELECT id, cantidad FROM carrito WHERE sesion_id = ? AND producto_id = ?', 
      [idSesion, id_producto], (errCar, filasCarrito) => {
        if (errCar) {
          console.error('Error en carrito:', errCar);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        const cantidadAAgregar = Number(cantidad);

        if (filasCarrito.length === 0) {
          // Insertar nuevo item en carrito
          pool.query('INSERT INTO carrito (sesion_id, producto_id, cantidad) VALUES (?, ?, ?)',
            [idSesion, id_producto, cantidadAAgregar], (errIns) => {
              if (errIns) {
                console.error('Error al insertar en carrito:', errIns);
                return res.status(500).json({ error: 'Error al agregar al carrito' });
              }
              res.json({ ok: true });
            });
        } else {
          // Actualizar cantidad existente en carrito
          const nuevaCantidad = Number(filasCarrito[0].cantidad) + cantidadAAgregar;
          // Validar que la cantidad total no supere el stock
          if (nuevaCantidad > disponible) {
            return res.status(400).json({ error: 'La cantidad total en el carrito superaría el stock disponible' });
          }
          pool.query('UPDATE carrito SET cantidad = ? WHERE id = ?',
            [nuevaCantidad, filasCarrito[0].id], (errUpdCar) => {
              if (errUpdCar) {
                console.error('Error al actualizar carrito:', errUpdCar);
                return res.status(500).json({ error: 'Error al actualizar carrito' });
              }
              res.json({ ok: true });
            });
        }
    });
  });
});

app.get('/api/carrito', (req, res) => {
  const idSesion = req.session.id;
  pool.query('SELECT c.producto_id, c.cantidad, p.nombre, p.url_imagen, p.precio FROM carrito c JOIN productos p ON c.producto_id = p.id WHERE c.sesion_id = ?', [idSesion], (err, rows) => {
    if (err) {
      console.error('Error obteniendo carrito:', err);
      return res.status(500).json({ error: 'Error al obtener carrito' });
    }
    res.json(rows);
  });
});

// Eliminar item del carrito
app.post('/api/carrito/eliminar', (req, res) => {
  const idSesion = req.session.id;
  const { id_producto } = req.body;
  
  if (!id_producto) {
    return res.status(400).json({ error: 'ID de producto requerido' });
  }

  // Primero, obtener la cantidad actual para restaurarla al producto
  pool.query('SELECT cantidad FROM carrito WHERE sesion_id = ? AND producto_id = ?', 
    [idSesion, id_producto], (err, rows) => {
      if (err) {
        console.error('Error consultando carrito:', err);
        return res.status(500).json({ error: 'Error al eliminar del carrito' });
      }
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
      }
      
      const cantidadARestaurar = rows[0].cantidad;

      // Eliminar del carrito y restaurar cantidad al producto
      pool.getConnection((err, conn) => {
        if (err) {
          console.error('Error obteniendo conexión:', err);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        conn.beginTransaction(err => {
          if (err) {
            conn.release();
            return res.status(500).json({ error: 'Error del servidor' });
          }

          // Eliminar del carrito
          conn.query('DELETE FROM carrito WHERE sesion_id = ? AND producto_id = ?',
            [idSesion, id_producto], (err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  res.status(500).json({ error: 'Error al eliminar del carrito' });
                });
              }

              // Restaurar cantidad al producto
              conn.query('UPDATE productos SET cantidad = cantidad + ? WHERE id = ?',
                [cantidadARestaurar, id_producto], (err) => {
                  if (err) {
                    return conn.rollback(() => {
                      conn.release();
                      res.status(500).json({ error: 'Error al restaurar cantidad' });
                    });
                  }

                  conn.commit(err => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        res.status(500).json({ error: 'Error al confirmar cambios' });
                      });
                    }

                    conn.release();
                    res.json({ ok: true });
                  });
                });
            });
        });
      });
    });
});

// Checkout: crear venta, descontar inventario y vaciar carrito
app.post('/api/carrito/comprar', (req, res) => {
  const idSesion = req.session.id;
  // Obtener items del carrito
  pool.query('SELECT c.producto_id, c.cantidad, p.precio, p.nombre FROM carrito c JOIN productos p ON c.producto_id = p.id WHERE c.sesion_id = ?', [idSesion], (err, items) => {
    if (err) {
      console.error('Error al obtener carrito para compra:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    if (items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

    // Inicio de transacción para consistencia
    pool.getConnection((errConexion, conexion) => {
      if (errConexion) {
        console.error('Error obteniendo conexión:', errConexion);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      conexion.beginTransaction(errT => {
        if (errT) {
          conexion.release();
          console.error('Error al iniciar transacción:', errT);
          return res.status(500).json({ error: 'Error del servidor' });
        }

        // generar nuevo id_venta
        conexion.query('SELECT IFNULL(MAX(id_venta), 0) + 1 AS siguienteVenta FROM ventas', (errV, filasV) => {
          if (errV) return conexion.rollback(() => { conexion.release(); res.status(500).json({ error: 'Error generando id_venta' }); });
          const idVenta = filasV[0].siguienteVenta || 1;

          // Crear tareas para insertar ventas y actualizar stock
          const tareas = items.map(item => {
            return new Promise((resolve, reject) => {
              // Insertar venta
              conexion.query('INSERT INTO ventas (id_venta, id_producto, nombre, precio, cantidad, fecha) VALUES (?, ?, ?, ?, ?, NOW())',
                [idVenta, item.producto_id, item.nombre || '', item.precio, item.cantidad], (errIns) => {
                  if (errIns) return reject(errIns);
                  
                  // Actualizar stock del producto
                  conexion.query('UPDATE productos SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?',
                    [item.cantidad, item.producto_id, item.cantidad], (errUpd) => {
                      if (errUpd) return reject(errUpd);
                      
                      // Verificar que la actualización fue exitosa
                      if (errUpd?.affectedRows === 0) {
                        return reject(new Error('Stock insuficiente para el producto ' + item.nombre));
                      }
                      resolve();
                    });
                });
            });
          });

          Promise.all(tareas)
            .then(() => {
              // Vaciar carrito después de procesar la venta y actualizar stock
              conexion.query('DELETE FROM carrito WHERE sesion_id = ?', [idSesion], (errDel) => {
                if (errDel) return conexion.rollback(() => { conexion.release(); res.status(500).json({ error: 'Error al vaciar carrito' }); });
                conexion.commit(errC => {
                  if (errC) return conexion.rollback(() => { conexion.release(); res.status(500).json({ error: 'Error al confirmar venta' }); });
                  conexion.release();
                  res.json({ ok: true, id_venta: idVenta });
                });
              });
            })
            .catch(errTareas => {
              console.error('Error en tareas de compra:', errTareas);
              conexion.rollback(() => { conexion.release(); res.status(500).json({ error: 'Error procesando compra: ' + (errTareas.message || '') }); });
            });
        });
      });
    });
  });
});

// Historial de ventas
app.get('/api/ventas', requireAuth, requireRole('admin'), (req, res) => {
  pool.query('SELECT id_venta, id_producto, nombre, precio, cantidad, DATE_FORMAT(fecha, "%d/%m/%Y %H:%i:%s") as fecha_formateada FROM ventas ORDER BY id_venta DESC, fecha DESC', (err, filas) => {
    if (err) {
      console.error('Error obteniendo ventas:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json(filas);
  });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
