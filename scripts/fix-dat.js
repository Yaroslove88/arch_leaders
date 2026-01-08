const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '..', 'data', 'interactive-cases.json');

let content = fs.readFileSync(casesPath, 'utf8');

// Исправляем опечатку "ДатЬ" на "ДатЬ"
content = content.replace(/ДатЬ/g, 'ДатЬ');

fs.writeFileSync(casesPath, content, 'utf8');
console.log('Fixed typo: ДатЬ -> ДатЬ');




