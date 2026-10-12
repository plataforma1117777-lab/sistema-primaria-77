require('dotenv').config();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    let formData;
    try {
        ({ formData } = JSON.parse(event.body));
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
    }

    try {
        const geminiKeys = [
            process.env.DEEPSEEK_API_KEY,
            process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3, process.env.GEMINI_API_KEY_4,
            process.env.GEMINI_API_KEY_5, process.env.GEMINI_API_KEY_6
        ].filter(Boolean);

        const groqKeys = [
            process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3, process.env.GROQ_API_KEY_4,
            process.env.GROQ_API_KEY_5, process.env.GROQ_API_KEY_6,
            process.env.GROQ_API_KEY_7, process.env.GROQ_API_KEY_8
        ].filter(Boolean);

        if (geminiKeys.length === 0 && groqKeys.length === 0) {
            return { statusCode: 500, body: JSON.stringify({ error: 'No hay API Keys configuradas' }) };
        }

        if (!formData.tipoAdaptacion && (!formData.estudiantesSignificativos || formData.estudiantesSignificativos.length === 0)) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ content: 'No se requieren adaptaciones curriculares para el presente PDC.' })
            };
        }

        const esCurricular = formData.categoriaAdaptacion === 'curricular';

        if (esCurricular) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ content: 'OMITIR_ADAPTACIONES' }) // String truthy para evitar bug en el frontend
            };
        }

        const promptCurricular = `Eres un experto en educación inclusiva boliviana. Genera la sección de ADAPTACIONES CURRICULARES (DIFICULTADES LEVES / REZAGO).

Condición del estudiante: ${formData.tipoAdaptacion || 'No especificada'}

INSTRUCCIONES:
Genera una tabla en Markdown de 1 columna y 2 filas con la siguiente estructura:
- Fila 1: Título "ADAPTACIONES CURRICULARES (DIFICULTADES LEVES / REZAGO)"
- Fila 2: Debe contener actividades de apoyo pedagógico, considerando la condición y el ritmo de aprendizaje del estudiante.
Las actividades deben estar adecuadas a sus capacidades, ser sencillas, lúdicas y motivadoras.

Formato requerido:
- Cada actividad debe comenzar con un guion (-).
- Para separar las actividades DENTRO de la celda de la tabla, debes usar OBLIGATORIAMENTE la etiqueta HTML <br> (ejemplo: - Actividad 1 <br> - Actividad 2).
- ESTÁ TOTALMENTE PROHIBIDO usar saltos de línea reales (tecla Enter o \n) para separar las actividades, ya que esto rompe el formato de la tabla Markdown.
- NO RESUMAS la condición ni las actividades. Detalla la información completa y precisa sin truncar ni omitir detalles.

Responde ÚNICAMENTE con el contenido Markdown. Sin texto adicional.`;

        const textoEstudiantes = (formData.estudiantesSignificativos || []).join("\n");
        const areasTexto = (formData.areasDelMes && formData.areasDelMes.length > 0) ? formData.areasDelMes.join(", ") : "(áreas seleccionadas)";

        const contenidosPorArea = {};
        if (formData.datosSemanales) {
            formData.datosSemanales.forEach(sem => {
                if (sem.filas) {
                    sem.filas.forEach(fila => {
                        if (!contenidosPorArea[fila.area]) contenidosPorArea[fila.area] = [];
                        contenidosPorArea[fila.area].push({ semana: sem.semana, contenido: fila.contenido });
                    });
                }
            });
        }

        const areasRegistradas = Object.keys(contenidosPorArea);
        
        const mapNombresAreas = {
            "VEyR": "Valores Espiritualidades y Religiones",
            "CyL": "Comunicación y Lenguaje",
            "CS": "Ciencias Sociales",
            "APyV": "Artes Plásticas y Visuales",
            "EFyD": "Educación Física y Deportes",
            "EM": "Educación Musical",
            "CN": "Ciencias Naturales",
            "Mat": "Matemática",
            "TT": "Técnica Tecnológica"
        };

        const promptsSignificativa = areasRegistradas.map(area => {
            const contenidoDelArea = { [area]: contenidosPorArea[area] };
            return `Eres un experto en educación inclusiva boliviana. Genera adaptaciones curriculares SIGNIFICATIVAS.

Estudiantes y condiciones: 
${textoEstudiantes}

INSTRUCCIONES:
Para el área detallada en el siguiente JSON de contenidos:
${JSON.stringify(contenidoDelArea, null, 2)}

Genera una tabla de Adaptaciones Curriculares Significativas para el área de ${mapNombresAreas[area] || area}.

Estructura de la tabla:
1. En la parte superior un título (asegúrate de usar ## para que sea interpretado correctamente):
## ADAPTACIONES CURRICULARES SIGNIFICATIVAS - ${mapNombresAreas[area] || area}

2. Una tabla Markdown con 4 columnas:
| Contenidos del Área | Discapacidad / TDAH / TEA y otros | Adaptación | Criterio de evaluación |

REGLAS:
1. Una fila por cada estudiante.
2. Columna Contenidos: Contenidos a adaptar. Transcribe la información completa, NO resumas ni recortes la información original.
3. Columna Discapacidad: Nombre y condición del estudiante.
4. Columna Adaptación: Actividades concretas y orientadas, expresadas de forma completa.
5. Columna Criterio: Criterios SER, SABER, HACER. (Solo ponerlos en la primera fila de la tabla por estudiante o combinados si puedes con <br>).
6. Usa <br> en lugar de saltos de línea crudos dentro de las celdas de la tabla.

Responde ÚNICAMENTE con el título y la tabla Markdown. Sin texto adicional.`;
        });

        const prompts = esCurricular ? [promptCurricular] : promptsSignificativa;

        let contentResponse = '';
        let finalProvider = 'Desconocido';
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
                prompts: prompts,
                geminiKeys: geminiKeys
            })
        };
    } catch (error) {
        console.error('[generate-pdc-adaptaciones] Error en generación con IA:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error interno en el servidor', details: error.message })
        };
    }
};
