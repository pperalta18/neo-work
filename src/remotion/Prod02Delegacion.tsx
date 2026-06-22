import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BRAND, KIT_BLUE, elevation, lightTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts, BODY_FONT } from './fonts'
import { CURVE, DUR, ease } from './motion'
import { AppWindow } from './aikit/AppWindow'
import { type AppWindowTiming } from './aikit/windowScript'
import { Inbox, type InboxRow } from './aikit/Inbox'
import { Spreadsheet } from './aikit/Spreadsheet'
import { Invoice } from './aikit/Invoice'
import { ProgramRunner } from './aikit/ProgramRunner'
import { ChatPanel } from './aikit/ChatPanel'
import { ToastStack } from './aikit/NotificationToast'
import { StatTile } from './aikit/StatTile'
import { cameraPose, cameraTransform, driftedPose } from './aikit/cameraScript'
import { CAST } from './aikit/cast'
import {
  CHAT_BOX,
  CHAT_ENTER,
  CRM2_FIELDS,
  CRM_GEO,
  CRM_QUERY_AT,
  CRM_RESULT_AT,
  EMAIL_AT,
  EXEC_START,
  INBOX_ENTER,
  INVOICE_ITEMS,
  INVOICE_SCHED2,
  INVOICE_TAX,
  PANEL_BOX,
  PROD01_COPY,
  PROD02_CAM,
  PROD02_CAPTIONS,
  PROD02_CHAT,
  PROD02_COPY,
  PROD02_SCHEDULE,
  PROD02_STEPS,
  PROD02_TOASTS,
  PROD02_WRITES,
  PROGRAM_ENTER,
  SENT_AT,
  SHEET_BASE,
  SHEET_COL_W,
  SHEET_WIDGET_W,
  STAT,
  WIN2,
  mmss,
  stopwatch2Seconds,
} from './prod02Script'

export { PROD02_DURATION } from './prod02Script'

/**
 * Prod02Delegacion — Acto 2, «la primera delegación» (45s · 1920×1080).
 * ─────────────────────────────────────────────────────────────────────
 * The same email as Prod01, but the human types one sentence into the AiKit
 * chat. The IA deploys the same 50-step program and runs it as a flawless
 * overlapping cascade — CRM reading itself, plantilla filling in a wavefront,
 * presupuesto materialising — with no cursor anywhere: nobody touches the
 * windows. The stopwatch that dragged to 23:14 freezes at 00:40, and the
 * payoff stat lands: 23 min 14 s → 40 s. All choreography in prod02Script.ts.
 */

const theme = lightTheme
const A = PROD02_SCHEDULE.activeAt

/** Snappier draw-in for windows the cascade uses moments later (Prod01's). */
const QUICK_WIN: Partial<AppWindowTiming> = {
  trace: 18,
  traceSettle: 8,
  surfaceIn: 10,
  chromeStagger: 3,
  contentIn: 8,
}

const INBOX_ROWS: readonly InboxRow[] = [
  {
    channel: 'email',
    sender: `${CAST.clientContact} · ${CAST.clientCompany}`,
    preview: PROD01_COPY.emailPreview,
    time: PROD01_COPY.emailTime,
    unread: true,
    showAt: EMAIL_AT,
    selectAt: A[0], // «Releer los requisitos» — the IA opens it, not a click
  },
  { channel: 'whatsapp', sender: 'Almacén Central', preview: 'El pedido 4471 está listo para envío.', time: '08:47', unread: true },
  { channel: 'email', sender: 'Gestoría Llopis', preview: 'Recordatorio: presentación del modelo 303 este mes.', time: '08:21' },
]

