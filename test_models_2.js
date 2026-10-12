require('dotenv').config();

const prompt = `Actúa como un experto pedagogo en Educación Primaria. Elabora el desarrollo del Plan de Desarrollo Curricular (PDC) para 2026.
Para el área Matemática, escribe una tabla con 4 filas y 6 columnas. Responde lo más rápido posible.`;

async function testModel(modelName) {
    const start = Date.now();
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY_1}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
            })
        });
        if (!response.ok) {
            console.log(`[${modelName}] Error ${response.status} ${await response.text()}`);
            return;
        }
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const time = Date.now() - start;
        console.log(`[${modelName}] Success in ${time}ms. Length: ${text.length}`);
    } catch (e) {
        console.log(`[${modelName}] Exception: ${e.message}`);
    }
}

(async () => {
    await testModel('gemini-1.5-flash');
    await testModel('gemini-1.5-flash-latest');
    await testModel('gemini-1.5-pro');
})();
