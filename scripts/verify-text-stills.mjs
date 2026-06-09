/**
 * verify-text-stills.mjs — render representative frames of the text-animation
 * library so we can eyeball each technique + confirm it bundles/renders.
 * Bundles ONCE, then renders many stills (fast). Output: out/text-stills/.
 */
import { bundle } from '@remotion/bundler';
import { selectComposition, renderStill } from '@remotion/renderer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const entry = path.resolve('src/remotion/index.ts');
const outDir = path.resolve('out/text-stills');
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

// [compId, frame, label, inputProps?]
const shots = [
  // the showcase reel — each at a developed/hold frame (chip visible)
  ['TextShowcase', 88, '00-camera-pan'],
  ['TextShowcase', 146, '01-focus-in'],
  ['TextShowcase', 212, '02-word-rise'],
  ['TextShowcase', 283, '03-char-cascade'],
  ['TextShowcase', 340, '04-line-wipe'],
  ['TextShowcase', 420, '05-perspective-cards'],
  ['TextShowcase', 478, '06-split-flap'],
  ['TextShowcase', 545, '07-scale-punch'],
  ['TextShowcase', 600, '08-light-sweep'],
  ['TextShowcase', 696, '09-line-stack'],
  ['TextShowcase', 770, '10-typewriter'],
  ['TextShowcase', 852, '11-counter-stat'],
  // camera-pan progression (standalone) — see the zoom-out pan
  ['TextReveal', 12, 'campan-12-zoomedin', { variant: 'camera-pan', text: 'Automatiza tu negocio', subtitle: 'Agentes de IA que trabajan por ti' }],
  ['TextReveal', 34, 'campan-34-midpan', { variant: 'camera-pan', text: 'Automatiza tu negocio', subtitle: 'Agentes de IA que trabajan por ti' }],
  ['TextReveal', 95, 'campan-95-settled', { variant: 'camera-pan', text: 'Automatiza tu negocio', subtitle: 'Agentes de IA que trabajan por ti' }],
  // one dark-palette check
  ['TextReveal', 70, 'dark-focus-in', { variant: 'focus-in', text: 'Modo oscuro', subtitle: 'Cartel de título', dark: true }],
];

for (const [id, frame, label, inputProps = {}] of shots) {
  const composition = await selectComposition({ serveUrl, id, inputProps });
  const output = path.join(outDir, `${label}.png`);
  await renderStill({ composition, serveUrl, frame, output, inputProps, scale: 0.5, overwrite: true });
  console.log('✓', label, `(frame ${frame})`);
}

console.log('\nAll stills →', outDir);
