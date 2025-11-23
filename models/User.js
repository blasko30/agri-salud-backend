const mongoose = require('mongoose');

// Definimos la estructura del usuario
const UserSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // No permite correos repetidos
  },
  password: {
    type: String,
    required: true
  },
  // Campo para tu modelo de negocio
  plan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free' 
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);