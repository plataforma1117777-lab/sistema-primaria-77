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

        const objNivel = "Conoce, Identifica, Describe, Explica, Interpreta, Comprende, Clasifica, Organiza, Relaciona, Analiza, Compara, Argumenta, Justifica, Infiere, Aplica, Utiliza, Representa, Demuestra, Redacta, Desarrolla";
        const vPractica = "Jugamos, Conversamos, Exploramos, Observamos, Participamos, Narramos, Interpretamos, Modelamos, Realizamos, Construimos, Elaboramos, Recolectamos";
        const vTeoria = "Analizamos, Identificamos, Describimos, Clasificamos, Explicamos, Conceptualizamos, Sistematizamos, Comparamos, Investigamos, Comprendemos";
        const vProduccion = "Exponemos, Dramatizamos, Representamos gráficamente, Interpretamos, Ejecutamos, Demostramos, Elaboramos, Aplicamos, Preparamos, Componemos, Socializamos";

        const areasTexto = (formData.areasDelMes && formData.areasDelMes.length > 0) ? formData.areasDelMes.join(", ") : "(áreas seleccionadas)";

        // Transformar datosSemanales a agrupados por área para facilitar el trabajo de la IA
        const contenidosPorArea = {};
        if (formData.datosSemanales) {
            formData.datosSemanales.forEach(sem => {
                if (sem.filas) {
                    sem.filas.forEach(fila => {
                        if (!contenidosPorArea[fila.area]) contenidosPorArea[fila.area] = [];
                        contenidosPorArea[fila.area].push({
                            semana: sem.semana,
                            contenido: fila.contenido
                        });
                    });
                }
            });
        }
        const areasRegistradas = Object.keys(contenidosPorArea);
        const numeroDeAreas = areasRegistradas.length;
        const listaAreasRegistradas = areasRegistradas.join(", ");

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

        const instruccionAdaptacion = (formData.categoriaAdaptacion === 'curricular' && formData.tipoAdaptacion) ?
            `
        🔹 ADAPTACIONES CURRICULARES (DIFICULTADES LEVES / REZAGO) - OBLIGATORIO:
        INMEDIATAMENTE DESPUÉS de la tabla principal de esta área, debes generar una SEGUNDA TABLA en Markdown, independiente y separada, exclusiva para las adaptaciones curriculares.
        Estructura obligatoria de esta nueva tabla (1 sola columna y 2 filas):
        | ADAPTACIONES CURRICULARES (DIFICULTADES LEVES / REZAGO): |
        |---|
        | Condición: ${formData.tipoAdaptacion}. <br> - Escribe aquí las actividades de apoyo sugeridas... |
        
        IMPORTANTE: Deja una línea en blanco entre la tabla principal y esta nueva tabla de adaptaciones para asegurar que no se fusionen.
        ` : '';

        const prompts = areasRegistradas.map(area => {
            const contenidoDelArea = { [area]: contenidosPorArea[area] };
            return `Actúa como un experto pedagogo en Educación Primaria. Elabora el desarrollo del Plan de Desarrollo Curricular (PDC) para 2026.
      
        🎯 INSTRUCCIÓN PREVIA DE REVISIÓN Y CORRECCIÓN ORTOGRÁFICA
        Revisa detalladamente toda la información introducida por el usuario y corrige automáticamente cualquier error ortográfico o gramatical.

        ⚠️ ALERTA CRÍTICA DE INTEGRIDAD Y REGLA ABSOLUTA: El JSON de datos adjunto contiene los contenidos para el área de ${mapNombresAreas[area] || area}. 
        DEBES GENERAR LA PLANIFICACIÓN PARA ESTA ÁREA ESPECÍFICA.
        Tu respuesta DEBE contener exactamente 1 título y 1 tabla principal correspondiente a esta área. 
        NO RESUMAS, NO RECORTES Y NO OMITAS NINGUNA INFORMACIÓN REGISTRADA. Mantén el texto original completo de los contenidos, criterios y orientaciones.
        
        Para el Área de Saberes y Conocimientos listada, se deberá presentar la información respetando ESTRICTAMENTE la siguiente secuencia en formato MARKDOWN:

        ## ÁREA DE SABER Y CONOCIMIENTO: ${mapNombresAreas[area] || area}

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
        En el resto de las semanas, estas dos celdas (columnas 1 y 6) deben quedar vacías. Recuerda: NO debes incluir filas para semanas sin contenido.
        
        ⚠️ FORMATO OBLIGATORIO DENTRO DE LA TABLA:
        - Dentro de las celdas usa etiquetas HTML <br> para separar líneas o párrafos. NUNCA uses saltos de línea crudos (\\n) que rompan la tabla Markdown.
        - Cada elemento (actividad, recurso) debe iniciar con guion (-).
        - REQUISITO OBLIGATORIO: NO GENERAR IMÁGENES. Entrega solo texto técnico.

        🔹 OBJETIVO DE APRENDIZAJE DEL ÁREA (columna 1):
        Redacta un objetivo mensual único para el área, siguiendo la estructura: VERBO + CONTENIDO + CÓMO + PARA QUÉ. 
        Usa solo uno de estos verbos: ${objNivel}.

        🔹 CONTENIDOS AGRUPADOS PARA ESTA ÁREA (Genera la tabla basándote estrictamente en este JSON):
        ${JSON.stringify(contenidoDelArea, null, 2)}
        
        Dentro de la tabla del área, DEBES crear exactamente una fila por CADA OBJETO (semana) que aparece bajo esa área en el JSON. Revisa el JSON con detalle y asegúrate de imprimir todas las semanas que correspondan. NO resumas, agrupes ni omitas filas. Toda la información registrada debe transcribirse de manera completa y sin recortes.

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
        - Práctica: 1 o 2 actividades por semana (usar verbos: ${vPractica}). Mantener articulado el "Plan de lectura" (15 min) como actividad de Lectura vinculada al contenido.
        - Teoría: 1 o 2 actividades (usar verbos: ${vTeoria}) vinculadas al análisis y conceptualización del contenido.
        - Valoración: 1 o 2 actividades donde el estudiante reflexiona críticamente sobre su proceso formativo, saberes y actitudes.
        - Producción: 1 o 2 actividades (usar verbos: ${vProduccion}) orientadas a la elaboración tangible o aplicación práctica de lo aprendido.
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
        ${instruccionAdaptacion}

        IMPORTANTE Y OBLIGATORIO:
        - Responde ÚNICAMENTE con el título del área (usando ##) y la(s) tabla(s) en formato Markdown. NO escribas NADA FUERA DE LAS TABLAS. No incluyas explicaciones.
        `;
        });

        let contentResponse = '';
        let finalProvider = 'Desconocido';
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                prompts: prompts,
                geminiKeys: geminiKeys
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
