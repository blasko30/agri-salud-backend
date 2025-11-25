const router = require('express').Router();
const User = require('../models/User');
const verify = require('./verifyToken'); // El portero de seguridad
const multer = require('multer');
const path = require('path');

// Configuración para guardar la foto de perfil
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, 'avatar-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// 1. OBTENER DATOS DEL PERFIL (GET)
router.get('/', verify, async (req, res) => {
    try {
        // Buscamos al usuario por su ID (pero NO devolvemos la contraseña)
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send("Error al obtener perfil");
    }
});

// 2. ACTUALIZAR PERFIL (PUT)
router.put('/', verify, upload.single('foto'), async (req, res) => {
    try {
        // Preparamos los datos a actualizar
        let datosActualizados = {
            nombre: req.body.nombre,
            finca: req.body.finca
        };

        // Si el usuario subió una foto nueva, la agregamos
        if (req.file) {
            datosActualizados.foto = req.file.filename;
        }

        // Actualizamos en la Base de Datos
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { $set: datosActualizados },
            { new: true } // Para que nos devuelva el usuario ya actualizado
        ).select('-password');

        res.json(user);

    } catch (err) {
        res.status(500).send("Error al actualizar perfil");
    }
});

module.exports = router;