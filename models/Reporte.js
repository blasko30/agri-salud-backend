const mongoose = require('mongoose');

const ReporteSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imagen: { type: String, required: true },
  enfermedad: { type: String, required: true },
  descripcion: String,
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reporte', ReporteSchema);