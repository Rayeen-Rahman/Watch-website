// fix-api-urls-safe.mjs
// Replaces ONLY the "module-level" inline API const pattern with an import from api.js
// Uses a precise regex that ensures the import statement is at module level (line start, no leading whitespace)

import { readFileSync, writeFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'frontend/src');
const apiFile = join(srcDir, 'utils/api.js');

function getAllFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...getAllFiles(full));
    else if (full.endsWith('.jsx') || (full.endsWith('.js') && full !== apiFile)) results.push(full);
  }
  return results;
}

// Pattern: the const API line at the START of a line (no leading whitespace)
// This ensures it's at module level, not inside a function
const PATTERN = /^const API = import\.meta\.env\.VITE_API_URL \|\| 'https:\/\/artifactbd\.com';/m;

// Pattern for "inside a function" (has leading spaces/tabs - this is what the broken files had)
const PATTERN_INDENTED = /^([ \t]+)const API\s*=\s*import\.meta\.env\.VITE_API_URL \|\| 'https:\/\/artifactbd\.com';/m;

let fixed = 0;

for (const file of getAllFiles(srcDir)) {
  let content = readFileSync(file, 'utf8');
  
  // Handle the module-level pattern (clean replacement)
  if (PATTERN.test(content)) {
    const rel = relative(dirname(file), apiFile).replace(/\\/g, '/').replace(/\.js$/, '');
    const importPath = rel.startsWith('.') ? rel : './' + rel;
    
    // Replace the const with an import statement
    const newContent = content.replace(PATTERN, `import { API } from '${importPath}';`);
    writeFileSync(file, newContent, 'utf8');
    console.log(`✓ Fixed: ${relative(srcDir, file)}`);
    fixed++;
  }
  // Handle indented pattern (inside component function - different handling needed)
  else if (PATTERN_INDENTED.test(content)) {
    console.log(`⚠ SKIPPED (indented - inside function): ${relative(srcDir, file)}`);
  }
}

console.log(`\nDone. Fixed ${fixed} files.`);
