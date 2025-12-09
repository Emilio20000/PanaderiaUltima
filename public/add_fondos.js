document.addEventListener('DOMContentLoaded', async () => {
  try {
    const usuario = await fetchUsuario();
    if (!usuario) {
      document.getElementById('fondos-section').style.display = 'none';
      return;
    }

    if (usuario.rol === 'admin') {
      document.getElementById('fondos-section').style.display = 'none';
      return;
    }

    document.getElementById('fondos-section').style.display = 'block';
    actualizarFondos();

    document.getElementById('btn-sumar-fondos')
      .addEventListener('click', sumarFondos);

  } catch (error) {
    console.error('Error al verificar usuario:', error);
    document.getElementById('fondos-section').style.display = 'none';
  }
});

/* --------------------------------------------------------
   NORMALIZA /api/usuario para evitar NaN y valores en 0
-------------------------------------------------------- */
async function fetchUsuario() {
  try {
    const response = await fetch('/api/usuario');
    if (!response.ok) return null;

    const data = await response.json();

    // si la respuesta tiene "usuario", úsala; si no, usa la data completa
    return data.usuario ? data.usuario : data;

  } catch (err) {
    console.error("Error fetchUsuario:", err);
    return null;
  }
}

/* --------------------------------------------------------
   Actualiza el badge del navbar
-------------------------------------------------------- */
function actualizarBadgeFondos(fondos) {
  let badge = document.getElementById('user-fondos');
  if (!badge) return;

  const valor = Number(fondos) || 0;
  badge.textContent = `Fondos: $${valor.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* --------------------------------------------------------
   Sumar fondos
-------------------------------------------------------- */
async function sumarFondos() {
  const inputCantidad = document.getElementById('input-cantidad-fondos');
  const cantidad = Number(inputCantidad.value.replace(/,/g, ''));

  if (!cantidad || cantidad <= 0) {
    alert('Por favor ingresa una cantidad válida');
    return;
  }

  if (cantidad > 999999999999) {
    alert('La cantidad no puede exceder 999,999,999,999 pesos');
    return;
  }

  try {
    const response = await fetch('/api/usuarios/fondos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad })
    });

    if (!response.ok) {
      const error = await response.json();
      alert('Error: ' + (error.error || 'No se pudieron añadir los fondos'));
      return;
    }

    inputCantidad.value = '';
    alert('Fondos añadidos exitosamente');

    const usuario = await fetchUsuario();
    actualizarFondos();
    actualizarBadgeFondos(usuario.fondos);

  } catch (error) {
    console.error('Error al sumar fondos:', error);
    alert('Error al procesar la solicitud');
  }
}

/* --------------------------------------------------------
   Actualizar fondos en pantalla
-------------------------------------------------------- */
async function actualizarFondos() {
  try {
    const usuario = await fetchUsuario();
    if (!usuario) return;

    const fondos = Number(usuario.fondos) || 0;

    document.getElementById('fondos-actuales').textContent =
      `$${fondos.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;

    actualizarBadgeFondos(fondos);

  } catch (error) {
    console.error('Error al obtener fondos:', error);
  }
}
