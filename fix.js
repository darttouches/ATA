const fs = require('fs');
const lines = fs.readFileSync('src/context/LanguageContext.js', 'utf8').split('\n');
const backtickIdx = lines.findIndex(l => l.includes('```'));

if (backtickIdx !== -1) {
    const enBlockIdx = lines.findIndex((l, idx) => idx > backtickIdx && l.includes('en: {'));
    
    if (enBlockIdx !== -1) {
        lines.splice(backtickIdx, enBlockIdx - backtickIdx);
        fs.writeFileSync('src/context/LanguageContext.js', lines.join('\n'), 'utf8');
        console.log('Fixed! Removed duplicated fr block from index', backtickIdx, 'to', enBlockIdx);
    } else {
        console.log('Could not find en: { block. Let me show what is in the file...');
        console.log(lines.slice(backtickIdx - 2, backtickIdx + 5).join('\n'));
        const nextKeys = lines.slice(backtickIdx + 5, backtickIdx + 20);
        console.log("Next few lines:", nextKeys.join('\n'));
    }
} else {
    console.log('No ``` found. File must be clean.');
}
