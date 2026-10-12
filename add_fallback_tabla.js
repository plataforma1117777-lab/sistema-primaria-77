const fs = require('fs');
const path = require('path');

const funcPath = path.join(process.cwd(), 'netlify', 'functions', 'generate-pdc-tabla.js');

const newFunc = `require('dotenv').config();

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

    const objNivel = "Conoce, Identifica, Describe, Explica, Interpreta, Comprende, Clasifica, Organiza, Relaciona, Analiza, Compara, Argumenta, Justifica, Infiere, Aplica, Utiliza, Representa, Demuestra, Redacta, Desarrolla";
    const vPractica = "Jugamos, Conversamos, Exploramos, Observamos, Participamos, Narramos, Interpretamos, Modelamos, Realizamos, Construimos, Elaboramos, Recolectamos";
    const vTeoria = "Analizamos, Identificamos, Describimos, Clasificamos, Explicamos, Conceptualizamos, Sistematizamos, Comparamos, Investigamos, Comprendemos";
    const vProduccion = "Exponemos, Dramatizamos, Representamos gráficamente, Interpretamos, Ejecutamos, Demostramos, Elaboramos, Aplicamos, Preparamos, Componemos, Socializamos";

    const prompt = \`Actúa como un experto pedagogo en Educación Primaria. Elabora el desarrollo del Plan de Desarrollo Curricular (PDC) para 2026.
  
    🎯 INSTRUCCIÓN PREVIA DE REVISIÓN Y CORRECCIÓN ORTOGRÁFICA
    Revisa detalladamente toda la información introducida por el usuario y corrige automáticamente cualquier error ortográfico o gramatical.

    Para cada Área de Saberes y Conocimientos (\${formData.areasDelMes.length > 0 ? formData.areasDelMes.join(", ") : "(áreas seleccionadas)"}), se deberá presentar la información respetando ESTRICTAMENTE la siguiente secuencia en formato MARKDOWN:

    ## ÁREA DE SABER Y CONOCIMIENTO: [NOMBRE COMPLETO DEL AREA]

    Crea una TABLA principal en Markdown de 6 columnas con la siguiente estructura:
    Primera fila (encabezados):
    | Objetivo de aprendizaje | Contenidos | Momentos del proceso formativo | Recursos | Periodos | Criterios de evaluación |

    Filas siguientes:
    Deberás crear una fila ÚNICAMENTE para las semanas que tengan contenidos registrados para ESA área. 
    Columna 1: Objetivo de aprendizaje (ver instrucciones más abajo).
    Columna 2: Mostrar la semana correspondiente junto con el contenido registrado (Ej: "Semana 1:<br>[Contenido]").
    Columna 3: Momentos del proceso formativo de la semana correspondiente.
    Columna 4: Recursos de la semana correspondiente.
    Columna 5: Periodos (debe mostrarse ÚNICAMENTE el número 11).
    Columna 6: Criterios de evaluación (ver instrucciones más abajo).

    ⚠️ LÓGICA DE VISUALIZACIÓN EN LA TABLA:
    El 'Objetivo de aprendizaje' y los 'Criterios de evaluación' deben mostrarse ÚNICAMENTE en la primera semana que se muestre en la tabla. 
    En el resto de las semanas, estas dos celdas (columnas 1 y 6) deben quedar vacías. Recuerda: NO debes incluir filas para semanas sin contenido de ESA área.
    
    ⚠️ FORMATO OBLIGATORIO DENTRO DE LA TABLA:
    - Dentro de las celdas usa etiquetas HTML <br> para separar líneas o párrafos. NUNCA uses saltos de línea crudos (\\n) que rompan la tabla Markdown.
    - Cada elemento (actividad, recurso) debe iniciar con guion (-).
    - REQUISITO OBLIGATORIO: NO GENERAR IMÁGENES. Entrega solo texto técnico.

    🔹 OBJETIVO DE APRENDIZAJE DEL ÁREA (columna 1):
    Redacta un objetivo mensual único para cada área, siguiendo la estructura: VERBO + CONTENIDO + CÓMO + PARA QUÉ. 
    Usa solo uno de estos verbos: \${objNivel}.

    🔹 CONTENIDOS POR SEMANA (columna 2) (Genera la tabla usando los siguientes datos proporcionados por el usuario):
    \${JSON.stringify(formData.datosSemanales, null, 2)}
    Agrupa los contenidos por área. Si en una semana el usuario seleccionó un área y le asignó contenido, crea la fila. Si no, omítela.

    🔹 MOMENTOS DEL PROCESO FORMATIVO (columna 3):
    - INSTRUCCIÓN: (Práctica) Redactar 1 o 2 actividades por semana (usar verbos: \${vPractica}).
    - OBLIGATORIO: Integrar en la Práctica de manera semanal un "Plan de lectura" breve, con una duración de 15 minutos por semana. 
    - EJEMPLO: **Plan de lectura** (15 min): Leemos un breve relato sobre los números... (Práctica)
    - INSTRUCCIÓN: (Teoría) Redactar 1 o 2 actividades (usar verbos: \${vTeoria}).
    - INSTRUCCIÓN: (Producción) Redactar 1 o 2 actividades (usar verbos: \${vProduccion}).
    - INSTRUCCIÓN: (Valoración) El estudiante debe reflexionar sobre su propio proceso formativo.
    Al finalizar la redacción de cada momento colocar entre paréntesis (Práctica), (Teoría), (Producción), (Valoración).

    🔹 RECURSOS (columna 4):
    Ej: -Video Proyector<br>-Textos de apoyo

    🔹 CRITERIOS DE EVALUACIÓN (columna 6) (2 indicadores por dimensión):
    SER, SABER, HACER.

    IMPORTANTE Y OBLIGATORIO:
    - Responde ÚNICAMENTE con los títulos de las áreas (usando ##) y las tablas en formato Markdown de 6 columnas. NO escribas NADA FUERA DE LAS TABLAS. No incluyas explicaciones.
    \`;

    try {
        let contentResponse = '';
        let finalProvider = 'Desconocido';
        let exito = false;

        // Intentar Gemini
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
                console.warn(\`[generate-pdc-tabla] Falló Gemini \${geminiIndex}: \${error.message}\`);
            }
            geminiIndex++;
        }

        // Fallback a Groq si falló Gemini
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
                    console.warn(\`[generate-pdc-tabla] Falló Groq \${groqIndex}: \${error.message}\`);
                }
                groqIndex++;
            }
        }

        if (!exito) {
            throw new Error(\`Fallaron todas las claves de Gemini y Groq disponibles.\`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ 
                tablasPorArea: contentResponse.replace(/\`\`\`markdown/gi, '').replace(/\`\`\`/g, '').trim(),
                provider: finalProvider
            })
        };
    } catch (error) {
        console.error('[generate-pdc-tabla] Error en generación con IA:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Error al contactar IA', details: error.message })
        };
    }
};
`;

fs.writeFileSync(funcPath, newFunc);
console.log('generate-pdc-tabla.js updated with fallback.');
