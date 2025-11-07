-- Agregar columna rol a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN rol enum('admin', 'user') NOT NULL DEFAULT 'user';