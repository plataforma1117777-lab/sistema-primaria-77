const fs = require('fs');
const path = require('path');

const funcTabla = path.join(process.cwd(), 'netlify', 'functions', 'generate-pdc-tabla.js');

const newTabla = `require('dotenv').config();

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

        const objNivel = "Conoce, Identifica, Describe, Explica, Interpreta, Comprende, Clasifica, Organiza, Relaciona, Analiza, Compara, Argumenta, Justifica, Infiere, Aplica, Utiliza, Representa, Demuestra, Redacta, Desarrolla";
        const vPractica = "Jugamos, Conversamos, Exploramos, Observamos, Participamos, Narramos, Interpretamos, Modelamos, Realizamos, Construimos, Elaboramos, Recolectamos";
        const vTeoria = "Analizamos, Identificamos, Describimos, Clasificamos, Explicamos, Conceptualizamos, Sistematizamos, Comparamos, Investigamos, Comprendemos";
        const vProduccion = "Exponemos, Dramatizamos, Representamos gráficamente, Interpretamos, Ejecutamos, Demostramos, Elaboramos, Aplicamos, Preparamos, Componemos, Socializamos";

        const areasTexto = (formData.areasDelMes && formData.areasDelMes.length > 0) ? formData.areasDelMes.join(", ") : "(áreas seleccionadas)";

        const prompt = \`Actúa como un experto pedagogo en Educación Primaria. Elabora el desarrollo del Plan de Desarrollo Curricular (PDC) para 2026.
      
        🎯 INSTRUCCIÓN PREVIA DE REVISIÓN Y CORRECCIÓN ORTOGRÁFICA
        Revisa detalladamente toda la información introducida por el usuario y corrige automáticamente cualquier error ortográfico o gramatical.

        Para cada Área de Saberes y Conocimientos (\${areasTexto}), se deberá presentar la información respetando ESTRICTAMENTE la siguiente secuencia en formato MARKDOWN:

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
        \${JSON.stringify(formData.datosSemanales || [], null, 2)}
        Agrupa los contenidos por área. Si en una semana el usuario seleccionó un área y le asignó contenido, crea la fila. Si no, omítela.

        🔹 ESTRATEGIA NACIONAL DE FORTALECIMIENTO DEL LOGRO DE APRENDIZAJES (2026):
        El PDC debe aplicar la Estrategia Nacional de Fortalecimiento del Logro de Aprendizajes para consolidar los aprendizajes fundamentales, reducir brechas de aprendizaje y atender el rezago escolar.
        Las 5 áreas de aprendizajes fundamentales son:
        • Lectura: comprender, interpretar, evaluar y utilizar información de diversos tipos de textos.
        • Escritura: producir textos y contenidos multimodales con coherencia, cohesión y revisión.
        • Pensamiento lógico-matemático: resolver problemas, identificar relaciones, modelizar situaciones y argumentar razonamientos.
        • Indagación científica: formular preguntas investigables, plantear hipótesis, analizar evidencias y comunicar conclusiones.
        • Comunicación oral: expresar ideas de manera clara y respetuosa, fundamentar posiciones y responder a objeciones.

        🔹 MOMENTOS DEL PROCESO FORMATIVO (columna 3):
        - Redactar actividades concretas, aplicables en el aula y útiles para fortalecer los aprendizajes según el contenido y campo/área de conocimiento.
        - En cada uno de los cuatro momentos (Práctica, Teoría, Valoración y Producción), se DEBEN integrar las áreas de aprendizajes fundamentales pertinentes al contenido desarrollado:
          * No es obligatorio incluir las cinco áreas en cada momento; selecciona únicamente aquellas pertinentes evitando incorporaciones forzadas.
          * REQUISITO OBLIGATORIO: Cada uno de los cuatro momentos metodológicos (Práctica, Teoría, Valoración y Producción) DEBE incorporar, como MÍNIMO, una actividad vinculada explícitamente con un aprendizaje fundamental.
          * IDENTIFICACIÓN EXPLÍCITA: Coloca el nombre del aprendizaje fundamental seguido de dos puntos antes de la actividad (directamente en la descripción, sin apartados ni encabezados adicionales).
            Ejemplos:
            - Lectura: lectura e interpretación de un texto relacionado con el contenido... (Práctica)
            - Comunicación oral: diálogo y socialización grupal acerca de... (Práctica)
            - Pensamiento lógico-matemático: resolución de problemas y justificación de procedimientos sobre... (Teoría)
            - Indagación científica: formulación de hipótesis y análisis de evidencias acerca de... (Teoría)
            - Comunicación oral: reflexión crítica y fundamentación de opiniones sobre... (Valoración)
            - Escritura: redacción de procedimientos, informes y conclusiones con coherencia sobre... (Producción)
        - Práctica: 1 o 2 actividades por semana (usar verbos: \${vPractica}). Mantener articulado el "Plan de lectura" (15 min) como actividad de Lectura vinculada al contenido.
        - Teoría: 1 o 2 actividades (usar verbos: \${vTeoria}) vinculadas al análisis y conceptualización del contenido.
        - Valoración: 1 o 2 actividades donde el estudiante reflexiona críticamente sobre su proceso formativo, saberes y actitudes.
        - Producción: 1 o 2 actividades (usar verbos: \${vProduccion}) orientadas a la elaboración tangible o aplicación práctica de lo aprendido.
        - OBLIGATORIO: Al finalizar la redacción de cada actividad, colocar entre paréntesis el momento correspondiente: (Práctica), (Teoría), (Valoración), (Producción).

        🔹 RECURSOS (columna 4):
        Ej: -Video Proyector<br>-Textos de apoyo<br>-Material concreto

        🔹 CRITERIOS DE EVALUACIÓN (columna 6) (2 indicadores por dimensión):
        - Los criterios deben relacionarse explícitamente con los aprendizajes fundamentales y con las actividades desarrolladas en los momentos metodológicos.
        - Generar criterios observables, específicos y coherentes con el contenido (evitar formulaciones genéricas).
        - Mantener la estructura habitual del PDC distribuidos en las dimensiones SER, SABER y HACER:
          * SER: 2 indicadores vinculados a valores sociocomunitarios, actitudes de respeto, responsabilidad y escucha activa.
          * SABER: 2 indicadores vinculados a los aprendizajes fundamentales pertinentes al área y contenido (ej. Lectura: interpreta información clave de textos o consignas sobre...; Pensamiento lógico-matemático: analiza y explica relaciones o propiedades numéricas de...; etc.).
          * HACER: 2 indicadores vinculados a los aprendizajes fundamentales pertinentes al área y contenido (ej. Escritura: redacta procedimientos y conclusiones con claridad y precisión sobre...; Indagación científica: formula preguntas y analiza evidencias acerca de...; Comunicación oral: expresa y argumenta ideas con claridad en...; etc.).
        - Formato en la celda:
          SER:<br>- [Indicador 1 de actitud/valor]<br>- [Indicador 2 de convivencia/respeto]<br>SABER:<br>- [Aprendizaje Fundamental]: [Criterio observable sobre el contenido]<br>- [Aprendizaje Fundamental]: [Criterio observable sobre el contenido]<br>HACER:<br>- [Aprendizaje Fundamental]: [Criterio de aplicación/producción sobre el contenido]<br>- [Aprendizaje Fundamental]: [Criterio de aplicación/indagación sobre el contenido]

        IMPORTANTE Y OBLIGATORIO:
        - Responde ÚNICAMENTE con los títulos de las áreas (usando ##) y las tablas en formato Markdown de 6 columnas. NO escribas NADA FUERA DE LAS TABLAS. No incluyas explicaciones.
        \`;

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
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error interno en el servidor', details: error.message })
        };
    }
};
`;

fs.writeFileSync(funcTabla, newTabla);
