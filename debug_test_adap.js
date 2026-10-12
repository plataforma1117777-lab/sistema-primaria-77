const fs = require('fs');
const path = require('path');
require('dotenv').config();

const adapFunc = require('./netlify/functions/generate-pdc-adaptaciones');

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
            categoriaAdaptacion: "significativa",
            tipoAdaptacion: "",
            estudiantesSignificativos: ["Juan Perez: TDAH", "Maria Gomez: Dislexia"],
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
        const res = await adapFunc.handler(mockEvent);
        console.log("STATUS CODE:", res.statusCode);
        console.log("BODY:", res.body);
    } catch (e) {
        console.error("FATAL ERROR:", e);
    }
})();
