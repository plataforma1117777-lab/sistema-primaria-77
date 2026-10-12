const fs = require('fs');
let c = fs.readFileSync('netlify/functions/generate-pdc-word.js', 'utf8');

c = c.replace(
    'filename="PDC-${(f.area || \\\'Plan\\\').replace(/\\\\s+/g, \\\'_\\\')}-${(f.trimestre || \\\'T1\\\').replace(/\\\\s+/g, \\\'_\\\')}.docx"',
    'filename="PDC-Primaria-${(f.trimestre || \\\'T1\\\').replace(/\\\\s+/g, \\\'_\\\')}.docx"'
);

fs.writeFileSync('netlify/functions/generate-pdc-word.js', c);
console.log('done');
