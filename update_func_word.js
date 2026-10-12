const fs = require('fs');
const path = require('path');

const funcPath = path.join(process.cwd(), 'netlify', 'functions', 'generate-pdc-word.js');

let wordContent = fs.readFileSync(funcPath, 'utf8');

// Update Title
wordContent = wordContent.replace(
    /parrafoTitulo\('PLAN DE DESARROLLO CURICULAR PARA EDUCACIÓN SECUNDARIA COMUNITARIA PRODUCTIVA', \{ after: 20 \}\)/,
    "parrafoTitulo('EDUCACIÓN PRIMARIA COMUNITARIA VOCACIONAL', { after: 20 })"
);

// Update Objective text
wordContent = wordContent.replace(
    /const objFijo = 'Formamos integralmente a las y los estudiantes.*?';/,
    "const objFijo = 'Fortalecemos la práctica de valores sociocomunitarios y principios ético-morales, en el desarrollo del pensamiento crítico; lectura comprensiva, escritura creativa; el pensamiento lógico matemático, resolución de problemas; a través de la convivencia comunitaria biocéntrica; la sensibilidad en las manifestaciones culturales de arte, música, danza, deporte; el uso adecuado de las Tecnologías de Información y Comunicación, la exploración, experimentación e investigación para contribuir a la educación intracultural, intercultural y plurilingüe del Estado Plurinacional, en complementariedad, diálogo de saberes, conocimientos propios y universales.';"
);

// Update Data referencial fields
wordContent = wordContent.replace(
    /fila\('Maestra\\/o', f.maestro, '', ''\),\\s*fila\('Área de Saberes', f.area, '', ''\),/g,
    "fila('Directora/or', f.directora || '', '', ''),\\n            fila('Maestra/o', f.maestro, '', ''),\\n            fila('Área', f.areasDelMes ? f.areasDelMes.join(', ') : '', '', ''),"
);

// Remove the default generated Content logic and use tablasPorArea
wordContent = wordContent.replace(
    /if \(gc\.tabla\) \{\s*children\.push\(\.\.\.construirContenidoPDC\(gc\.tabla\)\);\s*\}/g,
    "if (gc.tablasPorArea) { children.push(...construirContenidoPDC(gc.tablasPorArea)); }"
);

// Update File download name
wordContent = wordContent.replace(
    /filename="PDC-\\$\\{\(f\\.area \\|\\| 'Plan'\\)\\.replace\\(\/\\\\s\\+\/g, '_'\)\\}-\\$\\{\(f\\.trimestre \\|\\| 'T1'\\)\\.replace\\(\/\\\\s\\+\/g, '_'\)\\}\\.docx"/g,
    'filename=\\"PDC-Primaria-N${f.numeroPDC || \'01\'}-${(f.trimestre || \'T1\').replace(/\\\\s+/g, \'_\')}.docx\\"'
);

fs.writeFileSync(funcPath, wordContent);
console.log('generate-pdc-word.js updated.');
