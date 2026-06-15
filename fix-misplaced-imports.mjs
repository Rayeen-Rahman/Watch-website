// fix-misplaced-imports.mjs — moves import statements from inside function bodies to the top
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'frontend/src');

function getAllFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...getAllFiles(full));
    else if (['.jsx', '.js'].includes(extname(full))) results.push(full);
  }
  return results;
}

const IMPORT_REGEX = /^(\s+)(import \{ API \} from '.*?utils\/api';)\s*$/gm;

let fixed = 0;
for (const file of getAllFiles(srcDir)) {
  let content = readFileSync(file, 'utf8');
  
  // Find any import statement that has leading whitespace (i.e., inside a function)
  const matches = [...content.matchAll(IMPORT_REGEX)];
  if (matches.length === 0) continue;

  for (const match of matches) {
    const [fullMatch, , importStatement] = match;
    // Remove the misplaced import (with leading whitespace)
    content = content.replace(fullMatch + '\n', '');
    content = content.replace(fullMatch, '');
    
    // Add clean import at the top level, after the last existing import line
    const lastImportIdx = content.lastIndexOf('\nimport ');
    if (lastImportIdx !== -1) {
      const lineEnd = content.indexOf('\n', lastImportIdx + 1);
      content = content.slice(0, lineEnd + 1) + importStatement + '\n' + content.slice(lineEnd + 1);
    }
    
    console.log(`Fixed misplaced import in: ${relative(srcDir, file)}`);
    fixed++;
  }
  
  writeFileSync(file, content, 'utf8');
}
console.log(`\nDone. Fixed ${fixed} files.`);
