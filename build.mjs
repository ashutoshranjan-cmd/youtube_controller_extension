import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const isWatch = process.argv.includes('--watch');

// Ensure destination directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDirectory(srcDir, destDir) {
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function copyAssets() {
  copyFile('src/manifest.json', 'dist/manifest.json');
  copyFile('src/popup/popup.html', 'dist/popup/popup.html');
  copyFile('src/popup/popup.css', 'dist/popup/popup.css');
  copyDirectory('src/icons', 'dist/icons');
  console.log('✓ Copied static assets (manifest, HTML, CSS, icons)');
}

const buildOptions = [
  // 1. Service Worker (ES Module)
  {
    entryPoints: ['src/background/service-worker.ts'],
    outfile: 'dist/background/service-worker.js',
    bundle: true,
    format: 'esm',
    target: ['chrome110'],
    platform: 'browser',
    sourcemap: false
  },
  // 2. YouTube Content Script (IIFE)
  {
    entryPoints: ['src/content/youtube/index.ts'],
    outfile: 'dist/content/youtube-content.js',
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    platform: 'browser',
    sourcemap: false
  },
  // 2b. YouTube Main World Script (IIFE)
  {
    entryPoints: ['src/content/youtube/main-world.ts'],
    outfile: 'dist/content/youtube-main-world.js',
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    platform: 'browser',
    sourcemap: false
  },
  // 3. Control Bar Content Script (IIFE)
  {
    entryPoints: ['src/content/control-bar/index.ts'],
    outfile: 'dist/content/control-bar.js',
    bundle: true,
    format: 'iife',
    target: ['chrome110'],
    platform: 'browser',
    sourcemap: false
  },
  // 4. Action Popup (ES Module)
  {
    entryPoints: ['src/popup/popup.ts'],
    outfile: 'dist/popup/popup.js',
    bundle: true,
    format: 'esm',
    target: ['chrome110'],
    platform: 'browser',
    sourcemap: false
  }
];

async function build() {
  copyAssets();

  for (const opt of buildOptions) {
    if (isWatch) {
      const ctx = await esbuild.context(opt);
      await ctx.watch();
    } else {
      await esbuild.build(opt);
    }
  }

  // Also build tests if tests directory exists
  if (fs.existsSync('tests')) {
    const testFiles = fs.readdirSync('tests').filter(f => f.endsWith('.ts'));
    for (const testFile of testFiles) {
      await esbuild.build({
        entryPoints: [`tests/${testFile}`],
        outfile: `dist/tests/${testFile.replace(/\.ts$/, '.js')}`,
        bundle: true,
        format: 'esm',
        target: ['node18'],
        platform: 'node'
      });
    }
    console.log('✓ Compiled tests');
  }

  console.log('✓ Build completed successfully into dist/');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});

