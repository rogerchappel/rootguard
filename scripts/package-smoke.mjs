import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
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

const smokeRoot = mkdtempSync(join(tmpdir(), 'rootguard-package-smoke-'));
try {
  const packDir = join(smokeRoot, 'pack');
  const consumerDir = join(smokeRoot, 'consumer');
  mkdirSync(packDir);
  mkdirSync(consumerDir);

  const [packed] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', packDir]));
  const tarball = join(packDir, packed.filename);
  writeFileSync(join(consumerDir, 'package.json'), '{"name":"rootguard-package-consumer","private":true}\n');
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: consumerDir });
  run(
    process.execPath,
    [join(consumerDir, 'node_modules', 'rootguard', 'bin', 'rootguard.js'), 'init', '--cwd', consumerDir],
    { cwd: consumerDir }
  );

  const manifest = JSON.parse(readFileSync(join(consumerDir, '.rootguard.json'), 'utf8'));
  const schema = JSON.parse(
    readFileSync(join(consumerDir, 'node_modules', 'rootguard', 'docs', 'rootguard.schema.json'), 'utf8')
  );
  const schemaUrl = new URL(manifest.$schema);
  if (schemaUrl.protocol !== 'https:' || schemaUrl.hostname !== 'raw.githubusercontent.com') {
    throw new Error(`Generated manifest has a non-portable schema reference: ${manifest.$schema}`);
  }
  if (manifest.$schema !== schema.$id) {
    throw new Error(`Generated schema reference ${manifest.$schema} does not match schema $id ${schema.$id}`);
  }

  console.log('Packed CLI generates a manifest with a canonical hosted schema reference.');
} finally {
  rmSync(smokeRoot, { recursive: true, force: true });
}
