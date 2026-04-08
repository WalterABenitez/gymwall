const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db/conexion')
const { verificarToken, soloAdmin } = require('../middleware/verificarToken')
require('dotenv').config()

// Login — solo con DNI y contraseña
router.post('/login', async (req, res) => {
  const { dni, password } = req.body

  if (!dni || !password) {
    return res.status(400).json({ error: 'DNI y contraseña son obligatorios' })
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE dni = $1', [dni])
    if (resultado.rows.length === 0) {
      return res.status(400).json({ error: 'DNI o contraseña incorrectos' })
    }

    const usuario = resultado.rows[0]
    const passwordCorrecta = await bcrypt.compare(password, usuario.password)
    if (!passwordCorrecta) {
      return res.status(400).json({ error: 'DNI o contraseña incorrectos' })
    }

    const token = jwt.sign(
      { id: usuario.id, dni: usuario.dni, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, dni: usuario.dni, nombre: usuario.nombre, rol: usuario.rol }
    })
  } catch (err) {
    console.error('Error en login:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Crear socio — solo admin puede hacer esto
router.post('/crear-socio', verificarToken, soloAdmin, async (req, res) => {
  const { dni, nombre, plan, telefono } = req.body

  if (!dni || !nombre || !plan) {
    return res.status(400).json({ error: 'DNI, nombre y plan son obligatorios' })
  }

  if (!/^\d{7,8}$/.test(dni)) {
    return res.status(400).json({ error: 'El DNI debe tener 7 u 8 números sin puntos' })
  }

  try {
    const existe = await pool.query('SELECT * FROM usuarios WHERE dni = $1', [dni])
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un socio con ese DNI' })
    }

    // Calculamos la fecha de vencimiento según el plan
    const hoy = new Date()
    let vence = new Date()
    let estado = 'activa'

    if (plan === 'dia') {
      vence.setDate(hoy.getDate() + 1)
    } else if (plan === 'quincena') {
      vence.setDate(hoy.getDate() + 15)
    } else if (plan === 'mes') {
      vence.setMonth(hoy.getMonth() + 1)
    } else if (plan === 'año') {
      vence.setFullYear(hoy.getFullYear() + 1)
    }

    // La contraseña inicial es el DNI del socio
    const sal = await bcrypt.genSalt(10)
    const passwordEncriptada = await bcrypt.hash(dni, sal)

    const nuevo = await pool.query(
      `INSERT INTO usuarios (dni, nombre, password, rol, plan, membresia_estado, membresia_vence, telefono)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, dni, nombre, rol, plan, membresia_estado, membresia_vence`,
      [dni, nombre, passwordEncriptada, 'socio', plan, estado, vence.toISOString().split('T')[0], telefono || null]
    )

    res.status(201).json({
      mensaje: `Socio registrado. Contraseña inicial: ${dni}`,
      usuario: nuevo.rows[0]
    })
  } catch (err) {
    console.error('Error creando socio:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router