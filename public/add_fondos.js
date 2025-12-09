document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/usuario');
    if (!response.ok) {
      document.getElementById('fondos-section').style.display = 'none';
      return;
    }
    
    const usuario = await response.json();
    
    if (usuario.rol === 'admin') {
      document.getElementById('fondos-section').style.display = 'none';
      return;
    }
    
    document.getElementById('fondos-section').style.display = 'block';
    actualizarFondos();
    document.getElementById('btn-sumar-fondos').addEventListener('click', sumarFondos);
    
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    document.getElementById('fondos-section').style.display = 'none';
  }
});

function actualizarBadgeFondos(fondos) {
  let badge = document.getElementById('user-fondos');
  if (badge) {
    badge.textContent = `Fondos: $${Number(fondos).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

async function sumarFondos() {
  const inputCantidad = document.getElementById('input-cantidad-fondos');
  const cantidad = parseFloat(inputCantidad.value);
  
  if (isNaN(cantidad) || cantidad <= 0) {
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
    
    if (response.ok) {
      inputCantidad.value = '';
      alert('Fondos añadidos exitosamente');
      
      const usuarioResponse = await fetch('/api/usuario');
      if (usuarioResponse.ok) {
        const usuario = await usuarioResponse.json();
        actualizarFondos();
        actualizarBadgeFondos(usuario.fondos);
      }
    } else {
      const error = await response.json();
      alert('Error: ' + (error.error || 'No se pudieron añadir los fondos'));
    }
  } catch (error) {
    console.error('Error al sumar fondos:', error);
    alert('Error al procesar la solicitud');
  }
}

async function actualizarFondos() {
  try {
    const response = await fetch('/api/usuario');
    if (response.ok) {
      const usuario = await response.json();
      document.getElementById('fondos-actuales').textContent = `$${usuario.fondos.toLocaleString('es-MX')}`;
    }
  } catch (error) {
    console.error('Error al obtener fondos:', error);
  }
}
