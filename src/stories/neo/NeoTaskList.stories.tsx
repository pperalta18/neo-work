import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NeoTaskList, type ReasoningStep } from './NeoReasoning'

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
  title: 'Neo/NeoTaskList',
  component: NeoTaskList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    title: 'Razonamiento',
    elapsed: 'Pensando…',
    header: true,
    steps: CHAIN,
  },
} satisfies Meta<typeof NeoTaskList>

export default meta
type Story = StoryObj<typeof meta>

/** The box-free variant: a flat checklist, two steps ticked, one spinning. */
export const Thinking: Story = {}

/** Every task ticked — the finished trace. */
export const Complete: Story = {
  args: {
    elapsed: 'Pensó durante 8s',
    steps: CHAIN.map((s) => ({ ...s, status: 'done' })),
  },
}

/** Just kicked off — only the first task is active. */
export const JustStarted: Story = {
  args: {
    elapsed: 'Pensando…',
    steps: CHAIN.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })),
  },
}

/** No header — only the tasklist, nothing else. */
export const ListOnly: Story = {
  args: { header: false },
}

/** A live trace that walks the list step by step, like a model reasoning. */
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

    return <NeoTaskList steps={steps} elapsed={done ? 'Pensó durante 7s' : 'Pensando…'} />
  },
}
