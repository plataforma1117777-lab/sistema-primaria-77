const fs = require('fs');
const path = require('path');

function useOnlyGemini(filename, tag) {
    const filePath = path.join(__dirname, 'netlify', 'functions', filename);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove Groq keys from the arrays at the top (if we want, or just ignore them)
    // Actually, let's remove the logic block.

    const newLogic = `
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
                const msg = \`Gm\${geminiIndex}:\${error.message}\`;
                errores.push(msg);
                console.warn(\`[\${tag}] Falló Gemini \${geminiIndex}: \${error.message}\`);
            }
            geminiIndex++;
        }

        if (!exito) {`;

    let startIdx = content.indexOf('// Intentar Groq Primero');
    if (startIdx === -1) startIdx = content.indexOf('let groqIndex = 1;');
    
    let endIdx = content.indexOf('if (!exito) {\n            throw new Error(`Fallaron todas las claves');
    
    if (startIdx !== -1 && endIdx !== -1) {
        const before = content.substring(0, startIdx);
        const after = content.substring(endIdx);
        fs.writeFileSync(filePath, before + newLogic + '\n' + after);
        console.log(filename + " updated to only use Gemini.");
    } else {
        console.log("Could not find blocks in " + filename);
    }
}

useOnlyGemini('generate-pdc-tabla.js', 'generate-pdc-tabla');
useOnlyGemini('generate-pdc-adaptaciones.js', 'generate-pdc-adaptaciones');
