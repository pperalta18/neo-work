/**
 * verify-grid-stills.mjs — render representative frames of the GridReveal
 * (the process grid drawing itself in) so we can eyeball the woven cascade,
 * the blue draw tip, the grouping frame + tray settle, and confirm it scales
 * to any columns×rows. Bundles ONCE, then renders many stills.
 * Output: out/grid-stills/.
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const entry = path.resolve('src/remotion/index.ts');
const outDir = path.resolve('out/grid-stills');
mkdirSync(outDir, { recursive: true });

// Mirror remotion.config.ts (the CLI applies it; bundle() does not).
const webpackOverride = (current) => ({
  ...current,
  resolve: {
    ...current.resolve,
    alias: { ...(current.resolve?.alias ?? {}), '@': path.join(process.cwd(), 'src') },
  },
  module: {
    ...current.module,
    rules: [...(current.module?.rules ?? []), { test: /\.riv$/, type: 'asset/resource' }],
  },
});

console.log('bundling…');
const serveUrl = await bundle({ entryPoint: entry, webpackOverride });
console.log('bundled.');

const base = { columns: 6, rows: 4, cell: null, lineStyle: 'pen', dark: false };

// [label, frame, inputProps]
const shots = [
  // default 6×4 pen — across the cascade (total ~109 frames)
  ['6x4-pen-16-Hweave', 16, base],
  ['6x4-pen-30-weave', 30, base],
  ['6x4-pen-45-Vweave', 45, base],
  ['6x4-pen-62-frameWrap', 62, base],
  ['6x4-pen-80-frameClose', 80, base],
  ['6x4-pen-100-settled', 100, base],
  // style comparison at the same mid frame
  ['6x4-hairline-45', 45, { ...base, lineStyle: 'hairline' }],
  ['6x4-comet-45', 45, { ...base, lineStyle: 'comet' }],
  // dark theme
  ['6x4-pen-62-dark', 62, { ...base, dark: true }],
  // scalability — a big and a tiny grid mid-draw
  ['9x6-pen-mid', 40, { ...base, columns: 9, rows: 6 }],
  ['3x2-pen-mid', 24, { ...base, columns: 3, rows: 2 }],
];

for (const [label, frame, inputProps] of shots) {
  const composition = await selectComposition({ serveUrl, id: 'GridReveal', inputProps });
  const output = path.join(outDir, `${label}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps, scale: 1, overwrite: true });
  console.log('✓', label, `(frame ${frame} / ${composition.durationInFrames})`);
}

console.log('\nAll stills →', outDir);
