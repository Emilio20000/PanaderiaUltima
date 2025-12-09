// Frontend para home.html: carga productos, carrito y CRUD básico para admin
document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const galeria = document.getElementById('galeria');
  const listaCarrito = document.getElementById('lista-carrito');
  const seccionCarrito = document.getElementById('seccion-carrito');
  const resumenCarrito = document.getElementById('resumen-carrito');
  const totalCarrito = document.getElementById('total-carrito');
  const btnComprar = document.getElementById('btn-comprar');
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  const btnAgregar = document.getElementById('btn-agregar');
  const modal = document.getElementById('modal-producto');
  const cerrarModal = document.getElementById('cerrar-modal');
  const formularioProducto = document.getElementById('formulario-producto');

  let esAdmin = false;
  let productosDisponibles = [];

  async function verificarUsuario() {
    try {
      const usuario = await verificarAutenticacion();
      if (!usuario) {
        throw new Error('No autenticado');
      }
      
      console.log('Usuario verificado:', usuario);
      esAdmin = usuario.rol === 'admin' || usuario.usuario === 'admin';
      
      const btnAgregar = document.getElementById('btn-agregar');
      if (btnAgregar) {
        btnAgregar.style.display = esAdmin ? 'inline-block' : 'none';
      }
      
      if (seccionCarrito) {
        seccionCarrito.style.display = esAdmin ? 'none' : 'block';
      }
      
      // Agregar enlace rápido a la sección de admin (usuarios) en el header
      try {
        let navAdmin = document.getElementById('nav-admin-users');
        if (esAdmin) {
          if (!navAdmin) {
            navAdmin = document.createElement('a');
            navAdmin.id = 'nav-admin-users';
            navAdmin.href = '/admin.html';
            navAdmin.className = 'btn btn-outline-light btn-sm me-2';
            navAdmin.textContent = 'Admin - Usuarios';
            const headerDiv = document.querySelector('header div');
            if (headerDiv) headerDiv.insertBefore(navAdmin, headerDiv.firstChild);
          }
        } else {
          if (navAdmin) navAdmin.remove();
        }
      } catch (e) {
        console.warn('No se pudo insertar enlace admin en header:', e);
      }

      // También mostrar botón dentro de la sección de sucursales para abrir admin users (más visible)
      try {
        const acciones = document.getElementById('admin-sucursal-actions');
        if (acciones) {
          let btnGestion = document.getElementById('btn-gestion-usuarios');
          if (esAdmin) {
            if (!btnGestion) {
              btnGestion = document.createElement('a');
              btnGestion.id = 'btn-gestion-usuarios';
              btnGestion.href = '/admin.html';
              btnGestion.className = 'btn btn-sm btn-secondary';
              btnGestion.textContent = 'Gestionar usuarios';
              acciones.appendChild(btnGestion);
            }
          } else {
            if (btnGestion) btnGestion.remove();
          }
        }
      } catch (e) {
        console.warn('No se pudo insertar boton gestionar usuarios:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Error en verificarUsuario:', error);
      return false;
    }
  }

  async function cargarProductos() {
    const respuesta = await fetch('/api/productos');
    const productos = await respuesta.json();
    productosDisponibles = productos; // Guardar para referencia
    galeria.innerHTML = '';
    productos.forEach(producto => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta p-2';
      tarjeta.style.width = '200px';
      tarjeta.innerHTML = `
        <img src="${producto.url_imagen}" alt="${producto.nombre}" style="width:100%;height:120px;object-fit:cover">
        <h5>${producto.nombre}</h5>
        <p>$${(Number(producto.precio) || 0).toFixed(2)}</p>
        <p class="text-secondary">Disponibles: ${Number(producto.cantidad) || 0}</p
        ${!esAdmin ? `
        <div class="d-flex gap-1 align-items-center">
          <input type="number" min="1" max="${Number(producto.cantidad) || 0}" value="1" style="width:70px" class="form-control entrada-cantidad">
          <br>
          <button class="btn btn-sm btn-primary btn-agregar">Agregar</button>
        </div>
        ` : ''}
      `;
      // controles de administrador
      if (esAdmin) {
        const filaAdmin = document.createElement('div');
        filaAdmin.className = 'mt-2 d-flex gap-1';
        filaAdmin.innerHTML = `<button class="btn btn-sm btn-warning btn-editar">Editar</button><button class="btn btn-sm btn-danger btn-borrar">Borrar</button>`;
        tarjeta.appendChild(filaAdmin);
      }
      // eventos
      if (!esAdmin) {
        const inputCantidad = tarjeta.querySelector('.entrada-cantidad');
        const btnAgregar = tarjeta.querySelector('.btn-agregar');
        
        // Actualizar estado del botón según disponibilidad
        const actualizarEstadoBoton = () => {
          const cantidadSeleccionada = Number(inputCantidad.value || 0);
          const disponible = Number(producto.cantidad || 0);
          btnAgregar.disabled = cantidadSeleccionada <= 0 || cantidadSeleccionada > disponible;
        };

        inputCantidad.addEventListener('change', actualizarEstadoBoton);
        inputCantidad.addEventListener('input', actualizarEstadoBoton);
        actualizarEstadoBoton();

        btnAgregar.addEventListener('click', async (e) => {
          const cantidad = Number(inputCantidad.value || 0);
          if (cantidad <= 0) return alert('Cantidad inválida');
          if (cantidad > producto.cantidad) return alert('No hay suficientes unidades disponibles');
          
          const respuesta = await fetch('/api/carrito/agregar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_producto: producto.id, cantidad: cantidad })
          });
          
          const datos = await respuesta.json();
          if (!respuesta.ok) return alert(datos.error || 'Error al agregar');
          
          // Actualizar cantidad disponible localmente
          producto.cantidad -= cantidad;
          actualizarEstadoBoton();
          
          // Actualizar la visualización de cantidad disponible
          const cantidadElement = tarjeta.querySelector('p:nth-child(3)');
          cantidadElement.textContent = `Disponible después de realizar la compra: ${producto.cantidad}`;
          await cargarCarrito();
        });
      }

      if (esAdmin) {
        tarjeta.querySelector('.btn-editar').addEventListener('click', () => abrirModal(producto));
        tarjeta.querySelector('.btn-borrar').addEventListener('click', async () => {
          if (!confirm('Confirmar borrado')) return;
          const respuesta = await fetch('/api/productos/' + producto.id, { method: 'DELETE' });
          const datos = await respuesta.json();
          if (!respuesta.ok) return alert(datos.error || 'Error');
          cargarProductos();
        });
      }

      galeria.appendChild(tarjeta);
    });
  }

  async function cargarCarrito() {
    const respuesta = await fetch('/api/carrito');
    if (!respuesta.ok) {
      console.error('Error al cargar el carrito:', await respuesta.text());
      return;
    }
    const items = await respuesta.json();
    let total = 0;

    if (items.length === 0) {
      listaCarrito.innerHTML = '<p class="text-muted text-center mb-0">No hay productos en el carrito</p>';
      totalCarrito.textContent = '0.00';
    } else {
      listaCarrito.innerHTML = items.map(item => {
        const precio = Number(item.precio) || 0;
        const cantidad = Number(item.cantidad) || 0;
        total += precio * cantidad;
        return `
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <div>
              <span class="fw-bold">${item.nombre}</span>
              <br>
              <small class="text-muted">
                ${cantidad} × $${precio.toFixed(2)}
              </small>
            </div>
            <div class="text-end">
              <div class="fw-bold mb-1">$${(precio * cantidad).toFixed(2)}</div>
              <button onclick="eliminarDelCarrito('${item.producto_id}')" class="btn btn-sm btn-outline-danger">
                Eliminar
              </button>
            </div>
          </div>
        `;
      }).join('');
      
      totalCarrito.textContent = total.toFixed(2);
    }

    // Actualizar estado del botón comprar
    btnComprar.disabled = items.length === 0;
  }

  async function eliminarDelCarrito(idProducto) {
    const respuesta = await fetch('/api/carrito/eliminar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_producto: idProducto })
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) return alert(datos.error || 'Error al eliminar del carrito');
    await cargarCarrito();
  }

  btnComprar.addEventListener('click', async () => {
    if (!confirm('Confirmar compra')) return;
    const respuesta = await fetch('/api/carrito/comprar', { method: 'POST' });
    const datos = await respuesta.json();
    if (!respuesta.ok) return alert(datos.error || 'Error al comprar');
    alert('Compra realizada con éxito');
    // Generar ticket en PDF usando jsPDF en cliente
    try {
      const idVenta = datos.id_venta;
      // Obtener detalles de la venta (endpoint para el propietario)
      const detallesResp = await fetch('/api/mis-ventas/' + idVenta);
      const detallesJson = detallesResp.ok ? await detallesResp.json() : null;
      const detalles = detallesJson && detallesJson.detalles ? detallesJson.detalles : [];
      const cab = detallesJson && detallesJson.cab ? detallesJson.cab : null;

      // Generar PDF
      try {
        const { jsPDF } = window.jspdf || (await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
        const doc = new jsPDF();
        const negocio = 'La Desesperanza';
        let y = 14;
        doc.setFontSize(16);
        doc.text(negocio, 14, y);
        doc.setFontSize(11);
        y += 8;
        doc.text('Fecha: ' + (cab ? cab.fecha : new Date().toLocaleString()), 14, y);
        y += 8;
        doc.text('Número de venta: ' + idVenta, 14, y);
        y += 10;
        doc.text('Productos comprados:', 14, y);
        y += 8;
        // Tabla simple de productos
        detalles.forEach(it => {
          const linea = `${it.nombre} x${it.cantidad}  $${(Number(it.precio)||0).toFixed(2)}`;
          doc.text(linea, 14, y);
          y += 7;
          if (y > 270) { doc.addPage(); y = 20; }
        });
        y += 6;
        doc.setFontSize(12);
        doc.text('Total: $' + (cab ? Number(cab.total).toFixed(2) : '0.00'), 14, y);
        // Descargar PDF
        doc.save('ticket_venta_' + idVenta + '.pdf');
      } catch (e) {
        console.error('Error generando PDF:', e);
      }
    } catch (e) {
      console.error('Error generando ticket:', e);
    }

    cargarProductos(); 
    cargarCarrito();
  });

  // Función global para eliminar del carrito
  window.eliminarDelCarrito = async function(idProducto) {
    try {
      const respuesta = await fetch('/api/carrito/eliminar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_producto: idProducto })
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error || 'Error al eliminar del carrito');
      
      // Actualizar la visualización
      await cargarCarrito();
      await cargarProductos(); // Recargar productos para actualizar cantidades disponibles
    } catch (error) {
      alert(error.message);
    }
  };

  btnCerrarSesion.addEventListener('click', async () => {
    await fetch('/api/cerrar-sesion', { method: 'POST' });
    window.location.href = '/index.html';
  });

  btnAgregar.addEventListener('click', () => abrirModal());
  cerrarModal?.addEventListener('click', () => cerrarVentanaModal());

  function abrirModal(producto) {
    document.getElementById('titulo-modal').textContent = producto ? 'Editar producto' : 'Nuevo producto';
    document.getElementById('producto-id').value = producto ? producto.id : '';
    document.getElementById('producto-nombre').value = producto ? producto.nombre : '';
    document.getElementById('producto-imagen').value = producto ? producto.url_imagen : '';
    document.getElementById('producto-precio').value = producto ? producto.precio : '';
    document.getElementById('producto-cantidad').value = producto ? producto.cantidad : '';
    document.getElementById('producto-temporada').value = producto ? producto.temporada : 'normal';
    modal.style.display = 'block';
  }
  function cerrarVentanaModal() { modal.style.display = 'none'; }

  formularioProducto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('producto-id').value;
    const datos = {
      nombre: document.getElementById('producto-nombre').value.trim(),
      url_imagen: document.getElementById('producto-imagen').value.trim(),
      precio: Number(document.getElementById('producto-precio').value),
      cantidad: Number(document.getElementById('producto-cantidad').value),
      temporada: document.getElementById('producto-temporada').value
    };
    // validación básica
    if (!datos.nombre || !datos.url_imagen || !datos.precio || datos.cantidad == null) return alert('Campos incompletos');
    const metodo = id ? 'PUT' : 'POST';
    const url = id ? '/api/productos/' + id : '/api/productos';
    const respuesta = await fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
    const resultado = await respuesta.json();
    if (!respuesta.ok) return alert(resultado.error || 'Error');
    alert('Guardado');
    cerrarVentanaModal(); cargarProductos();
  });

  // inicializar
  (async () => { await verificarUsuario(); await cargarProductos(); await cargarCarrito(); })();
});