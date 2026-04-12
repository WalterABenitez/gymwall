const express = require('express')
const router = express.Router()
const pool = require('../db/conexion')
const { verificarToken, soloAdmin } = require('../middleware/verificarToken')
const { upload, cloudinary } = require('../config/cloudinary')

// Obtener todos los socios con conteo de asistencias y días desde vencimiento
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        u.id, u.dni, u.nombre, u.telefono, u.rol, u.plan,
        u.membresia_estado, u.membresia_vence, u.foto_url,
        COUNT(ra.id) FILTER (WHERE ra.resultado = 'permitido') AS total_asistencias,
        MAX(ra.fecha) FILTER (WHERE ra.resultado = 'permitido') AS ultima_asistencia,
        CASE 
          WHEN u.membresia_vence < CURRENT_DATE AND u.membresia_estado = 'activa' 
          THEN CURRENT_DATE - u.membresia_vence
          ELSE NULL
        END AS dias_vencida
      FROM usuarios u
      LEFT JOIN registro_accesos ra ON ra.usuario_id = u.id
      WHERE u.rol = 'socio'
      GROUP BY u.id
      ORDER BY u.nombre
    `)
    res.status(200).json({ socios: resultado.rows })
  } catch (err) {
    console.error('Error obteniendo socios:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Obtener asistencias de un socio específico
router.get('/:id/asistencias', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const resultado = await pool.query(`
      SELECT fecha, resultado, motivo
      FROM registro_accesos
      WHERE usuario_id = $1 AND resultado = 'permitido'
      ORDER BY fecha DESC
      LIMIT 50
    `, [id])
    res.status(200).json({ asistencias: resultado.rows })
  } catch (err) {
    console.error('Error obteniendo asistencias:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Obtener perfil del socio logueado
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id, dni, nombre, telefono, rol, plan, membresia_estado, membresia_vence, foto_url FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    res.status(200).json({ usuario: resultado.rows[0] })
  } catch (err) {
    console.error('Error obteniendo perfil:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Subir foto del socio
router.post('/:id/foto', verificarToken, soloAdmin, upload.single('foto'), async (req, res) => {
  const { id } = req.params
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' })
    }
    const foto_url = req.file.path
    await pool.query('UPDATE usuarios SET foto_url = $1 WHERE id = $2', [foto_url, id])
    res.status(200).json({ mensaje: 'Foto actualizada correctamente', foto_url })
  } catch (err) {
    console.error('Error subiendo foto:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Eliminar foto del socio
router.delete('/:id/foto', verificarToken, soloAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const resultado = await pool.query('SELECT foto_url FROM usuarios WHERE id = $1', [id])
    const foto_url = resultado.rows[0]?.foto_url
    if (foto_url) {
      const publicId = foto_url.split('/').slice(-2).join('/').split('.')[0]
      await cloudinary.uploader.destroy(publicId)
    }
    await pool.query('UPDATE usuarios SET foto_url = NULL WHERE id = $1', [id])
    res.status(200).json({ mensaje: 'Foto eliminada correctamente' })
  } catch (err) {
    console.error('Error eliminando foto:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Actualizar membresía
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

// Eliminar socio
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