import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { NeoMessage } from './NeoMessage'
import { NeoInput } from './NeoInput'

const meta = {
  title: 'Neo/NeoMessage',
  component: NeoMessage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    from: { control: 'inline-radio', options: ['them', 'me'] },
    typing: { control: 'boolean' },
  },
  args: { from: 'them', children: 'Hey! How is the deck coming along?' },
} satisfies Meta<typeof NeoMessage>

export default meta
type Story = StoryObj<typeof meta>

export const Received: Story = {}

export const Sent: Story = {
  args: { from: 'me', children: 'Almost done — exporting now 🚀', time: '14:32' },
}

export const Typing: Story = {
  args: { from: 'them', typing: true, children: undefined },
}

export const Thread: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 380 }}>
      <NeoMessage from="them">Hey! How is the deck coming along?</NeoMessage>
      <NeoMessage from="me" time="14:32">
        Almost done — exporting the posters now 🚀
      </NeoMessage>
      <NeoMessage from="them">Nice. Can you send the neumorphic one?</NeoMessage>
      <NeoMessage from="me">On it 👇</NeoMessage>
      <NeoMessage from="them" typing />
    </div>
  ),
}

/** A live mini-chat: NeoInput + NeoMessage together. */
export const Chat: Story = {
  render: function ChatDemo() {
    const [msgs, setMsgs] = useState<{ from: 'them' | 'me'; text: string }[]>([
      { from: 'them', text: 'Ask me anything about the kit ✨' },
    ])
    const [draft, setDraft] = useState('')
    const send = (text: string) => {
      if (!text.trim()) return
      setMsgs((m) => [...m, { from: 'me', text }])
      setDraft('')
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 440 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 180 }}>
          {msgs.map((m, i) => (
            <NeoMessage key={i} from={m.from}>
              {m.text}
            </NeoMessage>
          ))}
        </div>
        <NeoInput
          placeholder="Type a message…"
          value={draft}
          onChange={setDraft}
          onSubmit={send}
        />
      </div>
    )
  },
}
