const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'src', 'app', 'dashboard');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function updateFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replacements that preserve desktop format by prefixing with md: 
  // and adding mobile classes before it.
  
  // Base page padding
  content = content.replace(/className="p-8"/g, 'className="p-4 sm:p-6 md:p-8"');
  
  // Card paddings
  content = content.replace(/className="([^"]+?\s)p-5"/g, 'className="$1p-4 sm:p-5"');
  // Modals and larger cards
  content = content.replace(/className="([^"]+?\s)p-6"/g, 'className="$1p-4 sm:p-6"');
  
  // Grids - most grids are 'lg:grid-cols-2' or 'grid-cols-2'
  // If there's a hardcoded grid-cols-X, we make it 1 on mobile.
  // We'll leave grids alone unless they explicitly are grid-cols-2 without md/lg
  content = content.replace(/className="([^"]+?\s)grid-cols-2([^"]*)"/g, (match, prefix, suffix) => {
    // If it already has lg:grid-cols-2 or md:grid-cols-2, skip it because it handles itself
    if (prefix.includes('md:grid-cols') || prefix.includes('lg:grid-cols') || suffix.includes('md:grid-cols')) {
       return match;
    }
    return `className="${prefix}grid-cols-1 md:grid-cols-2${suffix}"`;
  });
  content = content.replace(/className="grid-cols-2/g, 'className="grid-cols-1 md:grid-cols-2');

  content = content.replace(/className="([^"]+?\s)grid-cols-3([^"]*)"/g, (match, prefix, suffix) => {
    if (prefix.includes('md:grid-cols') || prefix.includes('lg:grid-cols')) return match;
    return `className="${prefix}grid-cols-1 sm:grid-cols-2 md:grid-cols-3${suffix}"`;
  });

  content = content.replace(/className="([^"]+?\s)grid-cols-4([^"]*)"/g, (match, prefix, suffix) => {
    if (prefix.includes('md:grid-cols') || prefix.includes('lg:grid-cols')) return match;
    return `className="${prefix}grid-cols-1 sm:grid-cols-2 lg:grid-cols-4${suffix}"`;
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

walkDir(targetDir, updateFile);
