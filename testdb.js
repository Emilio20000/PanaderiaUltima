const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'sql5.freesqldatabase.com',
      user: process.env.DB_USER || 'sql5811038',
      password: process.env.DB_PASSWORD || 'E9Ets8Qxlp',
      database: process.env.DB_NAME || 'sql5811038',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      connectTimeout: 5000
    });

    const [rows] = await conn.query('SELECT NOW() as now');
    console.log('Conexión OK, NOW() =', rows[0].now);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('Error conectando a la BD:', err.message);
    if (err.code) console.error('Código de error:', err.code);
    process.exit(1);
  }
})();
