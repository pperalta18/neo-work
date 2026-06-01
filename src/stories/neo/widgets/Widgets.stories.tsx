import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlarmWidget } from './AlarmWidget'
import { PinWidget } from './PinWidget'
import { ExpensesWidget } from './ExpensesWidget'
import { StopwatchWidget } from './StopwatchWidget'
import { CallWidget } from './CallWidget'
import { ScheduleWidget } from './ScheduleWidget'
import { BrowserWidget } from './BrowserWidget'
import { SpreadsheetWidget } from './SpreadsheetWidget'
import { FileWidget } from './FileWidget'
import { InvoiceWidget } from './InvoiceWidget'
import { CalendarWidget } from './CalendarWidget'
import { KanbanWidget } from './KanbanWidget'
import { ArtifactCard } from './ArtifactCard'
import { BookWidget } from './BookWidget'
import { ModuleGalleryWidget } from './ModuleGalleryWidget'
// — Landing kit: UI widgets —
import { TimelineWidget } from './TimelineWidget'
import { DropzoneWidget } from './DropzoneWidget'
import { SignatureWidget } from './SignatureWidget'
import { StatWidget } from './StatWidget'
import { ChartWidget } from './ChartWidget'
import { DashboardWidget } from './DashboardWidget'
import { InboxWidget } from './InboxWidget'
import { ToastWidget } from './ToastWidget'
import { StorefrontWidget } from './StorefrontWidget'
import { POSWidget } from './POSWidget'
import { LoyaltyCardWidget } from './LoyaltyCardWidget'
import { JobPostWidget } from './JobPostWidget'
import { SecurityWidget } from './SecurityWidget'
import { PricingWidget } from './PricingWidget'
import { ComparisonWidget } from './ComparisonWidget'
import { TestimonialWidget } from './TestimonialWidget'

const meta = {
  title: 'Neo/Widgets',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj

export const Alarm: Story = { render: () => <AlarmWidget /> }
export const Pin: Story = { render: () => <PinWidget filled={2} /> }
export const Expenses: Story = { render: () => <ExpensesWidget /> }
export const Stopwatch: Story = { render: () => <StopwatchWidget /> }
export const Call: Story = { render: () => <CallWidget /> }
export const Schedule: Story = { render: () => <ScheduleWidget /> }
export const Browser: Story = { render: () => <BrowserWidget /> }
export const Spreadsheet: Story = { render: () => <SpreadsheetWidget /> }
export const File: Story = { render: () => <FileWidget kind="xlsx" /> }
export const Invoice: Story = { render: () => <InvoiceWidget /> }
export const Calendar: Story = { render: () => <CalendarWidget view="month" /> }
export const Kanban: Story = { render: () => <KanbanWidget /> }
export const Artifact: Story = { render: () => <ArtifactCard /> }
export const Book: Story = { render: () => <BookWidget /> }

export const Gallery: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 32,
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <ScheduleWidget />
      <AlarmWidget />
      <PinWidget filled={2} />
      <ExpensesWidget />
      <StopwatchWidget />
      <CallWidget />
      <BrowserWidget />
      <SpreadsheetWidget />
      <FileWidget kind="pdf" />
      <InvoiceWidget />
      <CalendarWidget view="month" />
      <KanbanWidget />
      <ArtifactCard />
      <BookWidget width={280} />
    </div>
  ),
}

const wrap = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 32,
  alignItems: 'flex-start',
  justifyContent: 'center',
} as const

/** Every new landing widget at a glance. */
export const LandingKit: Story = {
  render: () => (
    <div style={wrap}>
      <ModuleGalleryWidget />
      <TimelineWidget />
      <DropzoneWidget />
      <SignatureWidget />
      <StatWidget />
      <ChartWidget />
      <DashboardWidget />
      <InboxWidget />
      <ToastWidget />
      <StorefrontWidget />
      <POSWidget />
      <LoyaltyCardWidget />
      <JobPostWidget />
      <SecurityWidget />
      <PricingWidget />
      <ComparisonWidget />
      <TestimonialWidget />
    </div>
  ),
}
