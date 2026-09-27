const fs = require('fs');
const content = fs.readFileSync('frontend/src/context/LanguageContext.js', 'utf8');

const start = content.indexOf('export const translations = {') + 'export const translations = '.length;
const chunk = content.slice(start);

let openBraces = 0;
let endIdx = -1;
for (let index = 0; index < chunk.length; index++) {
  if (chunk[index] === '{') {
    openBraces++;
  } else if (chunk[index] === '}') {
    openBraces--;
    if (openBraces === 0) {
      endIdx = index + 1;
      break;
    }
  }
}

const objStr = chunk.slice(0, endIdx);
const translationsObj = eval('(' + objStr + ')');

const fr = {
    taquinBtn: "🎛️ Taquin",
    taquinGridLabel: "Taille de la Grille Taquin (ex: 4 pour 4x4 pierres)",
    solvedTaquinText: "Mécanisme déverrouillé ! Voici l'indice caché :"
};

const ar = {
    taquinBtn: "🎛️ أحجية ميكانيكية",
    taquinGridLabel: "حجم الشبكة (مثال: 4 لـ 4x4 أحجار)",
    solvedTaquinText: "تم الفتح الميكانيكي! إليك الدليل:"
};

const en = {
    taquinBtn: "🎛️ Sliding Puzzle",
    taquinGridLabel: "Grid Size (e.g. 4 for 4x4 stones)",
    solvedTaquinText: "Mechanism unlocked! Here is the hidden clue:"
};

let changed = false;
Object.entries(fr).forEach(([k, v]) => { if(translationsObj.fr[k] !== v) { translationsObj.fr[k] = v; changed = true;} });
Object.entries(ar).forEach(([k, v]) => { if(translationsObj.ar[k] !== v) { translationsObj.ar[k] = v; changed = true;} });
Object.entries(en).forEach(([k, v]) => { if(translationsObj.en[k] !== v) { translationsObj.en[k] = v; changed = true;} });

if (changed) {
    fs.writeFileSync('frontend/src/context/LanguageContext.js', content.slice(0, start) + JSON.stringify(translationsObj, null, 4) + content.slice(start + endIdx));
    console.log('Done!');
}
