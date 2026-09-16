import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

const args = process.argv.slice(2);
const sourceArg = args[0] || 'contracts/shadowballot.compact';
const targetArg = args[1] || 'managed';

const projectRoot = process.cwd();
const sourcePath = path.resolve(projectRoot, sourceArg);
const targetPath = path.resolve(projectRoot, targetArg);

console.log('====================================================');
console.log('  ShadowBallot: Midnight Compact ZK-Circuit Compiler');
console.log(`  Source : ${sourcePath}`);
console.log(`  Target : ${targetPath}`);
console.log('====================================================\n');

if (!fs.existsSync(sourcePath)) {
  console.error(`Error: Source file ${sourcePath} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function toWslPath(winPath) {
  const normalized = winPath.replace(/\\/g, '/');
  const match = normalized.match(/^([a-zA-Z]):\/(.*)$/);
  if (match) {
    const drive = match[1].toLowerCase();
    const rest = match[2];
    return `/mnt/${drive}/${rest}`;
  }
  return normalized;
}

let compiled = false;

// Attempt native compact if available
try {
  const test = spawnSync('compact', ['--version'], { encoding: 'utf-8' });
  if (test.status === 0 && test.stdout.toLowerCase().includes('compact')) {
    if (!test.stdout.includes('compression') && !test.stdout.includes('files within')) {
      console.log(`Using native Midnight Compact compiler: ${test.stdout.trim()}`);
      const res = spawnSync('compact', ['compile', sourcePath, targetPath], { stdio: 'inherit' });
      if (res.status === 0) compiled = true;
    }
  }
} catch {
  // Fall back to WSL toolchain
}

if (!compiled && process.platform === 'win32') {
  console.log('Invoking Midnight Compact Compiler via WSL toolchain (~/.local/bin/compact)...');
  const wslSource = toWslPath(sourcePath);
  const wslTarget = toWslPath(targetPath);
  const cmd = `~/.local/bin/compact compile "${wslSource}" "${wslTarget}"`;

  const res = spawnSync('wsl', ['-d', 'Ubuntu', '-e', 'bash', '-c', cmd], {
    stdio: 'inherit',
  });

  if (res.status === 0) {
    compiled = true;
  } else {
    console.error(`\nCompilation failed with exit code: ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

if (compiled) {
  console.log('\n[SUCCESS] ShadowBallot contract compiled successfully!');
  const zkirDir = path.join(targetPath, 'zkir');
  const keysDir = path.join(targetPath, 'keys');
  const contractDir = path.join(targetPath, 'contract');

  if (fs.existsSync(zkirDir)) {
    console.log('\nGenerated ZK Circuits (.zkir, .bzkir):');
    fs.readdirSync(zkirDir).forEach((f) => {
      const sz = fs.statSync(path.join(zkirDir, f)).size;
      console.log(`  - ${f.padEnd(36)} (${sz} bytes)`);
    });
  }

  if (fs.existsSync(keysDir)) {
    console.log('\nGenerated Zero-Knowledge Proving & Verifying Keys:');
    fs.readdirSync(keysDir).forEach((f) => {
      const sz = fs.statSync(path.join(keysDir, f)).size;
      console.log(`  - ${f.padEnd(36)} (${sz} bytes)`);
    });
  }

  if (fs.existsSync(contractDir)) {
    console.log('\nGenerated TypeScript Contract Interface:');
    fs.readdirSync(contractDir).forEach((f) => {
      console.log(`  - contract/${f}`);
    });
  }

  console.log('\n====================================================');
} else {
  console.error('\nCompilation failed.');
  process.exit(1);
}
