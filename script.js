
/* =================================================================
   PDC Primaria 2026 - SCRIPT.JS (ADAPTADO CON LÓGICA DE SECUNDARIA)
   Sistema de Planificación 2026 — Generación directa con IA
   ================================================================= */

// Estado global del PDC generado
let pdcData = { formData: {}, generatedContent: {} };

const COLORES_AREAS = {
    "VEyR": { bg: "rgba(6, 182, 212, 0.15)", border: "#06b6d4" },
    "CyL": { bg: "rgba(149, 184, 20, 0.15)", border: "#14b8a6" },
    "CS": { bg: "rgba(244, 63, 94, 0.15)", border: "#f43f5e" },
    "APyV": { bg: "rgba(217, 70, 239, 0.15)", border: "#d946ef" },
    "EFyD": { bg: "rgba(14, 165, 233, 0.15)", border: "#0ea5e9" },
    "EM": { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b" },
    "CN": { bg: "rgba(132, 204, 22, 0.15)", border: "#84cc16" },
    "Mat": { bg: "rgba(139, 92, 246, 0.15)", border: "#8b5cf6" },
    "TT": { bg: "rgba(161, 161, 170, 0.15)", border: "#a1a1aa" }
};

const AREAS_PRIMARIA = [
    { abrev: "VEyR", nombre: "Valores Espiritualidades y Religiones" },
    { abrev: "CyL", nombre: "Comunicación y Lenguaje" },
    { abrev: "CS", nombre: "Ciencias Sociales" },
    { abrev: "APyV", nombre: "Artes Plásticas y Visuales" },
    { abrev: "EFyD", nombre: "Educación Física y Deportes" },
    { abrev: "EM", nombre: "Educación Musical" },
    { abrev: "CN", nombre: "Ciencias Naturales" },
    { abrev: "Mat", nombre: "Matemática" },
    { abrev: "TT", nombre: "Técnica Tecnológica" }
];

document.addEventListener("DOMContentLoaded", function () {
    insertarLeyendaAreas();

    const contenedorSemanas = document.getElementById('contenedor-semanas');
    if (contenedorSemanas) {
        let htmlSemanas = "";
        for (let sem = 1; sem <= 5; sem++) {
            htmlSemanas += `
                <div class="semana-card group" id="semana-container-${sem}">
                    <div class="semana-header px-1">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/20">
                                <span class="text-xs font-black text-violet-400">${sem}</span>
                            </div>
                            <h3 class="font-bold text-white tracking-widest text-sm uppercase">SEMANA ${sem}</h3>
                        </div>
                        <button type="button" onclick="toggleSemana(${sem})" class="p-2 hover:bg-white/5 rounded-lg transition-colors group/btn">
                            <i data-lucide="chevron-up" id="icon-toggle-${sem}" class="w-4 h-4 text-zinc-500 group-hover/btn:text-white transition-transform" ${sem === 5 ? 'style="transform: rotate(180deg);"' : ''}></i>
                        </button>
                    </div>
                    <div id="filas-semana-${sem}" class="space-y-3 transition-all duration-300 origin-top" ${sem === 5 ? 'style="display: none;"' : ''}>
                        ${generarFilas(sem)}
                    </div>
                </div>`;
        }
        contenedorSemanas.innerHTML = htmlSemanas;
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    ajustarTextareasDinamicos();
    inicializarColoresAreas();

    // Guardado y carga
    const saved = localStorage.getItem('pdcFormDataPrimaria');
    if (saved) {
        cargarDatosGuardados();
    } else {
        aplicarColoresDefault();
    }

    document.querySelectorAll('#pdcForm input, #pdcForm select, #pdcForm textarea').forEach(el => {
        el.addEventListener('change', guardarDatos);
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
            el.addEventListener('input', guardarDatos);
        }
    });
});

// --- FUNCIONES COMPLEMENTARIAS PARA LA INTERFAZ ---
function inicializarColoresAreas() {
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id.startsWith('area_s')) {
            const areaSeleccionada = e.target.value;
            if (COLORES_AREAS[areaSeleccionada]) {
                e.target.style.backgroundColor = COLORES_AREAS[areaSeleccionada].bg;
                e.target.style.borderColor = COLORES_AREAS[areaSeleccionada].border;
                e.target.style.color = COLORES_AREAS[areaSeleccionada].border;
            } else {
                e.target.style.backgroundColor = "";
                e.target.style.borderColor = "";
                e.target.style.color = "";
            }
            guardarDatos();
        }
    });
}

