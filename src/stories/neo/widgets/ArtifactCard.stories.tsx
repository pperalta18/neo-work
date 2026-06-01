import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArtifactCard } from './ArtifactCard'

const meta = {
  title: 'Neo/Widgets/ArtifactCard',
  component: ArtifactCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    kind: { control: 'inline-radio', options: ['slides', 'docs', 'sheets', 'pdf', 'link'] },
    cols: { control: { type: 'range', min: 4, max: 12, step: 1 } },
    rows: { control: { type: 'range', min: 3, max: 10, step: 1 } },
  },
  args: {
    eyebrow: 'AGROTECH',
    date: 'MARCH 12-13, 2026',
    title: 'AgroTech VC',
    subtitle: 'INVESTMENT LANDSCAPE',
    footer: 'MARKET ANALYSIS',
    stat: '44%',
    statWords: ['ADV ROUNDS', 'AGRO ROUNDS', 'CROP BIOTECH'],
    url: 'https://docs.google.com/presentation/d/1FHqo',
    time: '01:36 pm',
    kind: 'slides',
    cols: 8,
    rows: 7,
    width: 520,
  },
} satisfies Meta<typeof ArtifactCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const GoogleDoc: Story = {
  args: {
    kind: 'docs',
    eyebrow: 'Q2 OKRS',
    date: '2026',
    title: 'Growth Plan',
    subtitle: 'PRODUCT STRATEGY',
    footer: 'INTERNAL DRAFT',
    stat: '3×',
    statWords: ['ARR TARGET', 'NEW MARKETS'],
    url: 'https://docs.google.com/document/d/9Kp2',
    time: '09:12 am',
  },
}

export const Teal: Story = {
  args: {
    kind: 'sheets',
    title: 'Revenue Model',
    subtitle: 'FINANCIAL FORECAST',
    footer: 'FY2026',
    stat: '68%',
    statWords: ['GROSS MARGIN', 'YOY GROWTH'],
    url: 'https://docs.google.com/spreadsheets/d/7Qa1',
    time: '04:48 pm',
    palette: {
      left: '#a9d6cf',
      right: '#c3ece4',
      ink: '#3f7d72',
      strong: '#23463f',
      muted: '#5c8a80',
    },
  },
}

export const ExternalLink: Story = {
  args: {
    kind: 'link',
    title: 'State of AI',
    subtitle: 'ANNUAL REPORT',
    url: 'https://www.stateof.ai/2026-report',
    time: '11:02 am',
  },
}
