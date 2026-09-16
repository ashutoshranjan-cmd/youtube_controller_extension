import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

// Runs the real UI in Chrome with mocked extension messaging and playback state.
const directory = mkdtempSync(join(tmpdir(), 'youtube-ui-test-'));
try {
  const result = await build({ entryPoints: ['tests/browser/control-bar.fixture.ts'], bundle: true, format: 'iife', write: false });
  const page = join(directory, 'test.html');
  writeFileSync(page, `<html><body><script>${result.outputFiles[0].text}</script></body></html>`);
  const flags = ['--headless', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=${join(directory, 'profile')}`, '--dump-dom', '--virtual-time-budget=1000'];
  if (process.getuid?.() === 0) flags.push('--no-sandbox');
  const chrome = spawnSync(process.env.CHROME_BIN || 'google-chrome', [...flags, pathToFileURL(page).href], { encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  const report = chrome.stdout?.match(/<pre id="test-result">(.*?)<\/pre>/s)?.[1];
  if (chrome.status !== 0 || !report?.startsWith('PASS:')) {
    throw new Error(report || chrome.error?.message || chrome.stderr || 'Chrome returned no test report');
  }
  console.log(report);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
