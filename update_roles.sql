-- Establecer roles para los usuarios existentes
UPDATE usuarios SET rol = 'admin' WHERE usuario = 'admin';
UPDATE usuarios SET rol = 'user' WHERE usuario = 'cliente';