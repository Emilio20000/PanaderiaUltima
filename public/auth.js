// Verificar autenticación al cargar la página
async function verificarAutenticacion() {
    try {
        const respuesta = await fetch('/api/usuario', {
            credentials: 'same-origin', // Importante: enviar cookies
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!respuesta.ok) {
            console.log('Respuesta no ok:', respuesta.status);
            if (window.location.pathname !== '/index.html') {
                window.location.href = '/index.html';
            }
            return null;
        }
        
        const datos = await respuesta.json();
        console.log('Usuario autenticado:', datos.usuario);
        
        // Si estamos en la página de login y ya estamos autenticados, redirigir a home
        if (window.location.pathname === '/index.html' && datos.usuario) {
            window.location.href = '/home.html';
            return datos.usuario;
        }
        
        return datos.usuario;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        if (window.location.pathname !== '/index.html') {
            window.location.href = '/index.html';
        }
        return null;
    }
}

// Exportar la función para usarla en otros archivos
window.verificarAutenticacion = verificarAutenticacion;

// Verificar autenticación inmediatamente al cargar el script
verificarAutenticacion();