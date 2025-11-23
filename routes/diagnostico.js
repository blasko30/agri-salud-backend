const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

dotenv.config();


// --- CÓDIGO DE PRUEBA (BORRAR DESPUÉS) ---
console.log("---------------------------------------------------");
console.log("INTENTANDO CONECTAR A GEMINI...");
if (process.env.GEMINI_API_KEY) {
    console.log("✅ CLAVE DETECTADA: " + process.env.GEMINI_API_KEY.substring(0, 5) + "...");
} else {
    console.log("❌ ERROR CRÍTICO: NO SE ENCUENTRA LA GEMINI_API_KEY EN .ENV");
}
console.log("---------------------------------------------------");
// ------------------------------------------
// CONFIGURACIÓN DE GEMINI (LA IA)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CONFIGURACIÓN DE MULTER (Guardar fotos)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// FUNCIÓN AUXILIAR: Convertir imagen a formato que entiende Google
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: fs.readFileSync(path).toString("base64"),
            mimeType
        },
    };
}

// LA RUTA INTELIGENTE
router.post('/', upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No se subió ninguna imagen");
        }

        // 1. Preparamos el modelo (Usamos Gemini 1.5 Flash porque es rápido)
        
        // Opción segura si la anterior falla
       // Usamos el modelo estándar actual que soporta texto e imágenes
        // Usamos la versión específica 001 que es más estable
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        // 2. Le damos las instrucciones exactas (Prompt Engineering)
        const prompt = `
            Actúa como un ingeniero agrónomo experto en fitopatología. 
            Analiza la imagen adjunta.
            
            Si la imagen NO es de una planta, responde un JSON con:
            { "error": "No se detecta una planta en la imagen" }

            Si ES una planta, identifica si tiene alguna enfermedad, plaga o deficiencia.
            Responde ESTRICTAMENTE en formato JSON (sin texto extra fuera del JSON) con esta estructura exacta:
            {
                "nombre": "Nombre común de la enfermedad o plaga (o 'Planta Sana')",
                "descripcion": "Breve descripción visual de lo que ves en la foto",
                "causas": ["Causa 1", "Causa 2", "Causa 3"],
                "tratamiento": ["Paso 1 de solución orgánica/barata", "Paso 2", "Paso 3"]
            }
        `;

        // 3. Preparamos la imagen
        const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);

        // 4. Enviamos todo a la IA y esperamos respuesta
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // 5. Limpiamos el texto para obtener solo el JSON
        // (A veces la IA pone comillas extra o marcadores de código)
        const jsonString = text.replace(/```json|```/g, "").trim();
        const diagnosticoIA = JSON.parse(jsonString);

        // 6. Si la IA dice que no es una planta, enviamos error
        if (diagnosticoIA.error) {
            // Borramos la foto si no sirve
            fs.unlinkSync(req.file.path); 
            return res.json({ 
                resultado: {
                    nombre: "Error de Imagen",
                    descripcion: "La Inteligencia Artificial no detectó ninguna planta clara en la foto. Intenta acercarte más a la hoja.",
                    causas: ["Foto borrosa", "No es una planta", "Iluminación baja"],
                    tratamiento: ["Toma la foto de nuevo enfocando la hoja afectada."]
                }
            });
        }

        // 7. Enviamos el diagnóstico real al Frontend
        res.json({
            mensaje: "Análisis con IA completado",
            archivo: req.file.filename,
            resultado: diagnosticoIA
        });

        // (Opcional) Borrar la imagen del servidor después de analizar para ahorrar espacio
        // fs.unlinkSync(req.file.path); 

    } catch (err) {
        console.error(err);
        res.status(500).send("Error al analizar con la IA: " + err.message);
    }
});

module.exports = router;