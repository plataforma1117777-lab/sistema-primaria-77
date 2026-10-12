const word = require('./netlify/functions/generate-pdc-word.js');

const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        formData: {
            distrito: "Test",
            ue: "Test",
            nivel: "Test",
            escolaridad: "Test",
            directora: "Test",
            maestro: "Test",
            areasDelMes: ["Matemática"],
            trimestre: "1",
            duracion: "Test"
        },
        generatedContent: {
            tablasPorArea: "## ÁREA DE SABER Y CONOCIMIENTO: MATEMÁTICA\n| A | B |\n| 1 | 2 |\n| 3 | \n 4 |",
            adaptaciones: ""
        }
    })
};

(async () => {
    try {
        const response = await word.handler(mockEvent);
        if (response.statusCode === 500) {
            console.error("Error 500:", response.body);
        } else {
            console.log("Success! Status:", response.statusCode);
        }
    } catch (e) {
        console.error("Uncaught exception:", e);
    }
})();
