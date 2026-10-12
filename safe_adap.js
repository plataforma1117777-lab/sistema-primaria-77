const fs = require('fs');
const path = require('path');

const funcAdap = path.join(process.cwd(), 'netlify', 'functions', 'generate-pdc-adaptaciones.js');

const newAdap = `require('dotenv').config();

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

        const promptCurricular = \`Eres un experto en educación inclusiva boliviana. Genera la sección de ADAPTACIONES CURRICULARES (DIFICULTADES LEVES / REZAGO).

Condición del estudiante: \${formData.tipoAdaptacion || 'No especificada'}

INSTRUCCIONES:
Genera una tabla en Markdown de 1 columna y 2 filas con la siguiente estructura:
- Fila 1: Título "ADAPTACIONES CURRICULARES (DIFICULTADES LEVES / REZAGO)"
- Fila 2: Debe contener actividades de apoyo pedagógico, considerando la condición y el ritmo de aprendizaje del estudiante.
Las actividades deben estar adecuadas a sus capacidades, ser sencillas, lúdicas y motivadoras.

Formato requerido:
- Cada actividad debe comenzar con un guion (-).
- Para separar las actividades DENTRO de la celda de la tabla, debes usar OBLIGATORIAMENTE la etiqueta HTML <br> (ejemplo: - Actividad 1 <br> - Actividad 2).
- ESTÁ TOTALMENTE PROHIBIDO usar saltos de línea reales (tecla Enter o \\n) para separar las actividades, ya que esto rompe el formato de la tabla Markdown.

Responde ÚNICAMENTE con el contenido Markdown. Sin texto adicional.\`;

        const textoEstudiantes = (formData.estudiantesSignificativos || []).join("\\n");
        const areasTexto = (formData.areasDelMes && formData.areasDelMes.length > 0) ? formData.areasDelMes.join(", ") : "(áreas seleccionadas)";

        const promptSignificativa = \`Eres un experto en educación inclusiva boliviana. Genera adaptaciones curriculares SIGNIFICATIVAS.

Estudiantes y condiciones: 
\${textoEstudiantes}

INSTRUCCIONES:
Para cada Área de Saberes y Conocimientos (\${areasTexto}) genera una tabla de Adaptaciones Curriculares Significativas.

Estructura de cada tabla:
1. En la parte superior un título:
ADAPTACIONES CURRICULARES SIGNIFICATIVAS - \${areasTexto}

2. Una tabla Markdown con 4 columnas:
| Contenidos del Área | Discapacidad / TDAH / TEA y otros | Adaptación | Criterio de evaluación |

REGLAS:
1. Una fila por cada estudiante.
2. Columna Contenidos: Contenidos a adaptar (resumen).
3. Columna Discapacidad: Nombre y condición del estudiante.
4. Columna Adaptación: Actividades concretas y orientadas.
5. Columna Criterio: Criterios SER, SABER, HACER. (Solo ponerlos en la primera fila de la tabla por estudiante o combinados si puedes con <br>).
6. Usa <br> en lugar de saltos de línea crudos dentro de las celdas de la tabla.

Responde ÚNICAMENTE con las tablas Markdown. Sin texto adicional.\`;

        const prompt = esCurricular ? promptCurricular : promptSignificativa;

        let contentResponse = '';
        let finalProvider = 'Desconocido';
        let exito = false;

        let geminiIndex = 1;
        for (const apiKey of geminiKeys) {
            try {
                const responseGemini = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                    })
                });
                if (!responseGemini.ok) {
                    throw new Error(\`Error API Gemini: \${responseGemini.status}\`);
                }
                const dataGemini = await responseGemini.json();
                contentResponse = dataGemini?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (contentResponse) {
                    finalProvider = \`Gemini (\${geminiIndex})\`;
                    exito = true;
                    break;
                }
            } catch (error) {
                console.warn(\`[generate-pdc-adaptaciones] Falló Gemini \${geminiIndex}: \${error.message}\`);
            }
            geminiIndex++;
        }

        if (!exito) {
            let groqIndex = 1;
            for (const groqKey of groqKeys) {
                try {
                    const responseGroq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': \`Bearer \${groqKey}\`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'llama-3.3-70b-versatile',
                            messages: [{ role: 'user', content: prompt }],
                            temperature: 0.2,
                            max_tokens: 8192
                        })
                    });
                    if (!responseGroq.ok) {
                        throw new Error(\`Error API Groq: \${responseGroq.status}\`);
                    }
                    const dataGroq = await responseGroq.json();
                    contentResponse = dataGroq.choices[0].message.content || '';
                    if (contentResponse) {
                        finalProvider = \`Groq (\${groqIndex})\`;
                        exito = true;
                        break;
                    }
                } catch (error) {
                    console.warn(\`[generate-pdc-adaptaciones] Falló Groq \${groqIndex}: \${error.message}\`);
                }
                groqIndex++;
            }
        }

        if (!exito) {
            throw new Error(\`Fallaron todas las claves de Gemini y Groq disponibles.\`);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ 
                content: contentResponse.replace(/\`\`\`markdown/gi, '').replace(/\`\`\`/g, '').trim(),
                provider: finalProvider
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
`;

fs.writeFileSync(funcAdap, newAdap);
