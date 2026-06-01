import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NeoReasoning, type ReasoningStep } from './NeoReasoning'

const CHAIN: ReasoningStep[] = [
  {
    title: 'Entender la pregunta',
    detail: 'El usuario quiere comparar dos planes de precios.',
    status: 'done',
  },
  {
    title: 'Descomponer en sub-tareas',
    detail: 'Extraer coste mensual, límites y descuento anual de cada plan.',
    status: 'done',
  },
  {
    title: 'Calcular el coste anual',
    detail: 'Aplicando el 20% de descuento al pago anual…',
    status: 'active',
  },
  { title: 'Comparar y elegir el mejor', status: 'pending' },
  { title: 'Redactar la respuesta final', status: 'pending' },
]

const meta = {
  title: 'Neo/NeoReasoning',
  component: NeoReasoning,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    title: 'Razonamiento',
    elapsed: 'Pensando…',
    steps: CHAIN,
  },
} satisfies Meta<typeof NeoReasoning>

export default meta
type Story = StoryObj<typeof meta>

/** Mid-thought: two steps settled, one spinning, two ahead. */
export const Thinking: Story = {}

/** Every step resolved — the finished trace. */
export const Complete: Story = {
  args: {
    elapsed: 'Pensó durante 8s',
    steps: CHAIN.map((s) => ({ ...s, status: 'done' })),
  },
}

/** Just kicked off — only the first step is active. */
export const JustStarted: Story = {
  args: {
    elapsed: 'Pensando…',
    steps: CHAIN.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })),
  },
}

/** A live trace that walks the chain step by step, like a model reasoning. */
export const Live: Story = {
  render: function LiveDemo() {
    const [reached, setReached] = useState(0)

    useEffect(() => {
      if (reached >= CHAIN.length) return
      const id = setTimeout(() => setReached((r) => r + 1), 1400)
      return () => clearTimeout(id)
    }, [reached])

    const done = reached >= CHAIN.length
    const steps: ReasoningStep[] = CHAIN.map((s, i) => ({
      ...s,
      status: i < reached ? 'done' : i === reached ? 'active' : 'pending',
    }))

    return (
      <NeoReasoning
        steps={steps}
        elapsed={done ? 'Pensó durante 7s' : 'Pensando…'}
      />
    )
  },
}
