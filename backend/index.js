const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./db/conexion')
const authRoutes = require('./routes/auth')
const sociosRoutes = require('./routes/socios')
const accesoRoutes = require('./routes/acceso')

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoutes)
app.use('/api/socios', sociosRoutes)
app.use('/api/acceso', accesoRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'GymWall API funcionando' })
})

app.listen(PORT, () => {
  console.log(`Servidor GymWall corriendo en http://localhost:${PORT}`)
})