function toggleSemana(numSemana) {
    const contenedor = document.getElementById(`filas-semana-${numSemana}`);
    const icon = document.getElementById(`icon-toggle-${numSemana}`);

    if (contenedor.style.display === "none") {
        contenedor.style.display = "block";
        icon.style.transform = "rotate(0deg)";
    } else {
        contenedor.style.display = "none";
        icon.style.transform = "rotate(180deg)";
    }
}

function ajustarTextareasDinamicos() {
    for (let s = 1; s <= 5; s++) {
        for (let f = 1; f <= 9; f++) {
            const inputOriginal = document.getElementById(`cont_s${s}_f${f}`);
            if (inputOriginal) {
                const textarea = document.createElement('textarea');
                textarea.id = inputOriginal.id;
                textarea.className = inputOriginal.className + " resize-none overflow-hidden min-h-[44px] py-3 custom-scrollbar";
                textarea.placeholder = inputOriginal.placeholder;
                textarea.rows = 1;

                textarea.addEventListener('input', function () {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                });

                // Si ya había value
                if (inputOriginal.value) textarea.value = inputOriginal.value;

                inputOriginal.parentNode.replaceChild(textarea, inputOriginal);
            }
        }
    }

    const textareaAdaptacion = document.getElementById('tipoAdaptacion');
    if (textareaAdaptacion) {
        textareaAdaptacion.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
}

function toggleAdaptacionUI() {
    const selector = document.getElementById('categoriaAdaptacion').value;
    const curricular = document.getElementById('container-curricular');
    const significativa = document.getElementById('container-significativa');

    if (selector === 'curricular') {
        curricular.style.display = 'block';
        significativa.style.display = 'none';
    } else {
        curricular.style.display = 'none';
        significativa.style.display = 'block';
    }
}

function agregarEstudiante() {
    const container = document.getElementById('lista-estudiantes-significativa');
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 animate-fade-in mt-3';
    div.innerHTML = `
        <input type="text" class="input-style flex-1 estudiante-significativo" placeholder="Ej: Estudiante: Discapacidad/Condición" oninput="guardarDatos()">
        <button type="button" onclick="eliminarEstudiante(this)" class="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
        </button>
    `;
    container.appendChild(div);
    if (window.lucide) window.lucide.createIcons();
    guardarDatos();
}

function eliminarEstudiante(btn) {
    const container = document.getElementById('lista-estudiantes-significativa');
    if (container.children.length > 1) {
        btn.parentElement.remove();
        guardarDatos();
    }
}

function insertarLeyendaAreas() {
    const contenedorLeyenda = document.getElementById('columna-derecha-leyenda');
    if (!contenedorLeyenda) return;

    const contenido = AREAS_PRIMARIA.map(a => {
        const colores = COLORES_AREAS[a.abrev] || { bg: "transparent", border: "rgba(255,255,255,0.1)" };
        return `
            <div class="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-violet-500/20 hover:bg-white/[0.04] transition-all group/tag">
                <div class="shrink-0 w-2 h-2 rounded-full" style="background-color: ${colores.border}; box-shadow: 0 0 12px ${colores.border}60"></div>
                <div class="flex flex-col min-w-0">
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-[10px] font-black text-white leading-none uppercase tracking-tighter">${a.abrev}</span>
                        <span class="text-[7px] font-bold text-violet-400 opacity-0 group-hover/tag:opacity-100 transition-opacity">●</span>
                    </div>
                    <span class="text-[8px] font-bold text-zinc-500 leading-none uppercase tracking-tight truncate group-hover/tag:text-zinc-300 transition-colors mt-1">${a.nombre}</span>
                </div>
            </div>`;
    }).join('');

    contenedorLeyenda.innerHTML = `
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2 shrink-0">
                    <div class="p-1.5 bg-violet-500/10 rounded-lg border border-violet-500/20">
                        <i data-lucide="book-open" class="w-3.5 h-3.5 text-violet-400"></i>
                    </div>
                    <span class="text-[10px] font-black text-violet-200 uppercase tracking-[0.2em]">Guía de Referencia de Áreas</span>
                </div>
                <div class="h-px flex-1 bg-gradient-to-r from-violet-500/20 to-transparent"></div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                ${contenido}
            </div>
        </div>`;
}

function generarFilas(numSemana) {
    let filas = "";
    for (let f = 1; f <= 9; f++) {
        const areaPredef = AREAS_PRIMARIA[f - 1] ? AREAS_PRIMARIA[f - 1].abrev : "";
        filas += `
            <div class="grid-row-primaria">
                <select id="area_s${numSemana}_f${f}" class="input-style bg-white/5 text-[10px] font-black tracking-tighter transition-all duration-300 cursor-pointer hover:border-violet-500/50 appearance-none text-center">
                    <option value="" class="bg-zinc-900 border-none">- ÁREA -</option>
                    ${AREAS_PRIMARIA.map(a => `<option value="${a.abrev}" class="bg-zinc-900" ${a.abrev === areaPredef ? 'selected' : ''}>${a.abrev}</option>`).join('')}
                </select>
                <div class="relative w-full">
                    <input type="text" id="cont_s${numSemana}_f${f}" class="input-style text-xs" placeholder="Tema o contenido curricular...">
                </div>
            </div>`;
    }
    return filas;
}

// ─────────────────────────────────────────────
// PERSISTENCIA EN LOCALSTORAGE
// ─────────────────────────────────────────────
function guardarDatos() {
    const datos = {
        numeroPDC: document.getElementById('numeroPDC')?.value || '01',
        distrito: document.getElementById('distrito')?.value || '',
        nivel: document.getElementById('nivel')?.value || 'Primaria Comunitaria Vocacional',
        directora: document.getElementById('directora')?.value || '',
        maestro: document.getElementById('maestro')?.value || '',
        trimestre: document.getElementById('trimestre')?.value || '',
        duracion: document.getElementById('duracion')?.value || '',
        ue: document.getElementById('ue')?.value || '',
        escolaridad: document.getElementById('escolaridad')?.value || '',
        categoriaAdaptacion: document.getElementById('categoriaAdaptacion')?.value || 'curricular',
        tipoAdaptacion: document.getElementById('tipoAdaptacion')?.value || '',
        estudiantes: [],
        grilla: {}
    };

    const inputsEstudiantes = document.querySelectorAll('.estudiante-significativo');
    inputsEstudiantes.forEach(input => {
        if (input.value.trim() !== '') datos.estudiantes.push(input.value.trim());
    });

    for (let s = 1; s <= 5; s++) {
        datos.grilla[s] = [];
        for (let f = 1; f <= 9; f++) {
            const area = document.getElementById(`area_s${s}_f${f}`)?.value || '';
            const cont = document.getElementById(`cont_s${s}_f${f}`)?.value || '';
            datos.grilla[s].push({ area, cont });
        }
    }
    localStorage.setItem('pdcFormDataPrimaria', JSON.stringify(datos));
}

function cargarDatosGuardados() {
    const saved = localStorage.getItem('pdcFormDataPrimaria');
    if (!saved) return;
    try {
        const datos = JSON.parse(saved);
        const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        set('numeroPDC', datos.numeroPDC);
        set('distrito', datos.distrito);
        set('nivel', datos.nivel);
        set('directora', datos.directora);
        set('maestro', datos.maestro);
        set('trimestre', datos.trimestre);
        set('duracion', datos.duracion);
        set('ue', datos.ue);
        set('escolaridad', datos.escolaridad);
        set('categoriaAdaptacion', datos.categoriaAdaptacion);
        set('tipoAdaptacion', datos.tipoAdaptacion);

        toggleAdaptacionUI();

        if (datos.estudiantes && datos.estudiantes.length > 0) {
            const container = document.getElementById('lista-estudiantes-significativa');
            if (container) {
                container.innerHTML = '';
                datos.estudiantes.forEach(est => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center gap-2 mt-3';
                    div.innerHTML = `
                        <input type="text" class="input-style flex-1 estudiante-significativo" value="${est}" oninput="guardarDatos()">
                        <button type="button" onclick="eliminarEstudiante(this)" class="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    `;
                    container.appendChild(div);
                });
                if (window.lucide) window.lucide.createIcons();
            }
        }

        if (datos.grilla) {
            setTimeout(() => {
                for (let s = 1; s <= 5; s++) {
                    if (datos.grilla[s]) {
                        for (let f = 1; f <= 9; f++) {
                            const d = datos.grilla[s][f - 1];
                            if (d) {
                                const areaEl = document.getElementById(`area_s${s}_f${f}`);
                                const contEl = document.getElementById(`cont_s${s}_f${f}`);
                                if (areaEl && d.area) {
                                    areaEl.value = d.area;
                                    areaEl.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                                if (contEl && d.cont) {
                                    contEl.value = d.cont;
                                    contEl.style.height = 'auto';
                                    contEl.style.height = contEl.scrollHeight + 'px';
                                }
                            }
                        }
                    }
                }
            }, 100);
        }
    } catch (e) { localStorage.removeItem('pdcFormDataPrimaria'); }
}


// ─────────────────────────────────────────────
// RECOLECCIÓN DE DATOS DEL FORMULARIO PARA GENERAR
// ─────────────────────────────────────────────
function recolectarFormData() {
    let datosSemanales = [];
    let areasUsadasAbrev = new Set();
    let hayContenido = false;

    for (let s = 1; s <= 5; s++) {
        let contenidosSemana = [];
        for (let f = 1; f <= 9; f++) {
            let area = document.getElementById(`area_s${s}_f${f}`)?.value;
            let contenido = document.getElementById(`cont_s${s}_f${f}`)?.value.trim();
            if (area && contenido) {
                contenidosSemana.push({ area, contenido });
                areasUsadasAbrev.add(area);
                hayContenido = true;
            }
        }
        datosSemanales.push({ semana: s, filas: contenidosSemana });
    }

    const areasDelMes = Array.from(areasUsadasAbrev).map(abrev => {
        return AREAS_PRIMARIA.find(a => a.abrev === abrev)?.nombre || abrev;
    });

    const inputsEstudiantes = document.querySelectorAll('.estudiante-significativo');
    let listaEstudiantes = [];
    inputsEstudiantes.forEach(input => {
        if (input.value.trim() !== '') {
            listaEstudiantes.push(input.value.trim());
        }
    });

    return {
        numeroPDC: document.getElementById('numeroPDC')?.value || '01',
        distrito: document.getElementById('distrito')?.value || '',
        nivel: document.getElementById('nivel')?.value || 'Primaria Comunitaria Vocacional',
        directora: document.getElementById('directora')?.value || '',
        maestro: document.getElementById('maestro')?.value || '',
        trimestre: document.getElementById('trimestre')?.value || '',
        duracion: document.getElementById('duracion')?.value || '',
        ue: document.getElementById('ue')?.value || '',
        escolaridad: document.getElementById('escolaridad')?.value || '',
        categoriaAdaptacion: document.getElementById('categoriaAdaptacion')?.value || 'curricular',
        tipoAdaptacion: document.getElementById('tipoAdaptacion')?.value?.trim() || '',
        estudiantesSignificativos: listaEstudiantes,
        datosSemanales,
        areasUsadas: Array.from(areasUsadasAbrev),
        areasDelMes,
        hayContenido
    };
}

// ─────────────────────────────────────────────
// HELPER: LLAMADA A LA FUNCIÓN NETLIFY
// ─────────────────────────────────────────────
async function fetchWithRetry(url, options, retries = 3, delay = 2500) {
    for (let i = 1; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            let errText = `Error ${response.status}: ${response.statusText}`;
            try {
                const errJson = await response.json();
                if (errJson.error) {
                    errText += ` - ${errJson.error}`;
                    if (errJson.details) errText += ` (${errJson.details})`;
                }
            } catch (e) { }
            throw new Error(errText);
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// ─────────────────────────────────────────────
// LOG DE GENERACIÓN EN LA UI
// ─────────────────────────────────────────────
function log(mensaje, tipo = 'info') {
    const logEl = document.getElementById('generation-log');
    if (!logEl) return;

    const iconos = {
        info: '<i data-lucide="info" class="w-4 h-4 text-blue-400"></i>',
        ok: '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>',
        error: '<i data-lucide="alert-triangle" class="w-4 h-4 text-red-400"></i>',
        writing: '<i data-lucide="pen-tool" class="w-4 h-4 text-fuchsia-400"></i>'
    };

    const colors = {
        info: 'text-blue-200 bg-blue-500/10 border-blue-500/20',
        ok: 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20',
        error: 'text-red-200 bg-red-500/10 border-red-500/20',
        writing: 'text-fuchsia-200 bg-fuchsia-500/10 border-fuchsia-500/20'
    };

    const iconHtml = iconos[tipo] || '<i data-lucide="chevron-right" class="w-4 h-4 text-zinc-400"></i>';
    const colorClass = colors[tipo] || 'text-zinc-200 bg-white/5 border-white/10';

    logEl.innerHTML += `
        <div class="flex items-start gap-3 p-3 rounded-xl border ${colorClass} animate-fade-in">
            <div class="shrink-0 mt-0.5">${iconHtml}</div>
            <span class="leading-relaxed tracking-wide">${mensaje}</span>
        </div>`;

    if (window.lucide) window.lucide.createIcons();
    logEl.scrollTop = logEl.scrollHeight;
}

function actualizarProgreso(porcentaje, texto) {
    const container = document.getElementById('progress-container');
    const bar = document.getElementById('progress-bar');
    const textEl = document.getElementById('progress-text');
    const percentEl = document.getElementById('progress-percent');

    const porcentajeEntero = Math.round(porcentaje);

    if (container) container.style.display = 'block';
    if (bar) bar.style.width = porcentajeEntero + '%';
    if (textEl && texto) textEl.textContent = texto;
    if (percentEl) percentEl.textContent = porcentajeEntero + '%';
}

function mostrarProveedor(proveedor, silent = false) {
    const badge = document.getElementById('api-provider-badge');
    if (badge && proveedor) {
        const textSpan = badge.querySelector('.badge-text');
        if (textSpan) {
            textSpan.textContent = `Usando ${proveedor}`;
        } else {
            badge.textContent = `Usando ${proveedor}`;
        }
        badge.style.display = 'flex';
        if (!silent) log(`Motor de IA detectado: ${proveedor}`, 'info');
    }
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: GENERAR PDC
// ─────────────────────────────────────────────

// --- FUNCION DE LLAMADA DIRECTA A GEMINI DESDE EL NAVEGADOR ---
async function fetchGeminiWithRotation(prompt, keys, fallbackName) {
    let exito = false;
    let contentResponse = '';
    let finalProvider = 'Desconocido';
    let errores = [];

    // Limite global para evitar ciclos infinitos en caso de que todas las llaves esten rotas o devuelvan 400 permanentemente
    let maxTotalAttempts = 15;
    let currentAttempt = 0;

    // Repetimos un ciclo hasta tener exito o alcanzar el limite
    while (currentAttempt < maxTotalAttempts && !exito) {
        // Obtenemos la llave de manera circular: si llegamos al final de 'keys', volvemos a la 0
        let keyIndex = currentAttempt % keys.length;
        let apiKey = keys[keyIndex];

        let geminiIndex = keyIndex + 1;
        const providerName = apiKey.startsWith('sk-') ? `DK` : `GEM${geminiIndex}`;

        mostrarProveedor(providerName, true);
        if (currentAttempt > 0 && currentAttempt % keys.length === 0) {
            log(`Volviendo a intentar desde el inicio de las llaves...`, 'info');
        }

        if (currentAttempt > 0) {
            log(`Saltando y probando contenido con ${providerName} (Intento ${currentAttempt + 1})...`, 'writing');
        } else {
            log(`Generando contenido con ${providerName}`, 'writing');
        }

        try {
            if (apiKey.startsWith('sk-')) {
                const responseDS = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.2
                    })
                });

                if (!responseDS.ok) {
                    if (responseDS.status === 503 || responseDS.status === 429) {
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    throw new Error(`Error API DeepSeek: ${responseDS.status}`);
                }

                const dataDS = await responseDS.json();
                contentResponse = dataDS?.choices?.[0]?.message?.content || '';
            } else {
                const responseGemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
                    })
                });

                if (!responseGemini.ok) {
                    // Si la red esta ahogada, le damos un poquito mas de tiempo antes de saltar
                    if (responseGemini.status === 503 || responseGemini.status === 429) {
                        await new Promise(r => setTimeout(r, 1500));
                    }
                    throw new Error(`Error API Gemini: ${responseGemini.status}`);
                }

                const dataGemini = await responseGemini.json();
                contentResponse = dataGemini?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

            if (contentResponse) {
                finalProvider = providerName;
                exito = true;
            }
        } catch (error) {
            errores.push(`${providerName}:${error.message}`);
            console.warn(`[${fallbackName}] Falló ${providerName}: ${error.message}`);

            // Pausa base para no spamear Google si todas fallan por quota o error no manejado
            await new Promise(r => setTimeout(r, 800));
        }

        currentAttempt++;
    }

    if (!exito) {
        throw new Error(`Se agotaron los ${maxTotalAttempts} intentos cíclicos. Revisa tus llaves o la disponibilidad del servicio.`);
    }

    return {
        content: contentResponse.replace(/```markdown/gi, '').replace(/```/g, '').trim(),
        provider: finalProvider
    };
}

