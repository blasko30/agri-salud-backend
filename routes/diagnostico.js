const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const verify = require('./verifyToken'); // El portero
const Reporte = require('../models/Reporte'); // <--- USAMOS EL NOMBRE NUEVO

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

// 1. ANALIZAR Y GUARDAR REPORTE (POST)
router.post('/', verify, upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No se subió imagen");

        // 1. Preguntamos a la IA (Gemini)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Actúa como agrónomo. Analiza la imagen. Si NO es planta responde JSON { "error": "..." }. Si ES planta, responde JSON: { "nombre": "...", "descripcion": "...", "causas": [], "tratamiento": [] }`;
        const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);
        
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json|```/g, "").trim();
        const diagnosticoIA = JSON.parse(jsonString);

        if (diagnosticoIA.error) {
            fs.unlinkSync(req.file.path);
            return res.json({ resultado: diagnosticoIA });
        }

        // 2. Guardamos el REPORTE en la Base de Datos
        const nuevoReporte = new Reporte({
            usuarioId: req.user._id,
            imagen: req.file.filename,
            enfermedad: diagnosticoIA.nombre,
            descripcion: diagnosticoIA.descripcion
        });
        await nuevoReporte.save();

        res.json({
            mensaje: "Reporte guardado exitosamente",
            archivo: req.file.filename,
            resultado: diagnosticoIA
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error en servidor");
    }
});

// 2. LEER HISTORIAL DE REPORTES (GET)
router.get('/historial', verify, async (req, res) => {
    try {
        // Buscamos los reportes de este usuario
        const historial = await Reporte.find({ usuarioId: req.user._id }).sort({ fecha: -1 });
        res.json(historial);
    } catch (err) {
        res.status(500).send("Error al obtener historial");
    }
});

module.exports = router;