export function Prod02Delegacion() {
  const frame = useCurrentFrame()
  const cam = driftedPose(cameraPose(PROD02_CAM, frame, CURVE.standard), frame)
  const chatIn = ease(frame, CHAT_ENTER, CHAT_ENTER + DUR.reveal)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, color: theme.textStrong, overflow: 'hidden' }}>
      <Fonts />

      {/* ── the desktop, shot through the virtual camera ── */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
        {/* Bandeja — the same email, the same morning */}
        <div style={{ position: 'absolute', left: WIN2.inbox.x, top: WIN2.inbox.y, zIndex: 1 }}>
          <AppWindow title={`Bandeja · ${CAST.company}`} icon="bell" width={WIN2.inbox.w} height={WIN2.inbox.h} enter="draw" enterAt={INBOX_ENTER}>
            <Inbox title={PROD01_COPY.inboxTitle} items={INBOX_ROWS} width={WIN2.inbox.w - 72} plate={false} />
          </AppWindow>
        </div>

        {/* CRM — reads itself */}
        {frame >= A[8] && (
          <div style={{ position: 'absolute', left: WIN2.crm.x, top: WIN2.crm.y, zIndex: 2 }}>
            <AppWindow title={PROD01_COPY.crmTitle} icon="user" url="crm.comercialaster.es" width={WIN2.crm.w} height={WIN2.crm.h} enter="draw" enterAt={A[8]} timing={QUICK_WIN}>
              <CrmContent frame={frame} />
            </AppWindow>
          </div>
        )}

        {/* Plantilla — fills in a wavefront, no hand on the keyboard */}
        {frame >= A[3] && (
          <div style={{ position: 'absolute', left: WIN2.sheet.x, top: WIN2.sheet.y, zIndex: 3 }}>
            <AppWindow title={PROD01_COPY.sheetTitle} icon="dialpad" width={WIN2.sheet.w} height={WIN2.sheet.h} enter="draw" enterAt={A[3]} timing={QUICK_WIN}>
              <Spreadsheet
                title={PROD01_COPY.sheetTitle}
                base={SHEET_BASE}
                writes={PROD02_WRITES}
                columns={[
                  { width: SHEET_COL_W[0] },
                  { width: SHEET_COL_W[1], align: 'left' },
                  { width: SHEET_COL_W[2], align: 'right' },
                  { width: SHEET_COL_W[3], align: 'right' },
                ]}
                headerRow={false}
                width={SHEET_WIDGET_W}
                plate={false}
              />
            </AppWindow>
          </div>
        )}

        {/* El presupuesto (PDF) — writes itself */}
        {frame >= A[41] && (
          <div style={{ position: 'absolute', left: WIN2.invoice.x, top: WIN2.invoice.y, zIndex: 4 }}>
            <AppWindow title={PROD01_COPY.pdfTitle} icon="check" width={WIN2.invoice.w} height={WIN2.invoice.h} enter="draw" enterAt={A[41]} timing={QUICK_WIN} accent={BRAND.green}>
              <Invoice
                number={PROD01_COPY.invoiceNumber}
                from={CAST.company}
                billTo={CAST.clientCompany}
                date={PROD01_COPY.invoiceDate}
                items={INVOICE_ITEMS}
                taxRate={INVOICE_TAX}
                status="draft"
                schedule={INVOICE_SCHED2}
                width={WIN2.invoice.w - 72}
                plate={false}
              />
            </AppWindow>
          </div>
        )}

        {/* El programa — the same 50 steps, in the same place as Acto 1 */}
        {frame >= PROGRAM_ENTER && (
          <div style={{ position: 'absolute', left: PANEL_BOX.x, top: PANEL_BOX.y, zIndex: 2 }}>
            <ProgramRunner
              title={PROD01_COPY.programTitle}
              steps={PROD02_STEPS}
              schedule={PROD02_SCHEDULE}
              width={PANEL_BOX.w}
              height={PANEL_BOX.h}
              rowHeight={44}
              enterAt={PROGRAM_ENTER}
            />
          </div>
        )}

        {/* El chat — the only surface the human touches */}
        <div
          style={{
            position: 'absolute',
            left: CHAT_BOX.x,
            top: CHAT_BOX.y,
            zIndex: 6,
            opacity: chatIn,
            transform: `translateY(${(1 - chatIn) * 24}px)`,
          }}
        >
          <ChatPanel script={PROD02_CHAT} title={PROD02_COPY.chatTitle} subtitle={CAST.company} width={CHAT_BOX.w} height={CHAT_BOX.h} />
        </div>
      </div>

      {/* ── screen-space rotulación ── */}
      <Eyebrow frame={frame} />
      <Stopwatch frame={frame} />
      {/* bottom-right is the one quiet corner once the desk is full */}
      <div style={{ position: 'absolute', right: 96, bottom: 64 }}>
        <ToastStack script={PROD02_TOASTS} direction="up" width={360} toastHeight={104} />
      </div>
      {frame >= STAT.enterAt && (
        <StatTile
          label={STAT.label}
          before={STAT.before}
          after={STAT.after}
          delta={STAT.delta}
          accent="green"
          enterAt={STAT.enterAt}
          revealAt={STAT.revealAt}
          width={470}
          style={{ position: 'absolute', left: 725, top: 410 }}
        />
      )}
      <Captions frame={frame} />
    </AbsoluteFill>
  )
}

/* ── CRM viewport: query types itself → result lights → ficha, "Leído" ─── */

