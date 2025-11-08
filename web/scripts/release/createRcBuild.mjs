import { spawn } from 'child_process';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
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

async function writeMetadata(distDir, manifest) {
  const summary = formatManifestSummary(manifest);
  const target = join(distDir, 'rc-build.json');
  const metadata = {
    generatedAt: manifest.generatedAt,
    fileCount: summary.fileCount,
    totalBytes: summary.totalBytes,
    combinedHash: summary.combinedHash
  };
  await fs.writeFile(target, JSON.stringify(metadata, null, 2), 'utf-8');
  return metadata;
}

async function createRcBuild() {
  const distDir = resolve(WEB_ROOT, 'dist-rc');
  await ensureDirectory(distDir);

  console.log('> Clearing previous RC artifacts');
  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDirectory(distDir);

  console.log('> Building release candidate bundle');
  await run('npm', ['run', 'build', '--', '--mode', 'homestead-rc'], {
    cwd: WEB_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      FTS_BUILD_CHANNEL: 'rc'
    }
  });

  const defaultDist = resolve(WEB_ROOT, 'dist');
  try {
    await fs.access(defaultDist);
  } catch (err) {
    throw new Error('Expected dist/ directory after build; run failed?');
  }

  console.log('> Copying build output into dist-rc');
  await fs.cp(defaultDist, distDir, { recursive: true });

  console.log('> Generating manifest and metadata');
  const manifest = await writeManifest(distDir, 'rc-manifest.json', {
    channel: 'rc'
  });
  const metadata = await writeMetadata(distDir, manifest);

  console.log(
    `> RC build ready: ${manifest.files.length} files, ${(metadata.totalBytes / 1048576).toFixed(2)} MiB`
  );
  console.log(`> Combined hash: ${metadata.combinedHash}`);
}

createRcBuild().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
