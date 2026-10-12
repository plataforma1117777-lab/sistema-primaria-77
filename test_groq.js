require('dotenv').config();
const tablaFunc = require('./netlify/functions/generate-pdc-tabla');
const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        formData: {
            areasDelMes: ['Matemática'],
            datosSemanales: [
                {
                    semana: 1,
                    filas: [
                        { area: 'Mat', contenido: 'Suma y resta' }
                    ]
                }
            ],
            areasUsadas: ['Mat'],
            hayContenido: true
        }
    })
};

(async () => {
    // Delete GEMINI keys to force Groq
    delete process.env.GEMINI_API_KEY_1;
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.GEMINI_API_KEY_3;
    delete process.env.GEMINI_API_KEY_4;
    delete process.env.GEMINI_API_KEY_5;
    delete process.env.GEMINI_API_KEY_6;

    try {
        const res = await tablaFunc.handler(mockEvent);
        console.log("STATUS:", res.statusCode);
        console.log("BODY:", res.body);
    } catch (e) {
        console.error("ERROR:", e);
    }
})();
