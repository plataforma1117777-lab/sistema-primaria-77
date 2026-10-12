const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const primariaDir = path.join(rootDir, 'PDC_primaria');

// --- 1. INDEX.HTML ---
let rootIndex = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
let primIndex = fs.readFileSync(path.join(primariaDir, 'index.html'), 'utf8');

// Extraer login-screen
const loginScreenMatch = rootIndex.match(/<div id="login-screen".*?<\/div>\s*<\/div>/s);
const loginScreen = loginScreenMatch ? loginScreenMatch[0] : '';

// Extraer results-panel
const resultsPanelMatch = rootIndex.match(/<!-- PANEL DE RESULTADOS -->\s*<div id="results-panel".*?<!-- MATERIAL DE APOYO -->/s);
let resultsPanel = resultsPanelMatch ? resultsPanelMatch[0].replace('<!-- MATERIAL DE APOYO -->', '') : '';

// Extraer script tags de index (marked y login.js)
const markedScript = '<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>';
const loginScript = '<script src="login.js"></script>';

// Reemplazar en primIndex
primIndex = primIndex.replace('</head>', `    ${markedScript}\n</head>`);
primIndex = primIndex.replace('<body class="p-4 md:p-8">', `<body class="p-4 md:p-8">\n    ${loginScreen}\n    <div id="main-app" style="display: none;">`);
// Cerrar el main-app al final, antes de modal o footer, no, mejor solo rodear lo principal.
// O cambiar body a main-app display none no, el login screen oculta main-app.
primIndex = primIndex.replace('<div class="max-w-6xl mx-auto animate-fade-in">', '<div class="max-w-6xl mx-auto animate-fade-in" id="main-app" style="display: none;">');

// Reemplazar boton de generacion
primIndex = primIndex.replace(
    /<button type="button" onclick="generate2026Prompt.*?>[\s\S]*?<\/button>/,
    `<button type="button" onclick="generarPDC()" class="group w-full btn-primary flex items-center justify-center gap-3 py-5 overflow-hidden relative" id="btn-generar">
        <div class="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12"></div>
        <i data-lucide="sparkles" class="w-6 h-6"></i>
        <span>GENERAR PDC CON IA</span>
    </button>`
);

// Reemplazar Resultado con resultsPanel
primIndex = primIndex.replace(/<!-- Resultado -->[\s\S]*?(?=<!-- Modal Modificado -->|<script src="script.js">)/, `<!-- Resultado -->\n${resultsPanel}\n`);
primIndex = primIndex.replace('<script src="script.js"></script>', `${loginScript}\n    <script src="script.js"></script>`);
primIndex = primIndex.replace(/<div id="aiModal"[\s\S]*?<\/div>\s*<\/div>/, ''); // Remove aiModal

fs.writeFileSync(path.join(rootDir, 'index.html'), primIndex);


// --- 2. STYLE.CSS ---
let rootStyle = fs.readFileSync(path.join(rootDir, 'style.css'), 'utf8');
let primStyle = fs.readFileSync(path.join(primariaDir, 'style.css'), 'utf8');

// Copy login styles and results panel styles from rootStyle
const loginStyles = rootStyle.match(/\.login-container[\s\S]*?\.login-error[^}]+\}/)[0];
// We also need some other styles like .btn-download, .btn-secondary-action, .log-info, .log-ok, etc.
const extraStyles = `
/* --- LOGIN & RESULTS PANEL ESTILOS (Secundaria) --- */
${loginStyles}

.generation-log {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.log-info { color: #94a3b8; margin-bottom: 8px; }
.log-ok { color: #10b981; margin-bottom: 8px; font-weight: bold; }
.log-error { color: #ef4444; margin-bottom: 8px; font-weight: bold; }
.log-writing { color: #8b5cf6; margin-bottom: 8px; font-style: italic; }

.action-buttons-container {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
}

.btn-download {
    flex: 2;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.btn-download:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-secondary-action {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-color, #e2e8f0);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.btn-secondary-action:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}
`;

fs.writeFileSync(path.join(rootDir, 'style.css'), primStyle + extraStyles);

console.log("HTML and CSS merged successfully.");
