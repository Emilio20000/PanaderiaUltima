document.addEventListener('DOMContentLoaded', () => {
  // Elementos para toggle entre login y registro
  const btnRegistro = document.getElementById('btn-registro');
  const btnLogin = document.getElementById('btn-login');
  const loginForm = document.getElementById('login-form');
  const registroForm = document.getElementById('registro-form');

  // Toggle a formulario de registro
  btnRegistro.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registroForm.style.display = 'block';
  });

  // Toggle a formulario de login
  btnLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registroForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // Manejo del formulario de registro
  const form = document.getElementById('registro-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('usuario_reg').value.trim();
    const email = document.getElementById('email_reg').value.trim();
    const contrasena = document.getElementById('contrasena_reg').value.trim();

    if (!usuario || !email || !contrasena) return alert('Todos los campos son obligatorios');
    if (usuario.length < 3) return alert('El usuario debe tener al menos 3 caracteres');
    if (contrasena.length < 6) return alert('La contraseña debe tener al menos 6 caracteres');

    // Validar correo Gmail
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
      // Opcional: redirigir al login o limpiar formulario
      form.reset();
    } catch (err) {
      console.error('Error registrando:', err);
      alert('Error al comunicarse con el servidor');
    }
  });
});
