let chart = null;

// Cargar estadísticas
async function cargarEstadisticas() {
  try {
    const respuesta = await fetch('/api/estadisticas/ventas-por-producto');
    
    if (!respuesta.ok) {
      console.error('Error al obtener estadísticas:', respuesta.statusText);
      return;
    }
    
    const datos = await respuesta.json();
    
    if (!datos || datos.length === 0) {
      document.getElementById('estadisticas-container').innerHTML = 
        '<p class="text-center text-muted">No hay datos de ventas aún.</p>';
      return;
    }
    
    // Preparar datos para Chart.js
    const panes = datos.map(d => d.nombre);
    const ventas = datos.map(d => d.total_vendido);
    
    // Obtener el contenedor
    const container = document.getElementById('estadisticas-container');
    
    // Crear el canvas si no existe
    if (!container.querySelector('canvas')) {
      container.innerHTML = '<div style="position: relative; width: 100%; height: 600px;"><canvas id="ventasChart"></canvas></div>';
    }
    
    const ctx = document.getElementById('ventasChart').getContext('2d');
    
    // Destruir gráfica anterior si existe
    if (chart) {
      chart.destroy();
    }
    
    // Crear nueva gráfica
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: panes,
        datasets: [{
          label: 'Número de Ventas',
          data: ventas,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14
              }
            }
          },
          title: {
            display: true,
            text: 'Ventas por Producto',
            font: {
              size: 18
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de Ventas',
              font: {
                size: 14
              }
            },
            ticks: {
              font: {
                size: 12
              }
            }
          },
          x: {
            title: {
              display: true,
              text: 'Productos',
              font: {
                size: 14
              }
            },
            ticks: {
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    document.getElementById('estadisticas-container').innerHTML = 
      '<p class="text-center text-danger">Error al cargar estadísticas.</p>';
  }
}

// Actualizar estadísticas cada 5 segundos
function iniciarActualizacion() {
  cargarEstadisticas();
  setInterval(cargarEstadisticas, 5000);
}

// Cargar estadísticas cuando el documento esté listo
document.addEventListener('DOMContentLoaded', iniciarActualizacion);
