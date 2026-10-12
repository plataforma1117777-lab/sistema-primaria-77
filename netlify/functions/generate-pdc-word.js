require('dotenv').config();
/* =================================================================
   FUNCIÓN NETLIFY: generate-pdc-word.js
   Genera el documento Word (.docx) del PDC completo
   Orientación HORIZONTAL, tamaño CARTA
   ================================================================= */

const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType,
    VerticalAlign, PageOrientation, TableBorders, TableLayoutType
} = require('docx');

// ── COLORES ──
const C = {
    azul: '0C2945', // Azul puro para encaberzados en la tabla
    azulOscuro: '10455E', // Azul oscuro sin fondo para títulos
    celesteClaro: 'E3F7FF', // Color de fondo celeste muy claro para celdas
    verde: '10B981',
    verdeClaro: 'ECFDF5',
    gris: 'F8FAFC',
    grisMedio: 'E2E8F0',
    blanco: 'FFFFFF',
    negro: '000000', // Negro puro para el texto y bordes
    grisTexto: '475569',
};

const FONT = 'Arial';
const FS = { titulo: 24, h1: 22, h2: 20, normal: 18, small: 18 }; // half-points

// ── HELPERS ──
function borderNone() { return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }; }
function borderSolid(color = C.negro, size = 4) { return { style: BorderStyle.SINGLE, size, color }; } // Bordes en negro, tamaño delgado

function getBorders() {
    return {
        top: borderSolid(C.negro, 4),
        bottom: borderSolid(C.negro, 4),
        left: borderSolid(C.negro, 4),
        right: borderSolid(C.negro, 4),
        insideHorizontal: borderSolid(C.negro, 4),
        insideVertical: borderSolid(C.negro, 4),
    };
}

function parrafoTitulo(texto, customSpacing) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: customSpacing || { after: 160, line: 276 },
        children: [new TextRun({ text: texto, bold: true, size: FS.titulo, font: FONT, color: C.azul })]
    });
}

function parrafoH1(texto) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 200, after: 100, line: 276 },
        // quitado el shading para dejar el fondo transparente
        children: [new TextRun({ text: texto.toUpperCase(), bold: true, size: FS.h1, font: FONT, color: C.azul })]
    });
}

function parrafoH2(texto) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 140, after: 60, line: 276 },
        children: [new TextRun({ text: texto, bold: true, size: FS.h2, font: FONT, color: C.azul })]
    });
}

function parrafoTexto(texto, bold = false) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80, line: 276 },
        children: [new TextRun({ text: texto || '', size: FS.normal, font: FONT, color: C.negro, bold })]
    });
}

function parrafoBullet(texto) {
    let t = texto;
    const matchAf = t.match(/^(Lectura|Escritura|Pensamiento l[oó]gico-matem[aá]tico|Indagaci[oó]n cient[ií]fica|Comunicaci[oó]n oral|Plan de lectura(\s*\(15\s*min\))?|SER|SABER|HACER):(\s*)(.*)$/i);
    if (matchAf && !t.startsWith('**')) {
        t = `**${matchAf[1]}:** ${matchAf[4]}`;
    }
    const runs = parseInline(t);
    runs.unshift(new TextRun({ text: "- ", size: FS.normal, font: FONT, color: C.negro }));
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 60, line: 276 },
        children: runs
    });
}

function lineaBlanco() { return new Paragraph({ children: [new TextRun({ text: '' })] }); }

// ── PARSEAR INLINE MARKDOWN ──
function parseInline(texto) {
    const runs = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
    let m;
    while ((m = regex.exec(texto)) !== null) {
        if (m[2]) runs.push(new TextRun({ text: m[2], bold: true, size: FS.normal, font: FONT, color: C.negro }));
        else if (m[3]) runs.push(new TextRun({ text: m[3], italics: true, size: FS.normal, font: FONT, color: C.negro }));
        else if (m[4]) runs.push(new TextRun({ text: m[4], size: FS.normal, font: FONT, color: C.negro }));
    }
    return runs.length ? runs : [new TextRun({ text: texto, size: FS.normal, font: FONT, color: C.negro })];
}

