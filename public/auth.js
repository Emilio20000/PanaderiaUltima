// Verificar autenticación al cargar la página
async function verificarAutenticacion() {
    try {
        const respuesta = await fetch('/api/usuario');
        if (!respuesta.ok) {
            // No autenticado, redirigir al login
            window.location.href = '/index.html';
            return null;
        }
        const datos = await respuesta.json();
        return datos.usuario;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/index.html';
        return null;
    }
}

// Exportar la función para usarla en otros archivos
window.verificarAutenticacion = verificarAutenticacion;