const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRO
router.post('/register', async (req, res) => {
  try {
    // 1. Verificar si el usuario ya existe
    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).send('El correo ya está registrado.');

    // 2. Encriptar la contraseña (HASH)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 3. Crear el nuevo usuario
    const user = new User({
      nombre: req.body.nombre,
      email: req.body.email,
      password: hashedPassword,
      plan: 'free' // Por defecto empiezan gratis
    });

    // 4. Guardar en Base de Datos
    const savedUser = await user.save();
    res.send({ user: user._id, mensaje: "Usuario creado exitosamente" });

  } catch (err) {
    res.status(400).send(err);
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    // 1. Verificar si el correo existe
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Correo o contraseña incorrectos.');

    // 2. Verificar si la contraseña coincide (Compara texto plano con Hash)
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Correo o contraseña incorrectos.');

    // 3. Crear y asignar un TOKEN (La llave digital)
    const token = jwt.sign(
        { _id: user._id, plan: user.plan }, // Guardamos el ID y el Plan en el token
        process.env.TOKEN_SECRET // Llave secreta del servidor
    );

    // Enviamos el token al usuario (Frontend)
    res.header('auth-token', token).send({ token: token, plan: user.plan });

  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;