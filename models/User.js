const mongoose = require('mongoose');

// Definimos la estructura del usuario
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  fechaRegistro: { type: Date, default: Date.now },
  
  // --- NUEVOS CAMPOS ---
  finca: { type: String, default: '' }, // Nombre de su terreno
  foto: { type: String, default: '' }   // Nombre del archivo de imagen
});

module.exports = mongoose.model('User', UserSchema);

module.exports = mongoose.model('User', UserSchema);