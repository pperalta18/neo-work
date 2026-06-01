import type { Preview } from '@storybook/react-vite'
import { THEMES, type LightSource } from '../src/lib/neumorphism'
import { NeoThemeProvider } from '../src/stories/neo/NeoTheme'
import '../src/index.css'

const preview: Preview = {
  globalTypes: {
    neoTheme: {
      description: 'Neumorphic theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    lightSource: {
      description: 'Light source corner',
      toolbar: {
        title: 'Light',
        icon: 'sun',
        items: [
          { value: 'tl', title: 'Top-left' },
          { value: 'tr', title: 'Top-right' },
          { value: 'bl', title: 'Bottom-left' },
          { value: 'br', title: 'Bottom-right' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { neoTheme: 'light', lightSource: 'tl' },
  // Per-component lighting controls. Available on EVERY story (Controls panel,
  // "Iluminación" group); leave blank to inherit the global toolbar values.
  argTypes: {
    neoTheme: {
      name: 'Tema',
      control: 'inline-radio',
      options: ['light', 'dark'],
      table: { category: 'Iluminación' },
    },
    lightSource: {
      name: 'Ángulo de luz',
      control: 'inline-radio',
      options: ['tl', 'tr', 'bl', 'br'],
      table: { category: 'Iluminación' },
    },
    intensity: {
      name: 'Intensidad relieve',
      control: { type: 'range', min: 0, max: 2.5, step: 0.1 },
      table: { category: 'Iluminación' },
    },
  },
  decorators: [
    (Story, context) => {
      // Local args (Controls panel) win over the global toolbar when set.
      const themeName =
        (context.args.neoTheme as 'light' | 'dark' | undefined) ??
        (context.globals.neoTheme as 'light' | 'dark') ??
        'light'
      const lightSource =
        (context.args.lightSource as LightSource | undefined) ??
        (context.globals.lightSource as LightSource) ??
        'tl'
      const intensity = context.args.intensity as number | undefined
      const theme = THEMES[themeName]
      return (
        <NeoThemeProvider theme={theme} lightSource={lightSource} intensity={intensity}>
          <div
            style={{
              background: theme.surface,
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 64,
              boxSizing: 'border-box',
            }}
          >
            <Story />
          </div>
        </NeoThemeProvider>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
  },
}

export default preview
