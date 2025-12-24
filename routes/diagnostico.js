const router = require('express').Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const verify = require('./verifyToken');
const fs = require('fs');
const Diagnostico = require('../models/Reporte'); // Asegúrate de que tu modelo se llame así (Reporte o Diagnostico)

// Configuración de Multer (para recibir la foto)
const upload = multer({ dest: 'uploads/' });

// Configuración de Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// RUTA POST: /api/diagnostico
router.post('/', verify, upload.single('imagen'), async (req, res) => {
    try {
        // 1. Validar que llegó una imagen
        if (!req.file) return res.status(400).send("No se subió ninguna imagen.");

        // 2. Preparar la imagen para Gemini
        const imagePath = req.file.path;
        const imageData = fs.readFileSync(imagePath);
        const imageBase64 = imageData.toString('base64');

        const parts = [
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: imageBase64
                }
            }
        ];

        // 3. DEFINIR EL PROMPT 
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

          ### 🌿 Tratamiento Ecológico / Casero
          * **[Opción 1]:** [Instrucción clara]
          * **[Opción 2]:** [Instrucción clara]

          ### 🧪 Tratamiento Químico (Solo si es necesario)
          * **Principio Activo:** [Nombre del químico recomendado]
          * **Instrucción:** [Cómo aplicarlo brevemente]

          ### 🛡️ Prevención
          * [Consejo para que no vuelva a pasar]
          
        `;

        // 4. Invocar a Gemini
       
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        
        const result = await model.generateContent([prompt, ...parts]);
        const response = await result.response;
        const text = response.text();

        // 5. Guardar en Base de Datos (Opcional, pero recomendado para el Historial)
        // Extraemos un título corto del texto para guardarlo
        const tituloCorto = text.split('\n')[0].replace('## ', '').substring(0, 50) || "Diagnóstico General";

        const nuevoReporte = new Diagnostico({
            usuarioId: req.user._id,
            imagenUrl: req.file.filename, // Guardamos el nombre del archivo
            enfermedad: tituloCorto, // Un resumen
            descripcion: text,       // El reporte completo
            fecha: new Date()
        });
        
        await nuevoReporte.save();

        // 6. Enviar respuesta al Frontend
        res.json({ resultado: text });

        // Limpieza: Borrar la imagen temporal del servidor
        // fs.unlinkSync(imagePath); (Opcional: Descomentar si quieres ahorrar espacio en Render)

    } catch (error) {
        console.error("Error en diagnóstico:", error);
        res.status(500).send("Error al procesar el diagnóstico con IA.");
    }
});

// RUTA GET: Historial
router.get('/historial', verify, async (req, res) => {
    try {
        const historial = await Diagnostico.find({ usuarioId: req.user._id }).sort({ fecha: -1 });
        res.json(historial);
    } catch (error) {
        res.status(500).send("Error al obtener historial");
    }
});

module.exports = router;