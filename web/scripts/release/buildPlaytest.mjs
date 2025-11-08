import { spawn } from 'child_process';
import { join, resolve } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { ensureDirectory, formatManifestSummary, writeManifest } from './lib/manifest.js';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(HERE, '..');
const WEB_ROOT = resolve(ROOT, '..');

async function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function buildPlaytestBundle() {
  const outDir = resolve(WEB_ROOT, 'dist-playtest');
  await ensureDirectory(outDir);
  await fs.rm(outDir, { recursive: true, force: true });
  await ensureDirectory(outDir);

  console.log('> Building playtest bundle (mode=playtest)');
  await run('npm', ['run', 'build', '--', '--mode', 'playtest'], {
    cwd: WEB_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      FTS_BUILD_CHANNEL: 'playtest'
    }
  });

  const defaultDist = resolve(WEB_ROOT, 'dist');
  try {
    await fs.access(defaultDist);
  } catch (err) {
    throw new Error('Expected dist/ directory after build; run failed?');
  }

  console.log('> Copying output into dist-playtest');
  await fs.cp(defaultDist, outDir, { recursive: true });

  console.log('> Generating playtest manifest');
  const manifest = await writeManifest(outDir, 'playtest-manifest.json', {
    channel: 'playtest'
  });

  const summary = formatManifestSummary(manifest);
  const metadata = {
    generatedAt: manifest.generatedAt,
    fileCount: summary.fileCount,
    totalBytes: summary.totalBytes,
    combinedHash: summary.combinedHash,
    telemetryOptInRequired: true
  };
  await fs.writeFile(join(outDir, 'playtest-package.json'), JSON.stringify(metadata, null, 2), 'utf-8');

  console.log(
    `> Playtest package ready: ${summary.fileCount} files, ${(summary.totalBytes / 1048576).toFixed(2)} MiB`
  );
  console.log(`> Combined hash: ${summary.combinedHash}`);
}

buildPlaytestBundle().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
