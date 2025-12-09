// Cliente para manejar mapa de sucursales y formulario admin
document.addEventListener('DOMContentLoaded', async () => {

  // Cargar Leaflet si no existe
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
  if (!mapEl) return;

  // Inicializar mapa
  const map = L.map(mapEl).setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Capa de marcadores
  const markers = L.layerGroup().addTo(map);

  // Crear icono personalizado
  function crearIcono(url) {
    return L.icon({
      iconUrl: url,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
  }

  function escapeHtml(unsafe) {
    return String(unsafe).replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }

  // Cargar sucursales
  async function cargarSucursales() {
    try {
      const resp = await fetch('/api/sucursales');
      if (!resp.ok) throw new Error('Error cargando sucursales');

      const data = await resp.json();
      markers.clearLayers();

      const imagenDefault =
        "https://static.vecteezy.com/system/resources/previews/021/121/135/non_2x/bread-logo-bakery-and-pastry-shop-logo-illustration-vector.jpg";

      data.forEach(s => {
        const lat = Number(s.lat);
        const lng = Number(s.lng);
        const img = s.imagen || imagenDefault;

        const icono = crearIcono(img);

        const marker = L.marker([lat, lng], { icon: icono })
          .bindPopup(`
            <strong>${escapeHtml(s.nombre)}</strong><br>
            <img src="${img}" style="width: 120px; border-radius: 6px; margin-top: 6px;">
          `);

        markers.addLayer(marker);
      });

      // Ajustar mapa
      if (data.length > 0) {
        const group = L.featureGroup(
          data.map(s => L.marker([Number(s.lat), Number(s.lng)]))
        );
        map.fitBounds(group.getBounds().pad(0.2));
      }

    } catch (err) {
      console.error(err);
    }
  }

  await cargarSucursales();

  // ADMIN
  let usuario = null;
  try {
    if (window.verificarAutenticacion) {
      usuario = await window.verificarAutenticacion();
    }
  } catch (e) {}

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
        const imagen = document.getElementById('sucursal-img')?.value.trim();

        if (!nombre || !lat || !lng)
          return alert('Completa todos los campos');

        const latNum = Number(lat);
        const lngNum = Number(lng);

        if (Number.isNaN(latNum) || Number.isNaN(lngNum))
          return alert('Coordenadas inválidas');

        try {
          const resp = await fetch('/api/sucursales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre,
              lat: latNum,
              lng: lngNum,
              imagen: imagen || null
            })
          });

          const datos = await resp.json();
          if (!resp.ok) return alert(datos.error || 'Error agregando sucursal');

          alert('Sucursal agregada');

          document.getElementById('sucursal-nombre').value = '';
          document.getElementById('sucursal-lat').value = '';
          document.getElementById('sucursal-lng').value = '';
          if (document.getElementById('sucursal-img'))
            document.getElementById('sucursal-img').value = '';

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
