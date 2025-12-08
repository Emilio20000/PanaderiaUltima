USE sql5811038;

-- Usuarios (para login y roles)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  rol ENUM('admin','user') NOT NULL DEFAULT 'user',
  fondos DECIMAL(15,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Productos (inventario)
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  url_imagen VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL DEFAULT 0,
  temporada ENUM('normal','navideño') NOT NULL DEFAULT 'normal'
) ENGINE=InnoDB;

-- Carrito asociado a session_id (temporal)
CREATE TABLE IF NOT EXISTS carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sesion_id VARCHAR(128) NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Ventas (historial). id_venta agrupa items de una compra
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT,
  nombre VARCHAR(100),
  precio DECIMAL(10,2),
  cantidad INT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ventas Cabecera
CREATE TABLE IF NOT EXISTS ventas_cab (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT, -- ¡CORREGIDO! Eliminamos NOT NULL para ON DELETE SET NULL
  total DECIMAL(15,2) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Ventas Detalle
CREATE TABLE IF NOT EXISTS ventas_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT,
  nombre VARCHAR(100),
  precio DECIMAL(10,2),
  cantidad INT,
  FOREIGN KEY (id_venta) REFERENCES ventas_cab(id_venta) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Datos iniciales
INSERT IGNORE INTO usuarios (usuario, contrasena, email, rol, fondos) VALUES 
('admin','admin123','admin@gmail.com','admin', 0),
('cliente','cliente123','cliente@gmail.com','user', 0);