function CrmContent({ frame }: { frame: number }) {
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 12 })
  const row = elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 14 })

  const queryIn = ease(frame, CRM_QUERY_AT + 3, CRM_QUERY_AT + 3 + DUR.base)
  const resultSel = ease(frame, CRM_RESULT_AT + 3, CRM_RESULT_AT + 11)
  const fichaIn = ease(frame, CRM_RESULT_AT + 6, CRM_RESULT_AT + 6 + DUR.reveal)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontSize: 14 }}>
      {/* search well */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: CRM_GEO.searchH,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
          color: theme.textMuted,
          ...well,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span style={{ color: theme.textStrong, opacity: queryIn }}>Talleres Riera</span>
      </div>

      {/* result row */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: CRM_GEO.resultY,
          width: '100%',
          height: CRM_GEO.resultH,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          opacity: queryIn,
          ...(resultSel > 0.5 ? { ...row, backgroundColor: `${KIT_BLUE}10` } : {}),
        }}
      >
        <span style={{ width: 4, height: 22, borderRadius: 2, background: KIT_BLUE, opacity: resultSel }} />
        <span style={{ fontWeight: 600 }}>{CAST.clientCompany}</span>
        <span style={{ color: theme.textMuted, fontSize: 12.5 }}>Badalona · cliente desde 2019</span>
      </div>

      {/* ficha — fields flash "Leído" as the cascade consumes them */}
      <div style={{ position: 'absolute', left: 0, top: CRM_GEO.fieldsY, width: '100%', opacity: fichaIn, transform: `translateY(${(1 - fichaIn) * 10}px)` }}>
        {CRM2_FIELDS.map((f, i) => {
          const read = f.readAt != null ? ease(frame, f.readAt, f.readAt + 5) * (1 - ease(frame, f.readAt + 22, f.readAt + 32)) : 0
          return (
            <div key={f.label} style={{ height: CRM_GEO.fieldH, display: 'flex', alignItems: 'center', borderBottom: i < CRM2_FIELDS.length - 1 ? `1px solid ${theme.gridLine}` : 'none' }}>
              <span style={{ width: CRM_GEO.valueX, fontSize: 12, letterSpacing: 0.4, color: theme.textMuted, textTransform: 'uppercase' }}>{f.label}</span>
              <span style={{ position: 'relative', fontWeight: 500, padding: '4px 10px', marginLeft: -10, borderRadius: 8, background: `rgba(36, 99, 235, ${0.12 * read})` }}>
                {f.value}
                {read > 0 && (
                  <span style={{ position: 'absolute', right: -62, top: 3, fontSize: 11.5, fontWeight: 600, color: KIT_BLUE, opacity: read }}>
                    Leído
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── screen-space rotulación ───────────────────────────────────────────── */

function Eyebrow({ frame }: { frame: number }) {
  const enter = ease(frame, 18, 18 + DUR.reveal)
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 46,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: 2.4,
        color: theme.textMuted,
        opacity: 0.78 * enter,
      }}
    >
      {PROD02_COPY.eyebrow}
    </div>
  )
}

/** The same clock as Prod01, in the same corner — frozen at 00:40. */
function Stopwatch({ frame }: { frame: number }) {
  const rise = ease(frame, EXEC_START - 14, EXEC_START)
  if (rise <= 0.001) return null
  const frozen = frame >= SENT_AT
  const card = elevation(theme, { depth: 'raised', distance: 7, blur: 15, radius: 20 })
  return (
    <div
      style={{
        position: 'absolute',
        right: 96,
        top: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 3,
        padding: '12px 20px',
        opacity: rise,
        transform: `translateY(${(1 - rise) * 12}px)`,
        ...card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="clock" size={19} color={frozen ? BRAND.green : theme.textMuted} />
        <span style={{ fontSize: 30, fontWeight: 650, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums', color: theme.textStrong }}>
          {mmss(stopwatch2Seconds(frame))}
        </span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.6, color: theme.textMuted }}>EN LA TAREA</span>
    </div>
  )
}

function Captions({ frame }: { frame: number }) {
  return (
    <>
      {PROD02_CAPTIONS.map((c) => {
        const enter = ease(frame, c.showAt, c.showAt + 12)
        const exit = 1 - ease(frame, c.hideAt - 10, c.hideAt)
        const p = enter * exit
        if (p <= 0.001) return null
        return (
          <div
            key={c.showAt}
            style={{
              position: 'absolute',
              left: 96,
              top: 975,
              maxWidth: 860,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: -0.3,
              lineHeight: 1.3,
              color: theme.textStrong,
              opacity: 0.88 * p,
              transform: `translateY(${(1 - enter) * 10}px)`,
            }}
          >
            {c.text}
          </div>
        )
      })}
    </>
  )
}
