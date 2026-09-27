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

const puzzleTranslationsFr = {
    puzzleBtn: "🧩 Puzzle",
    puzzleImageLabel: "Image du Puzzle",
    puzzleGridLabel: "Taille de la Grille (ex: 3 pour 3x3)",
    uploadPhotoBtn: "Uploader une Photo",
    solvedPuzzleText: "Bien joué ! Voici l'indice caché :",
    continueBtn: "Passer à l'étape suivante"
};

const puzzleTranslationsAr = {
    puzzleBtn: "🧩 أحجية",
    puzzleImageLabel: "صورة الأحجية",
    puzzleGridLabel: "حجم الشبكة (مثال: 3 لـ 3x3)",
    uploadPhotoBtn: "رفع صورة",
    solvedPuzzleText: "عمل رائع! إليك الدليل المخفي:",
    continueBtn: "الانتقال إلى المرحلة التالية"
};

const puzzleTranslationsEn = {
    puzzleBtn: "🧩 Puzzle",
    puzzleImageLabel: "Puzzle Image",
    puzzleGridLabel: "Grid Size (e.g. 3 for 3x3)",
    uploadPhotoBtn: "Upload Photo",
    solvedPuzzleText: "Well done! Here is the hidden clue:",
    continueBtn: "Proceed to next stage"
};

let changed = false;
for (const [key, val] of Object.entries(puzzleTranslationsFr)) {
    if (translationsObj.fr[key] !== val) { translationsObj.fr[key] = val; changed = true; }
}
for (const [key, val] of Object.entries(puzzleTranslationsAr)) {
    if (translationsObj.ar[key] !== val) { translationsObj.ar[key] = val; changed = true; }
}
for (const [key, val] of Object.entries(puzzleTranslationsEn)) {
    if (translationsObj.en[key] !== val) { translationsObj.en[key] = val; changed = true; }
}

if (changed) {
    const prettyTranslations = JSON.stringify(translationsObj, null, 4);
    const bottomPart = content.slice(start + endIdx);
    const finalFileContent = content.slice(0, start) + prettyTranslations + bottomPart;
    fs.writeFileSync('frontend/src/context/LanguageContext.js', finalFileContent);
    console.log('Puzzle translations added correctly!');
} else {
    console.log('No updates needed.');
}
