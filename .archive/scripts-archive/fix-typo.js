const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, '..', 'data', 'interactive-cases.json');

const data = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

let fixed = 0;

data.interactive_cases.forEach(c => {
  c.options.forEach(o => {
    if (o.text && o.text.includes('ДатЬ')) {
      const original = o.text;
      o.text = o.text.replace(/ДатЬ/g, 'ДатЬ');
      if (original !== o.text) {
        fixed++;
        console.log(`Fixed typo: "${original}" -> "${o.text}"`);
      }
    }
  });
});

fs.writeFileSync(casesPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`\nFixed ${fixed} typos`);




