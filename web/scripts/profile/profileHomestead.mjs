import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(HERE, '..', '..');

const INPUT_PATH = process.argv[2] || resolve(ROOT, 'telemetry', 'performance-samples.json');

async function readSamples(path) {
  try {
    const content = await fs.readFile(path, 'utf-8');
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected array of samples');
    }
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `No performance samples found at ${path}. Provide a JSON array of { frameMs, simMs, steps }.`
      );
    }
    throw err;
  }
}

function summarize(samples) {
  if (samples.length === 0) {
    return {
      count: 0,
      averageFrameMs: 0,
      worstFrameMs: 0,
      percentile95FrameMs: 0,
      averageSimMs: 0,
      hash: createHash('sha256').update('empty').digest('hex')
    };
  }

  const sorted = [...samples].sort((a, b) => a.frameMs - b.frameMs);
  const totalFrame = samples.reduce((sum, s) => sum + s.frameMs, 0);
  const totalSim = samples.reduce((sum, s) => sum + s.simMs, 0);
  const worst = sorted[sorted.length - 1]?.frameMs ?? 0;
  const idx95 = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  const p95 = sorted[idx95]?.frameMs ?? worst;

  const hash = createHash('sha256');
  for (const sample of samples) {
    hash.update(`${sample.frameMs.toFixed(3)}|${sample.simMs.toFixed(3)}|${sample.steps}`);
  }

  return {
    count: samples.length,
    averageFrameMs: totalFrame / samples.length,
    worstFrameMs: worst,
    percentile95FrameMs: p95,
    averageSimMs: totalSim / samples.length,
    hash: hash.digest('hex')
  };
}

async function profile() {
  const samples = await readSamples(INPUT_PATH);
  const summary = summarize(samples);
  console.log(JSON.stringify(summary, null, 2));
}

profile().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
