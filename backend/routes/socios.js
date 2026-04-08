const express = require('express')
const router = express.Router()
const pool = require('../db/conexion')
const { verificarToken, soloAdmin } = require('../middleware/verificarToken')

// Obtener todos los socios — solo admin
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, dni, nombre, telefono, rol, plan, membresia_estado, membresia_vence FROM usuarios WHERE rol = $1 ORDER BY nombre',
      ['socio']
    )
    res.status(200).json({ socios: resultado.rows })
  } catch (err) {
    console.error('Error obteniendo socios:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Obtener perfil del socio logueado
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, dni, nombre, telefono, rol, plan, membresia_estado, membresia_vence FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    res.status(200).json({ usuario: resultado.rows[0] })
  } catch (err) {
    console.error('Error obteniendo perfil:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Actualizar membresía — solo admin
router.put('/:id/membresia', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params
  const { estado, vence, plan } = req.body
  try {
    await pool.query(
      'UPDATE usuarios SET membresia_estado = $1, membresia_vence = $2, plan = $3 WHERE id = $4',
      [estado, vence || null, plan || null, id]
    )
    res.status(200).json({ mensaje: 'Membresía actualizada correctamente' })
  } catch (err) {
    console.error('Error actualizando membresía:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Eliminar socio — solo admin
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1 AND rol = $2', [id, 'socio'])
    res.status(200).json({ mensaje: 'Socio eliminado correctamente' })
  } catch (err) {
    console.error('Error eliminando socio:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

module.exports = router