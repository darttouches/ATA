const fs = require('fs');
let text = fs.readFileSync('frontend/src/context/LanguageContext.js', 'utf8');

// Fix the rogue comma
text = text.replace(/waiting: "قيد الانتظار",\s*,\s*\/\/\s*Games Hub \& Player/, 'waiting: "قيد الانتظار",\n\n        // Games Hub & Player');

// Fix the extra double quotes
text = text.replace(/"",/g, '",');
text = text.replace(/""$/gm, '"'); // Just in case

fs.writeFileSync('frontend/src/context/LanguageContext.js', text);
console.log('Fixed syntax errors.');
