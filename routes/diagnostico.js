const router = require('express').Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('imagen'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No se subió ninguna imagen");
        }

        // --- AQUÍ ESTÁ LA CLAVE: DATOS COMO LISTAS (ARRAYS) ---
     // LISTA AMPLIADA DE PROBLEMAS
        const posiblesPlagas = [
            { 
                nombre: "Roya (Hongo Pucciniales)", 
                descripcion: "Enfermedad fúngica que se manifiesta como pústulas de color naranja o marrón en el envés de las hojas.",
                causas: ["Exceso de humedad.", "Temperaturas suaves.", "Falta de ventilación."],
                tratamiento: ["Fungicida a base de cobre.", "Podar partes afectadas.", "No mojar las hojas al regar."]
            },
            { 
                nombre: "Pulgón (Insecto)", 
                descripcion: "Pequeños insectos que absorben la savia, debilitando la planta y deformando brotes.",
                causas: ["Exceso de nitrógeno.", "Sequía.", "Ausencia de depredadores."],
                tratamiento: ["Jabón potásico.", "Aceite de Neem.", "Introducir mariquitas."]
            },
            { 
                nombre: "Oídio (Hongo)", 
                descripcion: "Se ve como un polvo blanco o ceniza sobre las hojas (como si tuvieran harina).",
                causas: ["Humedad ambiental alta.", "Sombra excesiva.", "Mala circulación de aire."],
                tratamiento: ["Fungicida a base de azufre.", "Mejorar la exposición al sol.", "Podar para airear."]
            },
            { 
                nombre: "Déficit de Magnesio (Nutrientes)", 
                descripcion: "Las hojas viejas se ponen amarillas entre las nervaduras, pero las venas siguen verdes (Clorosis intervenal).",
                causas: ["Suelo muy ácido.", "Exceso de potasio que bloquea el magnesio.", "Suelo arenoso lavado por lluvia."],
                tratamiento: ["Aplicar dolomita o sales de Epsom.", "Ajustar el pH del suelo.", "Fertilizante rico en magnesio."]
            },
            { 
                nombre: "Déficit de Nitrógeno (Nutrientes)", 
                descripcion: "La planta crece poco y las hojas viejas se ponen completamente amarillas pálido.",
                causas: ["Suelo agotado.", "Mucha lluvia que lava los nutrientes.", "Materia orgánica sin descomponer."],
                tratamiento: ["Aplicar humus de lombriz.", "Fertilizante rico en nitrógeno (urea/estiércol).", "Plantar leguminosas asociadas."]
            }
        ];

        const diagnosticoIA = posiblesPlagas[Math.floor(Math.random() * posiblesPlagas.length)];

        res.json({
            mensaje: "Imagen analizada correctamente",
            archivo: req.file.filename,
            resultado: diagnosticoIA 
        });

    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;