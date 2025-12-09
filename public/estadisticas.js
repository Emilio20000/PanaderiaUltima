// estadisticas.js — gráfico de ventas por producto (admin)
document.addEventListener('DOMContentLoaded', () => {
  const estadisticasContainer = document.getElementById('estadisticas-container');
  if (!estadisticasContainer) return;

  // Esperar a autenticación y verificar que sea admin
  (async () => {
    const usuario = await window.verificarAutenticacion();
    if (!usuario) {
      estadisticasContainer.innerHTML = '<div class="alert alert-danger">No autenticado.</div>';
      return;
    }
    if (usuario.rol !== 'admin' && usuario.usuario !== 'admin') {
      estadisticasContainer.innerHTML = '<div class="alert alert-warning">Sección de administración (solo visible para admin).</div>';
      return;
    }

    const container = document.createElement('div');
    container.innerHTML = `
      <h3>Estadísticas de Ventas</h3>
      <div class="mb-3">
        <button id="btn-actualizar-stats" class="btn btn-sm btn-primary">Actualizar</button>
      </div>
      <canvas id="chart-ventas" height="80"></canvas>
    `;
    estadisticasContainer.appendChild(container);

    let chartInstance = null;

    async function cargarEstadisticas() {
      try {
        const res = await fetch('/api/estadisticas/ventas-por-producto');
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        const datos = await res.json();
        renderGrafico(datos);
      } catch (e) {
        console.error('Error cargando estadísticas:', e);
        estadisticasContainer.innerHTML = '<div class="alert alert-danger">Error cargando estadísticas: ' + e.message + '</div>';
      }
    }

    function renderGrafico(datos) {
      const ctx = document.getElementById('chart-ventas');
      if (!ctx) return;
      
      if (chartInstance) chartInstance.destroy();

      const labels = datos.map(d => d.nombre || 'Sin nombre');
      const dataValues = datos.map(d => Number(d.total_vendido || 0));

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Número de ventas',
            data: dataValues,
            backgroundColor: '#4e79a7',
            borderColor: '#2c5aa0',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'x',
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Cantidad vendida' } },
            x: { title: { display: true, text: 'Productos' } }
          },
          plugins: {
            legend: { display: true }
          }
        }
      });
    }

    // Botón actualizar
    const btnActualizar = document.getElementById('btn-actualizar-stats');
    if (btnActualizar) {
      btnActualizar.addEventListener('click', cargarEstadisticas);
    }

    // Cargar al inicio
    cargarEstadisticas();
  })();
});
