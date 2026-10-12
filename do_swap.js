const fs = require('fs');
const path = require('path');

function replaceProviders(filename, tag) {
    const filePath = path.join(__dirname, 'netlify', 'functions', filename);
    let content = fs.readFileSync(filePath, 'utf8');

    const newLogic = `
        // Intentar Groq Primero (Más rápido, evita timeout)
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
                const msg = \`Gr\${groqIndex}:\${error.message}\`;
                errores.push(msg);
                console.warn(\`[\${tag}] Falló Groq \${groqIndex}: \${error.message}\`);
            }
            groqIndex++;
        }

        // Fallback a Gemini si Groq falla
        if (!exito) {
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
        }

        if (!exito) {`;

    // Regex to find from 'let geminiIndex = 1;' up to 'if (!exito) {' at the end
    // we must be careful.
    
    // Split the file into three parts: before the blocks, the blocks, and after the blocks
    let startIdx = content.indexOf('// Intentar Gemini');
    if (startIdx === -1) {
        startIdx = content.indexOf('let geminiIndex = 1;');
    }
    const endStr = 'if (!exito) {\n            throw new Error(`Fallaron todas las claves';
    let endIdx = content.indexOf(endStr);
    
    if (startIdx !== -1 && endIdx !== -1) {
        const before = content.substring(0, startIdx);
        const after = content.substring(endIdx);
        fs.writeFileSync(filePath, before + newLogic + '\n' + after);
        console.log(filename + " updated.");
    } else {
        console.log("Could not find blocks in " + filename);
    }
}

replaceProviders('generate-pdc-tabla.js', 'generate-pdc-tabla');
replaceProviders('generate-pdc-adaptaciones.js', 'generate-pdc-adaptaciones');
