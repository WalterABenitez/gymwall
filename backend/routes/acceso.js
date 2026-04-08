const express = require('express')
const router = express.Router()
const pool = require('../db/conexion')
const { verificarToken, soloAdmin } = require('../middleware/verificarToken')

// Verificar acceso — lo llama la pantalla del molinete con solo el DNI
// No requiere token porque es una pantalla pública
router.post('/verificar', async (req, res) => {
  const { dni } = req.body

  if (!dni) {
    return res.status(400).json({ acceso: false, mensaje: 'DNI requerido' })
  }

  try {
    const resultado = await pool.query(
      'SELECT id, nombre, membresia_estado, membresia_vence FROM usuarios WHERE dni = $1 AND rol = $2',
      [dni, 'socio']
    )

    if (resultado.rows.length === 0) {
      await pool.query(
        'INSERT INTO registro_accesos (dni, resultado, motivo) VALUES ($1, $2, $3)',
        [dni, 'denegado', 'DNI no registrado']
      )
      return res.status(200).json({ acceso: false, mensaje: 'DNI no registrado en el sistema' })
    }

    const usuario = resultado.rows[0]
    const hoy = new Date()
    const vence = usuario.membresia_vence ? new Date(usuario.membresia_vence) : null
    const membresiaActiva = usuario.membresia_estado === 'activa' && vence && vence >= hoy

    if (!membresiaActiva) {
      await pool.query(
        'INSERT INTO registro_accesos (usuario_id, dni, resultado, motivo) VALUES ($1, $2, $3, $4)',
        [usuario.id, dni, 'denegado', 'Membresía inactiva o vencida']
      )
      return res.status(200).json({
        acceso: false,
        nombre: usuario.nombre,
        mensaje: 'Membresía inactiva o vencida'
      })
    }

    await pool.query(
      'INSERT INTO registro_accesos (usuario_id, dni, resultado, motivo) VALUES ($1, $2, $3, $4)',
      [usuario.id, dni, 'permitido', 'Membresía activa']
    )

    return res.status(200).json({
      acceso: true,
      nombre: usuario.nombre,
      mensaje: 'Acceso permitido',
      membresia_vence: usuario.membresia_vence
    })

  } catch (err) {
    console.error('Error verificando acceso:', err)
    res.status(500).json({ acceso: false, mensaje: 'Error interno del servidor' })
  }
})

// Historial de accesos — solo admin
router.get('/historial', verificarToken, soloAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT ra.id, ra.dni, u.nombre, ra.resultado, ra.motivo, ra.fecha
       FROM registro_accesos ra
       LEFT JOIN usuarios u ON ra.usuario_id = u.id
       ORDER BY ra.fecha DESC
       LIMIT 100`
    )
    res.status(200).json({ accesos: resultado.rows })
  } catch (err) {
    console.error('Error obteniendo historial:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router