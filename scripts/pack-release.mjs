import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const destination = resolve(process.argv[2] ?? '.');
mkdirSync(destination, { recursive: true });

const result = spawnSync('npm', ['pack', '--json', '--pack-destination', destination], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

const packed = JSON.parse(result.stdout);
if (packed.length !== 1) {
  throw new Error(`Expected npm pack to create one artifact, received ${packed.length}`);
}

const [artifact] = packed;
if (artifact.name !== pkg.name || artifact.version !== pkg.version) {
  throw new Error(
    `Packed identity ${artifact.name}@${artifact.version} does not match package.json ${pkg.name}@${pkg.version}`
  );
}

const expectedFilename = `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${pkg.version}.tgz`;
if (artifact.filename !== expectedFilename) {
  throw new Error(`Packed filename ${artifact.filename} does not match expected ${expectedFilename}`);
}

process.stdout.write(`${resolve(destination, artifact.filename)}\n`);
