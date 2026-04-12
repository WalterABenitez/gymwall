const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configuración de almacenamiento
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'gymwall',
      format: 'png', // o jpg
      public_id: Date.now() + '-' + file.originalname
    }
  }
})

// Middleware de subida
const upload = multer({ storage })

module.exports = {
  cloudinary,
  upload
}