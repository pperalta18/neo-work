/**
 * verify-store-inventory-stills.mjs — render representative frames of the
 * StoreInventory scene so we can eyeball the compose/attach message alignment
 * and timing. Bundles ONCE, then renders many stills. Output: out/store-inv/.
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const entry = path.resolve('src/remotion/index.ts');
const outDir = path.resolve('out/store-inv');
mkdirSync(outDir, { recursive: true });

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

// Shot map (global frames @30fps): S1=70 greeting, S2=88 compose, S3=78 attach, S4=112 thread.
const frames = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const shots = frames.length
  ? frames.map((f) => ['StoreInventory', f, `f${String(f).padStart(3, '0')}`])
  : [
      ['StoreInventory', 40, 'greet'],
      ['StoreInventory', 100, 'compose-typing'],
      ['StoreInventory', 132, 'compose-typed'],
      ['StoreInventory', 141, 'compose-sent-in'],
      ['StoreInventory', 148, 'compose-sent-mid'],
      ['StoreInventory', 156, 'compose-sent-end'],
      ['StoreInventory', 170, 'attach-chip'],
      ['StoreInventory', 210, 'attach-typed'],
      ['StoreInventory', 250, 'thread-land'],
      ['StoreInventory', 320, 'thread-reply'],
    ];

for (const [id, frame, label] of shots) {
  const composition = await selectComposition({ serveUrl, id });
  const output = path.join(outDir, `${label}.png`);
  await renderStill({ composition, serveUrl, frame, output, scale: 0.5, overwrite: true });
  console.log('✓', label, `(frame ${frame})`);
}

console.log('\nAll stills →', outDir);
