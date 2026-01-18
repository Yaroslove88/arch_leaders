const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '..', 'data', 'interactive-cases.json');

const data = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

let fixed = 0;

data.interactive_cases.forEach(c => {
  c.options.forEach(o => {
    const originalText = o.text;
    
    // Удаляем английские названия навыков из начала текста
    o.text = o.text
      .replace(/^Direct Order:\s*/i, '')
      .replace(/^Context Share:\s*/i, '')
      .replace(/^Let It Break:\s*/i, '')
      .replace(/^Containment:\s*/i, '')
      .replace(/^Rule Creation:\s*/i, '')
      .replace(/^Сценарное мышление:\s*/, '');
    
    if (originalText !== o.text) {
      fixed++;
      console.log(`Fixed: "${originalText}" -> "${o.text}"`);
    }
  });
});

fs.writeFileSync(casesPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\nFixed ${fixed} option texts`);




