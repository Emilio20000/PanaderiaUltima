document.addEventListener('DOMContentLoaded', () => {
  // Elementos para toggle entre login y registro (soporta formulario completo y panel compacto)
  const btnRegistro = document.getElementById('btn-registro');
  const btnLogin = document.getElementById('btn-login');
  const loginForm = document.getElementById('login-form');
  const registroForm = document.getElementById('registro-form');

  // Helper: validar y enviar registro al servidor
  async function submitRegistro({ usuario, email, contrasena }) {
    if (!usuario || !email || !contrasena) return alert('Todos los campos son obligatorios');
    if (usuario.length < 3) return alert('El usuario debe tener al menos 3 caracteres');
    if (contrasena.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');
    const gmailRe = /^[^@\s]+@gmail\.com$/i;
    if (!gmailRe.test(email)) return alert('Debes registrar un correo @gmail.com');

    try {
      const resp = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena, email })
      });
      const datos = await resp.json();
      if (!resp.ok) return alert(datos.error || 'Error al registrar');
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      return true;
    } catch (err) {
      console.error('Error registrando:', err);
      alert('Error al comunicarse con el servidor');
      return false;
    }
  }

  // Si existe el botón "Registrarse aquí" (compact)
  if (btnRegistro) {
    btnRegistro.addEventListener('click', (e) => {
      e.preventDefault();
      // Preferir modal si existe
      const modal = document.getElementById('registro-modal');
      if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        const first = modal.querySelector('input');
        if (first) first.focus();
        return;
      }

      // Fallback al panel inline
      const panel = document.getElementById('registro-panel');
      if (!panel) return;
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      if (panel.style.display === 'block') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const first = panel.querySelector('input');
        if (first) first.focus();
      } else if (loginForm) {
        loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // Si existe el botón de volver al login (opcional)
  if (btnLogin && loginForm) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const first = loginForm.querySelector('input');
      if (first) first.focus();
    });
  }

  // Manejo del formulario completo de registro (si está presente en la página)
  if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario_reg')?.value.trim();
      const email = document.getElementById('email_reg')?.value.trim();
      const contrasena = document.getElementById('contrasena_reg')?.value.trim();
      const ok = await submitRegistro({ usuario, email, contrasena });
      if (ok) registroForm.reset();
    });
  }

  // Manejo del panel compacto de registro (inputs y botones compactos)
  const registrarCompactBtn = document.getElementById('registrar_compact');
  const cerrarCompactBtn = document.getElementById('cerrar_registro_compact');
  const registroPanel = document.getElementById('registro-panel');

  if (registrarCompactBtn && registroPanel) {
    registrarCompactBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario_reg_compact')?.value.trim();
      const email = document.getElementById('email_reg_compact')?.value.trim();
      const contrasena = document.getElementById('contrasena_reg_compact')?.value.trim();
      const ok = await submitRegistro({ usuario, email, contrasena });
      if (ok) {
        // limpiar y ocultar panel compacto
        const inputs = registroPanel.querySelectorAll('input');
        inputs.forEach(i => i.value = '');
        registroPanel.style.display = 'none';
        if (loginForm) loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  if (cerrarCompactBtn && registroPanel) {
    cerrarCompactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      registroPanel.style.display = 'none';
      if (loginForm) loginForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Modal handlers (si existen)
  const modal = document.getElementById('registro-modal');
  const cerrarModal = document.getElementById('cerrar_modal');
  const cancelarModal = document.getElementById('cancelar_modal');
  const registroModalForm = document.getElementById('registro-form-modal');

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (cerrarModal) cerrarModal.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
  if (cancelarModal) cancelarModal.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (registroModalForm) {
    registroModalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usuario = document.getElementById('usuario_reg_modal')?.value.trim();
      const email = document.getElementById('email_reg_modal')?.value.trim();
      const contrasena = document.getElementById('contrasena_reg_modal')?.value.trim();
      const ok = await submitRegistro({ usuario, email, contrasena });
      if (ok) {
        registroModalForm.reset();
        closeModal();
      }
    });
  }
});
