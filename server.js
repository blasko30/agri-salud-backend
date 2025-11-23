const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Importar Rutas
const authRoute = require('./routes/auth');
const diagnosticoRoute = require('./routes/diagnostico'); // <--- Ruta de diagnóstico

dotenv.config(); // Habilitar variables de entorno
const app = express();

// Conexión a Base de Datos
mongoose.connect(process.env.DB_CONNECT)
  .then(() => console.log('Conectado a la Base de Datos'))
  .catch(err => console.log('Error de conexión a DB:', err));

// Middlewares
app.use(express.json()); 
app.use(cors()); 

// Rutas
app.use('/api/user', authRoute);
app.use('/api/diagnostico', diagnosticoRoute); // <--- Usar la ruta de diagnóstico

// Iniciar servidor
// Usamos el puerto que nos diga la nube O el 3000 si estamos en casa
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));