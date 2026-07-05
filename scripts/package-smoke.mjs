import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const run = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }

  return result.stdout;
};

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (pkg.scripts?.build) {
  run('npm', ['run', 'build']);
}

const [pack] = JSON.parse(run('npm', ['pack', '--dry-run', '--json']));
const included = new Set(pack.files.map((file) => file.path));
const expected = new Set();

const addPath = (value) => {
  if (typeof value === 'string' && !value.startsWith('#')) {
    expected.add(value.replace(/^\.\//, ''));
  }
};

const walkExports = (value) => {
  if (typeof value === 'string') {
    addPath(value);
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(walkExports);
  }
};

if (typeof pkg.bin === 'string') {
  addPath(pkg.bin);
} else if (pkg.bin && typeof pkg.bin === 'object') {
  Object.values(pkg.bin).forEach(addPath);
}
addPath(pkg.main);
walkExports(pkg.exports);

const requiredReleaseFiles = [
  'README.md',
  'LICENSE',
  'SECURITY.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/rootguard.schema.json',
  'examples/README.md',
  'examples/basic.rootguard.json',
  'examples/agent.rootguard.json'
];

const missingEntryPoints = [...expected].filter((file) => !included.has(file));
const missingReleaseFiles = requiredReleaseFiles.filter((file) => !included.has(file));

if (missingEntryPoints.length || missingReleaseFiles.length) {
  if (missingEntryPoints.length) {
    console.error('Package tarball is missing declared entrypoints:');
    for (const file of missingEntryPoints) console.error(`- ${file}`);
  }

  if (missingReleaseFiles.length) {
    console.error('Package tarball is missing release support files:');
    for (const file of missingReleaseFiles) console.error(`- ${file}`);
  }

  process.exit(1);
}

console.log(
  `Package tarball includes ${expected.size} declared entrypoint(s) and ${requiredReleaseFiles.length} release support file(s).`
);
