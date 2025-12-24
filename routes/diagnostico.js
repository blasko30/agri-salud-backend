const router = require('express').Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const verify = require('./verifyToken');
const fs = require('fs');
// Asegúrate de que este archivo exista en tu carpeta models.
// Si tu archivo se llama "Diagnostico.js", cambia la ruta a '../models/Diagnostico'
const Diagnostico = require('../models/Reporte'); 

const upload = multer({ dest: 'uploads/' });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', verify, upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No se subió ninguna imagen.");

        const imagePath = req.file.path;
        const imageData = fs.readFileSync(imagePath);
        const imageBase64 = imageData.toString('base64');

        const parts = [{
            inlineData: {
                mimeType: req.file.mimetype,
                data: imageBase64
            }
        }];

        const prompt = `
          Actúa como un Ingeniero Agrónomo experto y fitopatólogo con 20 años de experiencia.
          Analiza la imagen adjunta con extrema atención a los detalles visuales de las hojas, tallos y frutos.

          Tu misión es identificar la especie de la planta y sus problemas de salud.

          SI LA IMAGEN NO ES DE UNA PLANTA:
          Responde únicamente: "⚠️ Lo siento, no detecto ninguna planta en esta imagen. Por favor sube una foto clara de una hoja o fruto afectado."

          SI ES UNA PLANTA, GENERA EL REPORTE EN ESTE FORMATO EXACTO (Usa Markdown):

          ## 🔎 Identificación
          **Especie detectada:** [Nombre Común] (*Nombre Científico*)

          ## 🩺 Diagnóstico: [Nombre de la Enfermedad o Plaga]
          **Confianza:** [Alto/Medio/Bajo]

          ### 🧐 ¿Por qué? (Síntomas observados)
          * [Describe las manchas, colores, texturas o insectos que ves en la foto que justifican el diagnóstico]

          ### 🌿 Tratamiento Ecológico / Casero ideal 
          * **[Opción 1]:** [Instrucción clara]
          * **[Opción 2]:** [Instrucción clara]

          ### 🧪 Tratamiento Químico (Solo si es necesario)
          * **Principio Activo:** [Nombre del químico recomendado]
          * **Instrucción:** [Cómo aplicarlo brevemente]

          ### 🛡️ Prevención
          * [Consejo para que no vuelva a pasar]
          
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        
        const result = await model.generateContent([prompt, ...parts]);
        const response = await result.response;
        const text = response.text();

        const tituloCorto = text.split('\n')[0].replace('## ', '').substring(0, 50) || "Diagnóstico";

        // --- AQUÍ ESTABA EL ERROR, YA CORREGIDO ---
        const nuevoReporte = new Diagnostico({
            usuarioId: req.user._id,
            imagen: req.file.filename,  // <--- ANTES DECÍA imagenUrl, AHORA DICE imagen
            enfermedad: tituloCorto,
            descripcion: text,
            fecha: new Date()
        });
        
        await nuevoReporte.save();

        res.json({ resultado: text });

    } catch (error) {
        console.error("Error en diagnóstico:", error);
        res.status(500).send("Error al procesar el diagnóstico con IA.");
    }
});

router.get('/historial', verify, async (req, res) => {
    try {
        const historial = await Diagnostico.find({ usuarioId: req.user._id }).sort({ fecha: -1 });
        res.json(historial);
    } catch (error) {
        res.status(500).send("Error al obtener historial");
    }
});

module.exports = router;