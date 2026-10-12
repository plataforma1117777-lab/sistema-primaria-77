const fs = require('fs');
const path = require('path');
require('dotenv').config();

const tablaFunc = require('./netlify/functions/generate-pdc-tabla');

const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        formData: {
            numeroPDC: "01",
            distrito: "Cercado",
            nivel: "Primaria",
            directora: "Juan",
            maestro: "Maria",
            trimestre: "1",
            duracion: "2 semanas",
            ue: "Sancarlos",
            escolaridad: "Primero",
            categoriaAdaptacion: "curricular",
            tipoAdaptacion: "",
            estudiantesSignificativos: [],
            datosSemanales: [
                {
                    semana: 1,
                    filas: [
                        { area: 'Mat', contenido: 'Suma y resta' }
                    ]
                }
            ],
            areasUsadas: ['Mat'],
            areasDelMes: ['Matemática'],
            hayContenido: true
        }
    })
};

(async () => {
    try {
        const res = await tablaFunc.handler(mockEvent);
        console.log("STATUS CODE:", res.statusCode);
        console.log("BODY:", res.body);
    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
})();
