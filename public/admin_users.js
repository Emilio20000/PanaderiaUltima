// admin_users.js — gestión de usuarios y gráficos para admin
document.addEventListener('DOMContentLoaded', () => {
  const adminSectionContainer = document.getElementById('admin-usuarios-section');
  if (!adminSectionContainer) return;

  // Esperar a que la autenticación esté resuelta y comprobar rol
  (async () => {
    const usuario = await window.verificarAutenticacion();
    if (!usuario) {
      adminSectionContainer.innerHTML = '<div class="alert alert-danger">No autenticado.</div>';
      return;
    }
    if (usuario.rol !== 'admin' && usuario.usuario !== 'admin') {
      adminSectionContainer.innerHTML = '<div class="alert alert-warning">Sección de administración (solo visible para admin).</div>';
      return;
    }

    const container = document.createElement('div');
    container.innerHTML = `
      <h3>Gestión de Usuarios</h3>
      <div id="usuarios-table" class="mb-3"></div>
      <div class="row">
        <div class="col-md-6">
          <h5>Distribución de fondos</h5>
          <canvas id="chart-fondos" height="200"></canvas>
        </div>
        <div class="col-md-6">
          <h5>Top balances</h5>
          <canvas id="chart-top" height="200"></canvas>
        </div>
      </div>
    `;
    adminSectionContainer.appendChild(container);

    let usuarios = [];

    async function cargarUsuarios() {
      try {
        const res = await fetch('/api/usuarios');
        if (!res.ok) throw new Error('No autorizado o error fetching');
        usuarios = await res.json();
        renderTabla();
        renderGraficos();
      } catch (e) {
        adminSectionContainer.innerHTML = '<div class="alert alert-danger">Necesitas ser admin para ver esta sección.</div>';
        console.error(e);
      }
    }

  function renderTabla() {
    const div = document.getElementById('usuarios-table');
    div.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'table table-sm';
    table.innerHTML = `
      <thead><tr><th>ID</th><th>Usuario</th><th>Email</th><th>Rol</th><th>Fondos</th><th>Acción</th></tr></thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.usuario}</td>
        <td>${u.email || ''}</td>
        <td>${u.rol || 'user'}</td>
        <td><span class="fw-bold" id="fondos-${u.id}">$${Number(u.fondos||0).toFixed(2)}</span></td>
        <td>
          <input type="number" min="0" max="${999999999999}" step="0.01" id="input-fondos-${u.id}" class="form-control form-control-sm d-inline-block" style="width:150px" placeholder="0.00">
          <button class="btn btn-sm btn-primary ms-1" data-id="${u.id}">Actualizar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    div.appendChild(table);

    // Asignar listeners a botones
    const botones = div.querySelectorAll('button[data-id]');
    botones.forEach(b => {
      b.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const input = document.getElementById('input-fondos-' + id);
        const valor = Number(input.value);
        if (isNaN(valor) || valor < 0) return alert('Fondos inválidos');
        if (valor > 999999999999) return alert('Fondos exceden el límite permitido');
        try {
          const resp = await fetch('/api/usuarios/' + id + '/fondos', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fondos: valor })
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'Error actualizando');
          document.getElementById('fondos-' + id).textContent = '$' + Number(data.fondos).toFixed(2);
          alert('Fondos actualizados');
          cargarUsuarios();
        } catch (err) {
          alert(err.message || 'Error');
        }
      });
    });
  }

  // Graficos simples usando Chart.js
  function renderGraficos() {
    // Preparar datos: distribución por rangos
    const ranges = [0, 100, 500, 2000, 10000, 50000, 100000, 1000000];
    const labels = ranges.map((r, i) => i === ranges.length -1 ? `${r}+` : `${r}-${ranges[i+1]-1}`);
    const counts = new Array(labels.length).fill(0);
    usuarios.forEach(u => {
      const f = Number(u.fondos || 0);
      let placed = false;
      for (let i=0;i<ranges.length;i++){
        const max = ranges[i+1] ? ranges[i+1]-1 : Infinity;
        if (f >= ranges[i] && f <= max) { counts[i]++; placed=true; break; }
      }
      if (!placed) counts[counts.length-1]++;
    });

    const ctx = document.getElementById('chart-fondos').getContext('2d');
    if (window._chartFondos) window._chartFondos.destroy();
    window._chartFondos = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: counts, backgroundColor: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949','#b07aa1','#ff9da7'] }] },
      options: { responsive: true }
    });

    // Top balances
    const top = usuarios.slice().sort((a,b)=>Number(b.fondos||0)-Number(a.fondos||0)).slice(0,8);
    const labelsTop = top.map(t=>t.usuario || ('id'+t.id));
    const dataTop = top.map(t=>Number(t.fondos||0));
    const ctx2 = document.getElementById('chart-top').getContext('2d');
    if (window._chartTop) window._chartTop.destroy();
    window._chartTop = new Chart(ctx2, {
      type: 'bar',
      data: { labels: labelsTop, datasets: [{ label: 'Fondos', data: dataTop, backgroundColor: '#4e79a7' }] },
      options: { responsive: true }
    });
  }

  // Cargar al inicio
  cargarUsuarios();
})();
});