async function generarPDC() {
    const formData = recolectarFormData();

    if (!formData.hayContenido) {
        alert("¡Aviso! Debes agregar al menos un área y contenido en alguna semana para generar el PDC.");
        return;
    }

    pdcData.formData = formData;
    pdcData.generatedContent = {};

    const resultsPanel = document.getElementById('results-panel');
    resultsPanel.style.display = 'block';
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    document.getElementById('generation-log').innerHTML = '';
    document.getElementById('action-buttons').style.display = 'none';
    const badge = document.getElementById('api-provider-badge');
    if (badge) badge.style.display = 'none';
    actualizarProgreso(5, 'Iniciando proceso...');

    const btnGenerar = document.getElementById('btn-generar');
    btnGenerar.disabled = true;
    btnGenerar.querySelector('span').textContent = 'GENERANDO...';

    try {
        actualizarProgreso(15, 'Procesando datos del PDC Primaria...');
        log('Procesando datos y estructurando tablas...');

        // El Word generator armará los Datos Referenciales con los campos de primaria
        // Y el Objetivo de Nivel también lo incrustará.

        actualizarProgreso(40, 'Generando desarrollo del PDC con IA (puede tomar unos segundos)...');
        log('Procesando tabla principal del PDC con IA...', 'writing');

        const tablaPDCResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-tabla', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formData })
        });
        const tablaDataServer = await tablaPDCResponse.json();

        let contenidoPDCFinal = '';
        const promptsTabla = tablaDataServer.prompts || (tablaDataServer.prompt ? [tablaDataServer.prompt] : []);

        let indexArea = 1;
        const totalAreas = promptsTabla.length;

        for (const promptArea of promptsTabla) {
            actualizarProgreso(40 + (indexArea / totalAreas) * 40, `Generando área ${indexArea} de ${totalAreas}...`);
            log(`Procesando área ${indexArea} de ${totalAreas}...`, 'writing');
            const geminiResult = await fetchGeminiWithRotation(promptArea, tablaDataServer.geminiKeys, 'generate-pdc-tabla');
            contenidoPDCFinal += (contenidoPDCFinal ? '\n\n' : '') + geminiResult.content;
            if (geminiResult.provider && indexArea === 1) mostrarProveedor(geminiResult.provider, true);
            indexArea++;
        }

        pdcData.generatedContent.tablasPorArea = contenidoPDCFinal;
        log('Desarrollo del PDC procesado internamente por bloques', 'ok');
        actualizarProgreso(80, 'Desarrollo del PDC completado.');

        if (formData.tipoAdaptacion || formData.estudiantesSignificativos.length > 0) {
            actualizarProgreso(85, 'Generando Adaptaciones Curriculares con IA...');
            log('Procesando Adaptaciones Curriculares con IA...', 'writing');

            const adaptResponse = await fetchWithRetry('/.netlify/functions/generate-pdc-adaptaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData })
            });
            const adaptData = await adaptResponse.json();

            if (adaptData.content) {
                pdcData.generatedContent.adaptaciones = adaptData.content;
            } else {
                let contenidoAdaptFinal = '';
                const promptsAdapt = adaptData.prompts || (adaptData.prompt ? [adaptData.prompt] : []);

                let idxAdapt = 1;
                const totAdapt = promptsAdapt.length;
                for (const p of promptsAdapt) {
                    actualizarProgreso(85 + (idxAdapt / totAdapt) * 10, `Generando adaptación ${idxAdapt} de ${totAdapt}...`);
                    const geminiAdaptResult = await fetchGeminiWithRotation(p, adaptData.geminiKeys, 'generate-pdc-adaptaciones');
                    contenidoAdaptFinal += (contenidoAdaptFinal ? '\n\n' : '') + geminiAdaptResult.content;
                    idxAdapt++;
                }
                pdcData.generatedContent.adaptaciones = contenidoAdaptFinal.trim();
            }
            log('Adaptaciones Curriculares procesadas internamente', 'ok');
        }

        log('¡PDC completo generado con éxito!', 'ok');
        actualizarProgreso(100, '¡Documento listo para descargar!');
        document.getElementById('action-buttons').style.display = 'flex';
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);

    } catch (error) {
        console.error('Error en generación:', error);
        log(`Error: ${error.message}. Por favor intenta de nuevo.`, 'error');
        actualizarProgreso(0, 'Error en la generación.');
    } finally {
        btnGenerar.disabled = false;
        btnGenerar.querySelector('span').textContent = 'GENERAR PDC CON IA';
    }
}

