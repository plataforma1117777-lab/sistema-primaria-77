const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

const fetchGeminiFn = `
// --- FUNCION DE LLAMADA DIRECTA A GEMINI DESDE EL NAVEGADOR ---
async function fetchGeminiWithRotation(prompt, keys, fallbackName) {
    let exito = false;
    let contentResponse = '';
    let finalProvider = 'Desconocido';
    let errores = [];

    let geminiIndex = 1;
    for (const apiKey of keys) {
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
            errores.push(\`Gm\${geminiIndex}:\${error.message}\`);
            console.warn(\`[\${fallbackName}] Falló Gemini \${geminiIndex}: \${error.message}\`);
        }
        geminiIndex++;
    }

    if (!exito) {
        throw new Error(\`Fallaron todas las claves. Detalles: \${errores.join(' | ')}\`);
    }

    return {
        content: contentResponse.replace(/\`\`\`markdown/gi, '').replace(/\`\`\`/g, '').trim(),
        provider: finalProvider
    };
}
`;

// Insert the function before generarPDC()
if (!content.includes('fetchGeminiWithRotation')) {
    content = content.replace('async function generarPDC() {', fetchGeminiFn + '\nasync function generarPDC() {');
}

// Replace the tabla fetch block
const oldTablaFetch = `        const tablaPDCResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-tabla', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData })
        });
        const tablaPDCData = await tablaPDCResponse.json();
        pdcData.generatedContent.tablasPorArea = tablaPDCData.tablasPorArea || {};

        if (tablaPDCData.provider) mostrarProveedor(tablaPDCData.provider);`;

const newTablaFetch = `        const tablaPDCResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-tabla', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData })
        });
        const tablaDataServer = await tablaPDCResponse.json();
        
        const geminiResult = await fetchGeminiWithRotation(tablaDataServer.prompt, tablaDataServer.geminiKeys, 'generate-pdc-tabla');
        
        pdcData.generatedContent.tablasPorArea = geminiResult.content;
        if (geminiResult.provider) mostrarProveedor(geminiResult.provider);`;

content = content.replace(oldTablaFetch, newTablaFetch);

// Replace the adaptaciones fetch block
const oldAdapFetch = `            const adaptacionesResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-adaptaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData })
            });
            const adaptacionesData = await adaptacionesResponse.json();
            pdcData.generatedContent.adaptaciones = adaptacionesData.content || '';

            if (adaptacionesData.provider) mostrarProveedor(adaptacionesData.provider);`;

const newAdapFetch = `            const adaptacionesResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-adaptaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData })
            });
            const adapDataServer = await adaptacionesResponse.json();
            
            const geminiAdapResult = await fetchGeminiWithRotation(adapDataServer.prompt, adapDataServer.geminiKeys, 'generate-pdc-adaptaciones');
            
            pdcData.generatedContent.adaptaciones = geminiAdapResult.content;
            if (geminiAdapResult.provider) mostrarProveedor(geminiAdapResult.provider);`;

content = content.replace(oldAdapFetch, newAdapFetch);

fs.writeFileSync(scriptPath, content);
console.log('script.js updated successfully!');