// ── CONVERTIR MARKDOWN A PÁRRAFOS Y TABLAS ──
function mdAParagraphs(markdown, tableTopRowText) {
    if (!markdown) return [parrafoTexto('')];
    const lineas = markdown.split('\n');
    const result = [];

    let inTable = false;
    let tableRows = [];

    function flushTable() {
        if (tableRows.length > 0) {
            const rowsWithoutSeparator = tableRows.filter(row => !row.every(cell => cell && /^[-: ]+$/.test(cell.trim())));

            let normalRowsCount = 0;
            if (rowsWithoutSeparator.length > 0 && rowsWithoutSeparator[0].length === 6) {
                normalRowsCount = rowsWithoutSeparator.filter((r, idx) => {
                    if (idx === 0) return false;
                    return !r.some(c => /ADAPTACI[OÓ]N/i.test(c));
                }).length;
            } else if (rowsWithoutSeparator.length > 0 && rowsWithoutSeparator[0].length === 4) {
                normalRowsCount = rowsWithoutSeparator.length - 1;
            }

            let firstNormalRowIndex = -1;
            for (let i = 1; i < rowsWithoutSeparator.length; i++) {
                if (rowsWithoutSeparator[i].some(c => /ADAPTACI[OÓ]N/i.test(c))) continue;
                firstNormalRowIndex = i;
                break;
            }
            if (firstNormalRowIndex === -1 && rowsWithoutSeparator.length > 1) {
                firstNormalRowIndex = 1;
            }

            const docxRows = rowsWithoutSeparator.map((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                let rowCells = [];

                const isAdaptacionRow = !isHeader && row.some(cell => cell && /ADAPTACI[OÓ]N/i.test(cell));

                if (isAdaptacionRow) {
                    const combinedText = row.filter(c => c && c.trim() && c.trim() !== '-' && c.trim() !== '—' && c.trim() !== '–').join('<br><br>');
                    let options = {
                        columnSpan: rowsWithoutSeparator[0].length,
                        width: 100,
                        widthType: WidthType.PERCENTAGE,
                        shading: { type: ShadingType.CLEAR, fill: C.blanco }
                    };
                    rowCells.push(celdaD(combinedText, options));
                    return new TableRow({ tableHeader: false, children: rowCells });
                }

                for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
                    const cellText = (row[cellIndex] || '').trim();
                    let options = {};

                    if (row.length === 6) {
                        const widths = [1080, 1260, 3660, 1080, 480, 1440];
                        options.width = widths[cellIndex];
                        options.widthType = WidthType.DXA;

                        if ((cellIndex === 0 || cellIndex === 5) && !isHeader) {
                            if (rowIndex === firstNormalRowIndex) {
                                options.rowSpan = normalRowsCount > 0 ? normalRowsCount : 1;

                                let combinedText = "";
                                for (let r = 1; r < rowsWithoutSeparator.length; r++) {
                                    if (!rowsWithoutSeparator[r]) continue;
                                    if (rowsWithoutSeparator[r].some(c => c && /ADAPTACI[OÓ]N/i.test(c))) continue;
                                    const textInRow = rowsWithoutSeparator[r][cellIndex] ? String(rowsWithoutSeparator[r][cellIndex]).trim() : "";
                                    if (textInRow && textInRow !== '-' && textInRow !== '—' && textInRow !== '–') {
                                        combinedText += (combinedText ? "<br><br>" : "") + textInRow;
                                    }
                                }
                                rowCells.push(celdaD(combinedText, options));
                            }
                            continue;
                        }
                    } else if (row.length === 4) {
                        const widths = [1800, 1800, 3600, 1800];
                        options.width = widths[cellIndex];
                        options.widthType = WidthType.DXA;

                        if (cellIndex === 3 && !isHeader) {
                            if (rowIndex === firstNormalRowIndex) {
                                options.rowSpan = normalRowsCount > 0 ? normalRowsCount : 1;

                                let combinedText = "";
                                for (let r = 1; r < rowsWithoutSeparator.length; r++) {
                                    if (!rowsWithoutSeparator[r]) continue;
                                    const textInRow = rowsWithoutSeparator[r][cellIndex] ? String(rowsWithoutSeparator[r][cellIndex]).trim() : "";
                                    if (textInRow && textInRow !== '-' && textInRow !== '—' && textInRow !== '–') {
                                        combinedText += (combinedText ? "<br><br>" : "") + textInRow;
                                    }
                                }
                                rowCells.push(celdaD(combinedText, options));
                            }
                            continue;
                        }
                    } else if (row.length === 1) {
                        options.width = 9000;
                        options.widthType = WidthType.DXA;
                    }

                    rowCells.push(isHeader ? celdaH(cellText, options) : celdaD(cellText, options));
                }

                return new TableRow({
                    tableHeader: false,
                    children: rowCells
                });
            });

            if (tableTopRowText && docxRows.length > 0) {
                const numCols = rowsWithoutSeparator[0].length;
                docxRows.unshift(new TableRow({
                    children: [
                        new TableCell({
                            columnSpan: numCols,
                            shading: { type: ShadingType.CLEAR, fill: C.azulOscuro },
                            verticalAlign: VerticalAlign.CENTER,
                            margins: { top: 120, bottom: 120, left: 100, right: 100 },
                            children: [new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { line: 276 },
                                children: [new TextRun({ text: tableTopRowText.toUpperCase(), bold: true, color: C.blanco, size: FS.normal, font: FONT })]
                            })]
                        })
                    ]
                }));
                // Solo añadirlo a la primera tabla
                tableTopRowText = null;
            }

            if (docxRows.length > 0) {
                const numCols = rowsWithoutSeparator[0].length;
                let tableOpts = {
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    layout: TableLayoutType.FIXED,
                    borders: getBorders(),
                    rows: docxRows
                };
                if (numCols === 6) {
                    tableOpts.columnWidths = [1080, 1260, 3660, 1080, 480, 1440];
                } else if (numCols === 4) {
                    tableOpts.columnWidths = [1800, 1800, 3600, 1800];
                } else if (numCols === 1) {
                    tableOpts.columnWidths = [9000];
                }
                result.push(new Table(tableOpts));
            }
            tableRows = [];
        }
        inTable = false;
    }

    for (const linea of lineas) {
        const l = linea.trim();
        if (!l) {
            if (inTable) flushTable();
            continue;
        }

        if (l.startsWith('|')) {
            inTable = true;
            let cleanL = l;
            if (cleanL.endsWith('|')) cleanL = cleanL.slice(0, -1);
            const cells = cleanL.split('|').slice(1);
            tableRows.push(cells);
        } else if (inTable && !l.startsWith('#') && !/^---+$/.test(l)) {
            // Auto-heal: continuation of the previous row if the AI broke the line
            if (tableRows.length > 0) {
                const lastRow = tableRows[tableRows.length - 1];
                let cleanL = l;
                if (cleanL.endsWith('|')) cleanL = cleanL.slice(0, -1);

                if (cleanL.includes('|')) {
                    const extraCells = cleanL.split('|');
                    lastRow[lastRow.length - 1] += " <br> " + extraCells[0];
                    for (let i = 1; i < extraCells.length; i++) lastRow.push(extraCells[i]);
                } else {
                    lastRow[lastRow.length - 1] += " <br> " + cleanL;
                }
                continue;
            }
        } else {
            if (inTable) flushTable();
            if (l.startsWith('### ')) { result.push(parrafoH2(l.slice(4).replace(/\*\*/g, ''))); continue; }
            if (l.startsWith('## ')) {
                const text = l.slice(3).replace(/\*\*/g, '');
                if (text.toUpperCase().includes('ÁREA')) {
                    tableTopRowText = text;
                } else {
                    result.push(parrafoH2(text));
                }
                continue;
            }
            if (l.startsWith('# ')) { result.push(parrafoH1(l.slice(2).replace(/\*\*/g, ''))); continue; }
            if (/^[-*]\s+/.test(l)) { result.push(parrafoBullet(l.replace(/^[-*]\s+/, '').replace(/\*\*/g, ''))); continue; }
            if (/^---+$/.test(l)) continue;
            if (l.replace(/<br\s*\/?>/gi, '').trim() === '') continue;
            result.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 80, line: 276 }, children: parseInline(l) }));
        }
    }
    if (inTable) flushTable();

    return result.length ? result : [parrafoTexto('')];
}