// ─────────────────────────────────────────────
// DESCARGAR WORD
// ─────────────────────────────────────────────
async function descargarWord() {
    const btnWord = document.getElementById('btn-word');
    const textoOriginal = btnWord.innerHTML;
    btnWord.disabled = true;
    // Omitir texto para no perder SVG
    // btnWord.textContent = 'Generando documento...';

    try {
        const response = await fetchWithRetry('/.netlify/functions/generate-pdc-word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pdcData)
        });

        if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `PDC-Primaria-${(pdcData.formData.trimestre || 'Trimestre').replace(/\s+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

    } catch (error) {
        console.error('Error al generar Word:', error);
        alert('Hubo un error al crear el documento Word. Inténtalo de nuevo.');
    } finally {
        btnWord.disabled = false;
        btnWord.innerHTML = textoOriginal;
    }
}

function nuevoPDC() {
    if (!confirm('¿Seguro que deseas iniciar un nuevo PDC? Se perderá el PDC actual si no lo descargaste.')) return;
    pdcData = { formData: {}, generatedContent: {} };
    document.getElementById('results-panel').style.display = 'none';
    document.getElementById('generation-log').innerHTML = '';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('action-buttons').style.display = 'none';
    const badge = document.getElementById('api-provider-badge');
    if (badge) badge.style.display = 'none';

    document.getElementById('pdcForm').reset();
    localStorage.removeItem('pdcFormDataPrimaria');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// PROTECCIONES
document.addEventListener('contextmenu', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
});
document.addEventListener('keydown', e => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S', 'P'].includes(e.key.toUpperCase()))) {
        e.preventDefault();
    }
});
document.addEventListener('selectstart', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
});
document.addEventListener('dragstart', e => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
});

function aplicarColoresDefault() {
    for (let s = 1; s <= 5; s++) {
        for (let f = 1; f <= 9; f++) {
            const el = document.getElementById(`area_s${s}_f${f}`);
            if (el && el.value) {
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
}

function limpiarAreas() {
    if (!confirm('¿Seguro que deseas limpiar todas las áreas seleccionadas?')) return;
    for (let s = 1; s <= 5; s++) {
        for (let f = 1; f <= 9; f++) {
            const areaEl = document.getElementById(`area_s${s}_f${f}`);
            if (areaEl) {
                areaEl.value = "";
                areaEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
    guardarDatos();
}
