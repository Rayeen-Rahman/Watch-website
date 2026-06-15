// fix-api-imports.mjs - Run with: node fix-api-imports.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'frontend/src');
const apiFile = join(srcDir, 'utils/api.js');

const INLINE_PATTERN = "const API = import.meta.env.VITE_API_URL || 'https://artifactbd.com';";

function getAllFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...getAllFiles(full));
    else if (['.jsx', '.js'].includes(extname(full)) && full !== apiFile) results.push(full);
  }
  return results;
}

let fixed = 0;
for (const file of getAllFiles(srcDir)) {
  let content = readFileSync(file, 'utf8');
  if (!content.includes(INLINE_PATTERN)) continue;

  // Compute relative path from this file's directory to utils/api.js
  const rel = relative(dirname(file), apiFile).replace(/\\/g, '/').replace(/\.js$/, '');
  const importPath = rel.startsWith('.') ? rel : './' + rel;
  const importLine = `import { API } from '${importPath}';`;

  // Replace inline const with import
  content = content.replace(INLINE_PATTERN, importLine);
  writeFileSync(file, content, 'utf8');
  console.log(`Fixed: ${relative(srcDir, file)} -> ${importPath}`);
  fixed++;
}
console.log(`\nDone. Fixed ${fixed} files.`);