// ── CELDAS DE TABLA ──
function celdaH(texto, opciones = {}) {
    let t = texto.replace(/<br\s*\/?>/gi, ' ').trim();
    if (t === '-' || t === '—' || t === '–') t = '';
    return new TableCell({
        shading: { type: ShadingType.CLEAR, fill: opciones.fill || C.celesteClaro }, // Cabeceras en color celeste claro
        verticalAlign: opciones.verticalAlign || VerticalAlign.CENTER,
        margins: opciones.margins || { top: 80, bottom: 80, left: 100, right: 100 },
        width: opciones.width ? { size: opciones.width, type: opciones.widthType || WidthType.DXA } : undefined,
        columnSpan: opciones.columnSpan,
        children: [new Paragraph({
            alignment: opciones.align || AlignmentType.CENTER,
            spacing: opciones.spacing || { line: 276 },
            children: [new TextRun({ text: t, bold: true, color: opciones.color || C.negro, size: FS.small, font: FONT })]
        })]
    });
}

function celdaD(texto, opciones = {}) {
    const chunks = (texto || '').split(/<br\s*\/?>/i);
    const cellChildren = [];
    for (const chunk of chunks) {
        const c = chunk.trim();
        if (!c || c === '-' || c === '—' || c === '–') continue;
        if (/^[-*]\s+/.test(c)) {
            cellChildren.push(parrafoBullet(c.replace(/^[-*]\s+/, '')));
        } else {
            cellChildren.push(new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: opciones.spacing || { after: 40, line: 276 },
                children: parseInline(c)
            }));
        }
    }
    if (cellChildren.length === 0) {
        cellChildren.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: opciones.spacing || { after: 40, line: 276 },
            children: [new TextRun({ text: '' })]
        }));
    }

    return new TableCell({
        shading: opciones.shading || { type: ShadingType.CLEAR, fill: C.blanco }, // Por defecto color de fondo blanco
        verticalAlign: opciones.verticalAlign || VerticalAlign.TOP,
        margins: opciones.margins || { top: 60, bottom: 60, left: 80, right: 80 },
        width: opciones.width ? { size: opciones.width, type: opciones.widthType || WidthType.DXA } : undefined,
        rowSpan: opciones.rowSpan,
        columnSpan: opciones.columnSpan,
        children: cellChildren
    });
}

