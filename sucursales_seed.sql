-- Archivo: sucursales_seed.sql
-- Descripción: CREATE TABLE compatible sin filas de ejemplo para importar en phpMyAdmin
-- Consejo: en phpMyAdmin selecciona la base de datos a la izquierda antes de ejecutar este SQL

CREATE TABLE IF NOT EXISTS `sucursales` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `direccion` VARCHAR(255) DEFAULT NULL,
  `lat` DECIMAL(10,7) NOT NULL,
  `lng` DECIMAL(10,7) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Para crear la tabla en phpMyAdmin:
-- 1) Selecciona la base de datos correcta en la columna izquierda.
-- 2) Ve a la pestaña SQL, pega este archivo y pulsa "Continuar" / "Go".
-- 3) Verifica con: SELECT * FROM `sucursales` LIMIT 10;
