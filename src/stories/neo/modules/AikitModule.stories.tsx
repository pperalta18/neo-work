import type { Meta, StoryObj } from '@storybook/react-vite'
import { AikitModule } from './AikitModule'
import { MODULE_NAMES, MODULES, type ModuleGroup } from './modules'

const meta = {
  title: 'Neo/AikitModule',
  component: AikitModule,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    module: { control: 'select', options: MODULE_NAMES },
    size: { control: { type: 'range', min: 24, max: 160, step: 4 } },
    iconOnly: { control: 'boolean' },
    color: { control: 'color' },
    animated: { control: 'boolean' },
  },
  args: { module: 'udon', size: 96 },
} satisfies Meta<typeof AikitModule>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const IconOnly: Story = {
  args: { module: 'foresight', iconOnly: true, size: 120 },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <AikitModule module="hotpot" size={48} />
      <AikitModule module="hotpot" size={72} />
      <AikitModule module="hotpot" size={104} />
    </div>
  ),
}

const GROUPS: { id: ModuleGroup; label: string }[] = [
  { id: 'data', label: 'Datos e inteligencia' },
  { id: 'action', label: 'Acción y automatización' },
  { id: 'orchestration', label: 'Orquestación' },
]

/** Every module, grouped by family — the full catalogue from the Figma board. */
export const Catalogue: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {GROUPS.map((group) => (
        <section key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              opacity: 0.5,
            }}
          >
            {group.label}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 48px', alignItems: 'center' }}>
            {MODULE_NAMES.filter((name) => MODULES[name].group === group.id).map((name) => (
              <AikitModule key={name} module={name} size={56} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
}

/**
 * The live Rive animation for a single module. It plays a one-shot entry on
 * load, then re-fires on hover/click.
 */
export const Animated: Story = {
  args: { module: 'feedbackLoop', animated: true, size: 120 },
}

/**
 * Every module's vector animation, grouped by family. Hover/click any icon to
 * re-fire its reaction.
 */
export const AnimatedCatalogue: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {GROUPS.map((group) => (
        <section key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              opacity: 0.5,
            }}
          >
            {group.label}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 48px', alignItems: 'center' }}>
            {MODULE_NAMES.filter((name) => MODULES[name].group === group.id).map((name) => (
              <AikitModule key={name} module={name} size={56} animated />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
}

/** Just the animated icons, at full Figma scale. */
export const AnimatedIconGrid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 28,
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      {MODULE_NAMES.map((name) => (
        <AikitModule key={name} module={name} iconOnly size={72} animated />
      ))}
    </div>
  ),
}

/** Just the icons, at full Figma scale. */
export const IconGrid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 28,
        alignItems: 'center',
        justifyItems: 'center',
      }}
    >
      {MODULE_NAMES.map((name) => (
        <AikitModule key={name} module={name} iconOnly size={72} />
      ))}
    </div>
  ),
}
