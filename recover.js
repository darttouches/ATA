const fs = require('fs');

const chunk = fs.readFileSync('frontend/.next/server/chunks/ssr/src_context_LanguageContext_0ce659eb.js', 'utf8');

// The chunk starts with something like: let d=(0,c.createContext)(),e={fr:{...
const startStr = 'e={fr:{';
const startIdx = chunk.indexOf(startStr);
if (startIdx === -1) {
  console.log("Could not find start of translations object");
  process.exit(1);
}

// Extract the object text by counting braces
let openBraces = 0;
let endIdx = -1;
let index = startIdx + 2; // Pointing to {
for (; index < chunk.length; index++) {
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

if (endIdx === -1) {
  console.log("Could not parse object");
  process.exit(1);
}

const objStr = chunk.slice(startIdx + 2, endIdx); // '{fr:{...'
let translationsObj;
try {
  // It's a JS object, not strict JSON. We can evaluate it
  translationsObj = eval('(' + objStr + ')');
} catch (err) {
  console.log("Error evaling object:", err.message);
  process.exit(1);
}

// Convert back to pretty string
const prettyTranslations = JSON.stringify(translationsObj, null, 4);

// Now read the current LanguageContext.js to get the bottom part
const currentFile = fs.readFileSync('frontend/src/context/LanguageContext.js', 'utf8');
const providerStart = currentFile.indexOf('export const LanguageProvider');

if (providerStart === -1) {
    console.log("Could not find LanguageProvider in current file");
    process.exit(1);
}

const bottomPart = currentFile.slice(providerStart);

const finalFileContent = `"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

export const translations = ${prettyTranslations};

${bottomPart}`;

fs.writeFileSync('frontend/src/context/LanguageContext.js', finalFileContent);
console.log("Successfully recovered LanguageContext.js");
