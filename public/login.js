const $enviar = document.getElementById("enviar"),
      $contrasena = document.getElementById("contrasena"),
      $usuario = document.getElementById("usuario"),
      $mostrar = document.getElementById("mostrar");

document.addEventListener("change", (e)=>{
    if(e.target === $mostrar){
        $contrasena.type = $mostrar.checked ? 'text' : 'password';
    }
});

document.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const usuario = $usuario.value.trim();
    const contrasena = $contrasena.value.trim();
    if (!usuario || !contrasena) {
        alert('Ingrese usuario y contraseña');
        return;
    }

    try {
        const respuesta = await fetch('/api/iniciar-sesion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) {
            alert(datos.error || 'Error al iniciar sesión');
            return;
        }
        // Esperar un momento para asegurarnos de que la sesión se establezca
        setTimeout(() => {
            window.location.href = '/home.html';
        }, 500);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('Error al comunicarse con el servidor');
    }
});