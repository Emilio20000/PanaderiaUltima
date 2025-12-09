// Cliente para manejar mapa de sucursales y formulario admin
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar Leaflet CSS/JS dinámicamente si no están presentes
  function loadLeaflet() {
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(script);
      return new Promise((resolve) => {
        script.onload = () => resolve();
      });
    }
    return Promise.resolve();
  }

  await loadLeaflet();

  const mapEl = document.getElementById('map');
  if (!mapEl) return; // nada que hacer

  // Inicializar mapa
  const map = L.map(mapEl).setView([0,0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Cargar sucursales desde backend
  async function cargarSucursales() {
    try {
      const resp = await fetch('/api/sucursales');
      if (!resp.ok) throw new Error('Error cargando sucursales');
      const data = await resp.json();
      markers.clearLayers();
      data.forEach(s => {
        const m = L.marker([Number(s.lat), Number(s.lng)])
          .bindPopup(`<strong>${escapeHtml(s.nombre)}</strong>`)
          .addTo(markers);
      });
      if (data.length) {
        const group = L.featureGroup(data.map(s => L.marker([Number(s.lat), Number(s.lng)])));
        map.fitBounds(group.getBounds().pad(0.2));
      }
    } catch (err) {
      console.error(err);
    }
  }

  // capa de marcadores
  const markers = L.layerGroup().addTo(map);

  function escapeHtml(unsafe) {
    return String(unsafe).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]; });
  }

  await cargarSucursales();

  // Mostrar formulario si el usuario es admin
  let usuario = null;
  try {
    if (window.verificarAutenticacion) {
      usuario = await window.verificarAutenticacion();
    }
  } catch (e) { /* ignore */ }

  const form = document.getElementById('form-sucursal');
  const adminActions = document.getElementById('admin-sucursal-actions');
  if (usuario && usuario.rol === 'admin') {
    if (form) form.style.display = 'block';
    if (adminActions) {
      const note = document.createElement('span');
      note.innerText = 'Modo Admin: agregar sucursales';
      adminActions.appendChild(note);
    }

    const btnGuardar = document.getElementById('btn-guardar-sucursal');
    if (btnGuardar) {
      btnGuardar.addEventListener('click', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('sucursal-nombre')?.value.trim();
        const lat = document.getElementById('sucursal-lat')?.value.trim();
        const lng = document.getElementById('sucursal-lng')?.value.trim();
        if (!nombre || !lat || !lng) return alert('Completa todos los campos');
        const latNum = Number(lat);
        const lngNum = Number(lng);
        if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return alert('Coordenadas inválidas');
        try {
          const resp = await fetch('/api/sucursales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, lat: latNum, lng: lngNum })
          });
          const datos = await resp.json();
          if (!resp.ok) return alert(datos.error || 'Error agregando sucursal');
          alert('Sucursal agregada');
          document.getElementById('sucursal-nombre').value = '';
          document.getElementById('sucursal-lat').value = '';
          document.getElementById('sucursal-lng').value = '';
          cargarSucursales();
        } catch (err) {
          console.error(err);
          alert('Error comunicándose con el servidor');
        }
      });
    }
  } else {
    if (form) form.style.display = 'none';
  }
});
