const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // <--- IMPORTAR ESTO

const authRoute = require('./routes/auth');
const diagnosticoRoute = require('./routes/diagnostico');
const usuarioRoute = require('./routes/usuario'); // <---  IMPORTAR RUTA USUARIO

dotenv.config();
const app = express();

mongoose.connect(process.env.DB_CONNECT)
  .then(() => console.log('Conectado a la Base de Datos'))
  .catch(err => console.log('Error de conexión a DB:', err));

app.use(express.json());
app.use(cors());

// <---  PERMITIR VER LAS FOTOS (Hacer pública la carpeta uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/user', authRoute);
app.use('/api/diagnostico', diagnosticoRoute);
app.use('/api/usuario', usuarioRoute); //  USAR LA RUTA

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));