-- Esquema para la BD de la panadería (3FN)
CREATE DATABASE IF NOT EXISTS basedesesperanza DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE basedesesperanza;

-- Usuarios (para login y roles)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('admin','user') NOT NULL DEFAULT 'user'
);

-- Productos (inventario)
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  url_imagen VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  temporada ENUM('normal','dia_de_muertos') NOT NULL DEFAULT 'normal'
);

-- Carrito asociado a session_id (temporal)
CREATE TABLE IF NOT EXISTS carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sesion_id VARCHAR(128) NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Ventas (historial). id_venta agrupa items de una compra
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT,
  nombre VARCHAR(100),
  precio DECIMAL(10,2),
  cantidad INT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
);

-- Datos iniciales
INSERT IGNORE INTO usuarios (usuario, contrasena, rol) VALUES ('admin','admin123','admin'), ('cliente','user123','user');

INSERT IGNORE INTO productos (nombre, url_imagen, precio, cantidad, temporada) VALUES
('Pan de Muerto Tradicional','/images/pandemuerto.jpg',18.00,50,'dia_de_muertos'),
('Calaverita de Azúcar','/images/calavera.jpg',12.50,30,'dia_de_muertos'),
('Concha','/images/concha.jpg',8.00,100,'normal'),
('Oreja','/images/oreja.jpg',10.00,40,'normal');
