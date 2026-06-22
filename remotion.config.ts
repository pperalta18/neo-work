import { Config } from '@remotion/cli/config';
import path from 'node:path';

/**
 * Remotion uses its own webpack bundler (not Vite), so we re-declare the `@`
 * alias here so the neumorphic components load unchanged. CSS imports (and the
 * Universal Sans fonts in src/index.css → /fonts/* served from public/) work
 * out of the box.
 */
Config.setVideoImageFormat('png');

/**
 * The `GloboVivo` hero scene renders a real WebGL sphere via @remotion/three.
 * Headless Chromium can't create a hardware WebGL context, so point it at
 * ANGLE's software backend (SwiftShader). `swangle` needs no GPU and renders
 * **deterministically** across machines — exactly what the deterministic-render
 * contract wants. Harmless for the DOM-only compositions (they create no GL
 * context). See https://www.remotion.dev/docs/three + #--gl.
 */
Config.setChromiumOpenGlRenderer('swangle');

Config.overrideWebpackConfig((current) => ({
  ...current,
  resolve: {
    ...current.resolve,
    alias: {
      ...(current.resolve?.alias ?? {}),
      '@': path.join(process.cwd(), 'src'),
    },
  },
  module: {
    ...current.module,
    rules: [
      ...(current.module?.rules ?? []),
      // Vite resolves `./foo.riv?url` to an emitted URL out of the box; webpack
      // doesn't, so emit Rive binaries as assets and hand back their URL.
      { test: /\.riv$/, type: 'asset/resource' },
    ],
  },
}));
