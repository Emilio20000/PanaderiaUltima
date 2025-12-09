// Script para que usuarios normales añadan fondos a su cuenta
document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación y rol del usuario
  try {
    const response = await fetch('/api/usuario');
    if (!response.ok) {
      // No autenticado, ocultar sección de fondos
      document.getElementById('fondos-section').style.display = 'none';
      return;
    }
    
    const usuario = await response.json();
    
    // Si es admin, ocultar sección de fondos (admin ve estadísticas en admin.html)
    if (usuario.rol === 'admin') {
      document.getElementById('fondos-section').style.display = 'none';
      return;
    }
    
    // Mostrar sección de fondos para usuarios normales
    document.getElementById('fondos-section').style.display = 'block';
    
    // Cargar fondos actuales
    actualizarFondos();
    
    // Event listener para botón "Sumar fondos"
    document.getElementById('btn-sumar-fondos').addEventListener('click', sumarFondos);
    
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    document.getElementById('fondos-section').style.display = 'none';
  }
});

async function sumarFondos() {
  const inputCantidad = document.getElementById('input-cantidad-fondos');
  const cantidad = parseFloat(inputCantidad.value);
  
  // Validaciones
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
      actualizarFondos();
      // Actualizar badge en el DOM (si existe)
      const badgeFondos = document.querySelector('[id="badge-fondos"]');
      if (badgeFondos) {
        const usuario = await fetch('/api/usuario').then(r => r.json());
        badgeFondos.textContent = `$${usuario.fondos.toLocaleString('es-MX')}`;
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
