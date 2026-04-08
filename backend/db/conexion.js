const { Pool } = require('pg')
require('dotenv').config()

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    })

const conectar = async (reintentos = 5) => {
  try {
    await pool.connect()
    console.log('Conectado a PostgreSQL correctamente')
  } catch (err) {
    if (reintentos === 0) {
      console.error('No se pudo conectar a PostgreSQL:', err)
      process.exit(1)
    }
    console.log(`Reintentando conexión... (${reintentos} intentos restantes)`)
    await new Promise(res => setTimeout(res, 3000))
    return conectar(reintentos - 1)
  }
}

conectar()
module.exports = pool