// ── TABLA DE DATOS REFERENCIALES ──
function construirTablaReferencial(f) {
    const optsH = {
        fill: C.celesteClaro,
        color: C.negro,
        align: AlignmentType.LEFT,
        margins: { top: 30, bottom: 30, left: 60, right: 60 },
        spacing: { before: 0, after: 0 }
    };
    const optsD = {
        margins: { top: 30, bottom: 30, left: 60, right: 60 },
        spacing: { before: 0, after: 0 },
        verticalAlign: VerticalAlign.CENTER
    };

    const fila = (e1, v1, e2, v2) => {
        if (!e2 && !v2) {
            return new TableRow({
                children: [
                    celdaH(e1.toUpperCase(), optsH),
                    celdaD(v1 ? v1.toUpperCase() : '', { ...optsD, columnSpan: 3 })
                ]
            });
        }
        return new TableRow({
            children: [
                celdaH(e1.toUpperCase(), optsH),
                celdaD(v1 ? v1.toUpperCase() : '', optsD),
                celdaH(e2 ? e2.toUpperCase() : '', optsH),
                celdaD(v2 ? v2.toUpperCase() : '', optsD),
            ]
        });
    };

    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.AUTOFIT,
        borders: getBorders(),
        rows: [
            fila('Distrito Educativo', f.distrito, 'Unidad Educativa', f.ue),
            fila('Nivel', f.nivel, 'Año/Paralelo', f.escolaridad),
            fila('Directora/or', f.directora, '', ''),
            fila('Maestra/o', f.maestro, '', ''),
            fila('Área', f.areasDelMes ? f.areasDelMes.join(', ') : '', '', ''),
            fila('Trimestre', f.trimestre, '', ''),
            fila('Tiempo', f.duracion, '', ''),
        ]
    });
}

