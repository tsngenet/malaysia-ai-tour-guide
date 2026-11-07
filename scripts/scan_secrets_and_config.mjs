import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const IGNORES = new Set(['node_modules', '.git', '.tools', 'dist', '.gemini']);
const SENSITIVE_PATTERN = /(api_?key|secret|password|private_key|token)\s*[:=]\s*['"][^'"]{6,}['"]/i;

const findings = [];

function walk(dir) {
  for (const item of readdirSync(dir)) {
    if (IGNORES.has(item)) continue;
    const full = join(dir, item);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (/\.(js|jsx|mjs|ts|json|env|md)$/.test(item)) {
      const content = readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (SENSITIVE_PATTERN.test(line)) {
          findings.push({
            file: full,
            line: idx + 1,
            text: line.trim()
          });
        }
      });
    }
  }
}

walk('.');
console.log(`Scan completed. Total matches: ${findings.length}`);
findings.forEach(f => console.log(`${f.file}:${f.line} -> ${f.text}`));
