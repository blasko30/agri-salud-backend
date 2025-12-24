const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  fechaRegistro: { type: Date, default: Date.now },
  
  // Estos son los campos nuevos para el perfil
  finca: { type: String, default: '' },
  foto: { type: String, default: '' }
});

module.exports = mongoose.model('User', UserSchema);