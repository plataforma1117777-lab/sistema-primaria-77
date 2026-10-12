const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const primariaDir = path.join(rootDir, 'PDC_primaria');

let primIndex = fs.readFileSync(path.join(primariaDir, 'index.html'), 'utf8');

const loginScreen = `    <div id="login-screen" class="login-container" style="display: none;">
        <div class="login-card">
            <h2>Acceso al Sistema</h2>
            <p>Ingrese su contraseña para continuar</p>
            <div class="input-group">
                <input type="password" id="login-password" class="input-style" placeholder="Contraseña">
                <button type="button" id="toggle-password" class="toggle-password-btn" title="Mostrar/Ocultar contraseña">👁️</button>
            </div>
            <div id="login-error" class="login-error"></div>
            <button type="button" onclick="verificarLogin()" class="btn-primary mt-2">Ingresar</button>
        </div>
    </div>`;

const resultsPanel = `        <div id="results-panel" style="display:none;">

            <!-- LOG DE GENERACIÓN -->
            <div class="section-card" id="log-card">
                <div class="step-header">
                    <div class="step-number"
                        style="background: linear-gradient(135deg, var(--accent), var(--accent-light));">✦</div>
                    <h2 class="step-title">Generación en Progreso...</h2>
                </div>

                <!-- BARRA DE PROGRESO -->
                <div id="progress-container" style="margin-bottom: 1.5rem; display: none;">
                    <div
                        style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: center;">
                        <span id="progress-text"
                            style="color: var(--primary-light); font-weight: bold; font-size: 0.9rem;">Iniciando...</span>
                        <div>
                            <span id="api-provider-badge"
                                style="display:none; background: rgba(99,102,241,0.2); border: 1px solid var(--primary-light); color: var(--primary-light); padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; margin-right: 10px; font-weight: bold; text-transform: uppercase;"></span>
                            <span id="progress-percent" style="color: var(--text-muted); font-size: 0.9rem;">0%</span>
                        </div>
                    </div>
                    <div
                        style="width: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 99px; height: 10px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
                        <div id="progress-bar"
                            style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); transition: width 0.5s ease; position: relative;">
                            <div
                                style="position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent); background-size: 20px 20px; animation: progress-stripes 1s linear infinite;">
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    @keyframes progress-stripes {
                        0% { background-position: 20px 0; }
                        100% { background-position: 0 0; }
                    }
                </style>

                <div id="generation-log" class="generation-log"></div>
            </div>

            <!-- BOTONES DE ACCIÓN -->
            <div id="action-buttons" class="action-buttons-container" style="display:none;">
                <button onclick="descargarWord()" class="btn-download" id="btn-word">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="12" y1="18" x2="12" y2="12"></line>
                        <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Descargar PDC en Word
                </button>
                <button onclick="nuevoPDC()" class="btn-secondary-action">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.51 15a9 9 0 1 0 .49-3.51"></path>
                    </svg>
                    Nuevo PDC
                </button>
            </div>
        </div>`;

const markedScript = '<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>';
const loginScript = '<script src="login.js"></script>';

// Reemplazar en primIndex
primIndex = primIndex.replace('</head>', `    ${markedScript}\n</head>`);

// Insertar login-screen
primIndex = primIndex.replace('<body class="p-4 md:p-8">', `<body class="p-4 md:p-8">\n${loginScreen}`);

// El elemento principal de la app
primIndex = primIndex.replace('<div class="max-w-6xl mx-auto animate-fade-in">', '<div class="max-w-6xl mx-auto animate-fade-in" id="main-app" style="display: none;">');

// Reemplazar el boton de generacion (reemplazando desde generate2026Prompt hasta </button>)
primIndex = primIndex.replace(
    /<button type="button" onclick="generate2026Prompt\(\)"[\s\S]*?<\/button>/,
    `<button type="button" onclick="generarPDC()" id="btn-generar"
                class="group w-full btn-primary flex items-center justify-center gap-3 py-5 overflow-hidden relative">
                <div
                    class="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12">
                </div>
                <i data-lucide="sparkles" class="w-6 h-6"></i>
                <span>GENERAR PDC CON IA</span>
            </button>`
);

// Reemplazar Resultado con resultsPanel (hasta el script)
primIndex = primIndex.replace(/<!-- Resultado -->[\s\S]*?(?=<!-- Modal Modificado -->|<script src="script.js">)/, `<!-- Resultado -->\n${resultsPanel}\n`);

// Scripts finales
primIndex = primIndex.replace('<script src="script.js"></script>', `${loginScript}\n    <script src="script.js"></script>`);
primIndex = primIndex.replace(/<div id="aiModal"[\s\S]*?<\/div>\s*<\/div>/, ''); // Remove aiModal if any

fs.writeFileSync(path.join(rootDir, 'index.html'), primIndex);
console.log("HTML fixed.");
