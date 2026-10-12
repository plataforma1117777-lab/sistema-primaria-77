const word = require('./netlify/functions/generate-pdc-word.js');

const malformedMarkdown = `
## ÁREA DE SABER Y CONOCIMIENTO: ARTES PLÁSTICAS Y VISUALES
| Objetivo de aprendizaje | Contenidos | Momentos del proceso formativo | Recursos | Periodos | Criterios de evaluación |
|---|---|---|---|---|---|
| Utiliza la creatividad y la lógica a través del tangram y la caligrafía, desarrollando habilidades motrices finas y expresión artística, para potenciar su pensamiento visual. | Semana 1:<br>- Creatividad y lógica con tangram. | - Jugamos con tangrams para formar diferentes figuras. (Práctica)<br>- Plan de lectura (15 min): Leemos sobre el origen y la historia del tangram. (Práctica)<br>- Identificamos las formas geométricas que componen el tangram y sus posibilidades de combinación. (Teoría)<br>- Construimos figuras complejas utilizando las piezas del tangram,
`;

const mockEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        formData: {
            distrito: "Test", ue: "Test", nivel: "Test", escolaridad: "Test",
            directora: "Test", maestro: "Test", areasDelMes: ["Artes Plásticas y Visuales"],
            trimestre: "1", duracion: "Test"
        },
        generatedContent: {
            tablasPorArea: malformedMarkdown.trim(),
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
