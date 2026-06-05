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
  { regex: /#020617/g, replacement: '#f8fafc' }, // slate-50
  { regex: /#0f172a/g, replacement: '#ffffff' }, // slate-900 -> white
  { regex: /rgba\(15, 23, 42, 0\.4\)/g, replacement: 'rgba(255, 255, 255, 0.8)' },
  { regex: /rgba\(2, 6, 23, 0\.3\)/g, replacement: 'rgba(241, 245, 249, 0.5)' }, // slate-100
  { regex: /rgba\(255, 255, 255, 0\.05\)/g, replacement: 'rgba(0, 0, 0, 0.05)' },
  { regex: /rgba\(255, 255, 255, 0\.1\)/g, replacement: 'rgba(0, 0, 0, 0.1)' },
  { regex: /rgba\(255,255,255,0\.1\)/g, replacement: 'rgba(0,0,0,0.1)' },
  { regex: /rgba\(255,255,255,0\.03\)/g, replacement: 'rgba(0,0,0,0.03)' },
  { regex: /color: '#fff'/g, replacement: "color: '#0f172a'" },
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
      console.log(`Updated inline styles in ${filePath}`);
    }
  }
});
