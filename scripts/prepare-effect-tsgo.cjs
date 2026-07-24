const { execFileSync } = require('node:child_process');
const { chmodSync, readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { dirname, join } = require('node:path');

const root = join(__dirname, '..');
const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const version = execFileSync(process.execPath, [tsc, '--version'], {
  encoding: 'utf8',
});

if (!version.includes('effect-tsgo')) {
  const packageJson = require.resolve('@effect/tsgo/package.json');
  const packageMetadata = JSON.parse(readFileSync(packageJson, 'utf8'));
  const cli = join(dirname(packageJson), packageMetadata.bin['effect-tsgo']);

  execFileSync(process.execPath, [cli, 'patch'], { stdio: 'inherit' });
}

if (process.platform !== 'win32') {
  const effectRequire = createRequire(require.resolve('@effect/tsgo/package.json'));
  const platformPackage = `@effect/tsgo-${process.platform}-${process.arch}`;
  const packageJson = effectRequire.resolve(`${platformPackage}/package.json`);

  chmodSync(join(dirname(packageJson), 'lib', 'tsc'), 0o755);
}
