const fs = require('fs');
const content = fs.readFileSync('src/context/LanguageContext.js', 'utf8');

const ts = require('typescript');
const sourceFile = ts.createSourceFile('LanguageContext.js', content, ts.ScriptTarget.Latest, true);

function printErrors(node) {
    if (node.kind === ts.SyntaxKind.JsxElement) {
       // Stop at JSX for now
    }
}

// Alternatively, just count braces
let braceCount = 0;
let lines = content.split('\n');
let insideTranslations = false;
let inString = false;
let escape = false;

// Let's just run an ast parser using babel or just print out errors using babel.
