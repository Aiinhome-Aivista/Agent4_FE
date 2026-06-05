const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const replacements = [
  { regex: /text-white/g, replacement: 'text-slate-900' },
  { regex: /text-slate-200/g, replacement: 'text-slate-800' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700' },
  { regex: /text-slate-400/g, replacement: 'text-slate-600' },
  { regex: /border-white\/5/g, replacement: 'border-slate-200' },
  { regex: /border-white\/10/g, replacement: 'border-slate-300' },
  { regex: /border-white\/20/g, replacement: 'border-slate-300' },
  { regex: /bg-white\/5/g, replacement: 'bg-slate-50' },
  { regex: /bg-white\/10/g, replacement: 'bg-slate-100' },
  { regex: /bg-slate-800\/50/g, replacement: 'bg-slate-200/50' },
  { regex: /bg-slate-900\/40/g, replacement: 'bg-slate-100/40' },
  { regex: /bg-slate-900/g, replacement: 'bg-white' },
  { regex: /bg-slate-800/g, replacement: 'bg-slate-50' },
];

walk('./src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    for (let {regex, replacement} of replacements) {
      content = content.replace(regex, replacement);
    }
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
});