// ── TABLA PDC PRINCIPAL (desde Markdown generado) ──
// Como el contenido es Markdown con tabla, lo convertimos a texto estructurado
function construirContenidoPDC(tablaMarkdown) {
    // Devolvemos directamente los párrafos del Markdown
    return mdAParagraphs(tablaMarkdown);
}

// ── HANDLER PRINCIPAL ──
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    let pdcData;
    try {
        pdcData = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
    }

    const f = pdcData.formData || {};
    const gc = pdcData.generatedContent || {};

    try {
        const children = [];

        // ── PORTADA ──

        children.push(parrafoTitulo('EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL', { after: 20 }));
        children.push(parrafoTitulo(`PLAN DE DESARROLLO CURRICULAR Nº ${f.numeroPDC || '01'}`, { after: 160 }));


        // ── DATOS REFERENCIALES ──
        children.push(parrafoH1('I. Datos Referenciales'));

        children.push(construirTablaReferencial(f));


        // ── OBJETIVO HOLÍSTICO ──
        children.push(parrafoH1('II. Desarrollo — Objetivo Holístico de Nivel'));

        const objFijo = 'Fortalecemos la práctica de valores sociocomunitarios y principios ético-morales, en el desarrollo del pensamiento crítico; lectura comprensiva, escritura creativa; el pensamiento lógico matemático, resolución de problemas; a través de la convivencia comunitaria biocéntrica; la sensibilidad en las manifestaciones culturales de arte, música, danza, deporte; el uso adecuado de las Tecnologías de Información y Comunicación, la exploración, experimentación e investigación para contribuir a la educación intracultural, intercultural y plurilingüe del Estado Plurinacional, en complementariedad, diálogo de saberes, conocimientos propios y universales.';
        children.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 276 },
            children: [new TextRun({ text: objFijo, size: FS.normal, font: FONT, color: C.grisTexto, italics: true })]
        }));


        // ── TABLA PRINCIPAL PDC ──

        if (gc.tablasPorArea) {
            children.push(...construirContenidoPDC(gc.tablasPorArea));
        }

        // ── ADAPTACIONES ──
        children.push(lineaBlanco());
        if (gc.adaptaciones && gc.adaptaciones !== 'OMITIR_ADAPTACIONES' && (f.tipoAdaptacion || (f.estudiantesSignificativos && f.estudiantesSignificativos.length > 0))) {

            if (f.categoriaAdaptacion === 'significativa') {
                const tituloAdaptacion = `ADAPTACIONES CURRICULARES SIGNIFICATIVAS: ${f.tipoAdaptacion}`;
                children.push(...mdAParagraphs(gc.adaptaciones, tituloAdaptacion));
            } else {
                children.push(...mdAParagraphs(gc.adaptaciones));
            }

            children.push(lineaBlanco());
            children.push(lineaBlanco());
        }

        // ── CIERRE ──

        // ── FIRMA ──
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, line: 276 },
            children: [new TextRun({ text: '_______________________________', size: FS.normal, font: FONT, color: C.negro })]
        }));
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 276 },
            children: [new TextRun({ text: f.maestro || 'Firma del Docente', bold: true, size: FS.normal, font: FONT, color: C.negro })]
        }));
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 276 },
            children: [new TextRun({ text: 'Maestra/o Responsable', size: FS.small, font: FONT, color: C.grisTexto })]
        }));

        // ── CONSTRUIR DOCUMENTO (orientación HORIZONTAL, tamaño CARTA) ──
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: { font: FONT, size: FS.normal, color: C.negro },
                        paragraph: {
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { line: 276 }
                        }
                    }
                }
            },
            sections: [{
                properties: {
                    page: {
                        // Carta horizontal: se pasan medidas portrait (8.5x11) y 'docx' las invierte automáticamente
                        size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
                        margin: { top: 720, bottom: 720, left: 900, right: 900 }
                    }
                },
                children
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="PDC-Primaria-${(f.trimestre || 'T1').replace(/\s+/g, '_')}.docx"`,
                'Access-Control-Allow-Origin': '*',
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };

    } catch (error) {
        console.error('[generate-pdc-word] Error:', error);
        try {
            require('fs').writeFileSync('error_log.txt', error.stack || error.toString());
        } catch (e) { }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'No se pudo generar el documento Word.', details: error.message })
        };
    }
};
