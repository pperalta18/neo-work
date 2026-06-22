import type { CSSProperties } from 'react'
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
import { ScriptedCursor } from './aikit/ScriptedCursor'
import { CLICK_SETTLE } from './aikit/cursorScript'
import { cameraPose, cameraTransform, driftedPose } from './aikit/cameraScript'
import { CAST } from './aikit/cast'
import {
  ATTACH_AT,
  CRM_FIELDS,
  CRM_GEO,
  EMAIL_AT,
  EMAIL_OPEN_AT,
  ERROR_PASTE_AT,
  EXEC_START,
  INBOX_ENTER,
  INVOICE_ITEMS,
  INVOICE_SCHED,
  INVOICE_TAX,
  PROD01_CAM,
  PROD01_CAPTIONS,
  PROD01_COPY,
  PROD01_CURSOR,
  PROD01_SCHEDULE,
  PROD01_STEPS,
  PROGRAM_ENTER,
  REPLY,
  REPLY_AT,
  SEND_BTN,
  SENT_AT,
  SHEET_BASE,
  SHEET_COL_W,
  SHEET_WIDGET_W,
  PROD01_WRITES,
  UNDO_AT,
  WIN,
  WRONG_CELL,
  mmss,
  sheetCellRectLocal,
  stopwatchSeconds,
} from './prod01Script'

export { PROD01_DURATION } from './prod01Script'

/**
 * Prod01Programa — Acto 1, «el robot de carne blanda» (60s · 1920×1080).
 * ──────────────────────────────────────────────────────────────────────
 * An email asks for a quote; the owner already holds the 50-step program in
 * his head and runs it click by click across inbox, CRM and spreadsheet —
 * one paste lands in the wrong cell (Ctrl+Z), the stopwatch drags, the run
 * time-lapses through the middle, and a PDF finally materialises: 23:14 of
 * human brain for one presupuesto. All choreography lives in prod01Script.ts.
 */

const theme = lightTheme
const A = PROD01_SCHEDULE.activeAt

/** Snappier draw-in for windows the cursor uses moments later. */
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
    selectAt: EMAIL_OPEN_AT,
  },
  { channel: 'whatsapp', sender: 'Almacén Central', preview: 'El pedido 4471 está listo para envío.', time: '08:47', unread: true },
  { channel: 'email', sender: 'Gestoría Llopis', preview: 'Recordatorio: presentación del modelo 303 este mes.', time: '08:21' },
  { channel: 'web', sender: 'María Sanz', preview: 'Re: turnos de la semana que viene', time: 'ayer' },
]

export function Prod01Programa() {
  const frame = useCurrentFrame()
  const cam = driftedPose(cameraPose(PROD01_CAM, frame, CURVE.standard), frame)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, color: theme.textStrong, overflow: 'hidden' }}>
      <Fonts />

      {/* ── the desktop, shot through the virtual camera ── */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
        {/* Bandeja */}
        <div style={{ position: 'absolute', left: WIN.inbox.x, top: WIN.inbox.y, zIndex: 1 }}>
          <AppWindow title={`Bandeja · ${CAST.company}`} icon="bell" width={WIN.inbox.w} height={WIN.inbox.h} enter="draw" enterAt={INBOX_ENTER}>
            <Inbox title={PROD01_COPY.inboxTitle} items={INBOX_ROWS} width={WIN.inbox.w - 72} plate={false} />
          </AppWindow>
        </div>

        {/* CRM */}
        {frame >= A[8] && (
          <div style={{ position: 'absolute', left: WIN.crm.x, top: WIN.crm.y, zIndex: 2 }}>
            <AppWindow title={PROD01_COPY.crmTitle} icon="user" url="crm.comercialaster.es" width={WIN.crm.w} height={WIN.crm.h} enter="draw" enterAt={A[8]} timing={QUICK_WIN}>
              <CrmContent frame={frame} />
            </AppWindow>
          </div>
        )}

        {/* Plantilla (hoja de cálculo) */}
        {frame >= A[3] && (
          <div style={{ position: 'absolute', left: WIN.sheet.x, top: WIN.sheet.y, zIndex: 3 }}>
            <AppWindow title={PROD01_COPY.sheetTitle} icon="dialpad" width={WIN.sheet.w} height={WIN.sheet.h} enter="draw" enterAt={A[3]} timing={QUICK_WIN}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Spreadsheet
                  title={PROD01_COPY.sheetTitle}
                  base={SHEET_BASE}
                  writes={PROD01_WRITES}
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
                <ErrorBeat frame={frame} />
              </div>
            </AppWindow>
          </div>
        )}

        {/* El presupuesto (PDF) */}
        {frame >= A[41] && (
          <div style={{ position: 'absolute', left: WIN.invoice.x, top: WIN.invoice.y, zIndex: 4 }}>
            <AppWindow title={PROD01_COPY.pdfTitle} icon="check" width={WIN.invoice.w} height={WIN.invoice.h} enter="draw" enterAt={A[41]} timing={QUICK_WIN} accent={BRAND.green}>
              <Invoice
                number={PROD01_COPY.invoiceNumber}
                from={CAST.company}
                billTo={CAST.clientCompany}
                date={PROD01_COPY.invoiceDate}
                items={INVOICE_ITEMS}
                taxRate={INVOICE_TAX}
                status="draft"
                schedule={INVOICE_SCHED}
                width={WIN.invoice.w - 72}
                plate={false}
              />
            </AppWindow>
          </div>
        )}

        {/* El programa — the 50-step spine of the act */}
        <div style={{ position: 'absolute', left: WIN.panel.x, top: WIN.panel.y, zIndex: 2 }}>
          {frame >= PROGRAM_ENTER && (
            <ProgramRunner
              title={PROD01_COPY.programTitle}
              steps={PROD01_STEPS}
              schedule={PROD01_SCHEDULE}
              width={WIN.panel.w}
              height={WIN.panel.h}
              rowHeight={44}
              enterAt={PROGRAM_ENTER}
            />
          )}
        </div>

        {/* La respuesta — the closing «Enviar» */}
        {frame >= REPLY_AT && <ReplyChip frame={frame} />}

        <ScriptedCursor script={PROD01_CURSOR} />
      </div>

      {/* ── screen-space rotulación ── */}
      <Eyebrow frame={frame} />
      <Stopwatch frame={frame} />
      <Captions frame={frame} />
    </AbsoluteFill>
  )
}

/* ── CRM viewport: search → result → ficha with copy highlights ────────── */

function CrmContent({ frame }: { frame: number }) {
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 12 })
  const row = elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 14 })

  const queryIn = ease(frame, A[9] + 3, A[9] + 3 + DUR.base)
  const resultSel = ease(frame, A[10] + 3, A[10] + 11)
  const fichaIn = ease(frame, A[10] + 6, A[10] + 6 + DUR.reveal)

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

      {/* ficha */}
      <div style={{ position: 'absolute', left: 0, top: CRM_GEO.fieldsY, width: '100%', opacity: fichaIn, transform: `translateY(${(1 - fichaIn) * 10}px)` }}>
        {CRM_FIELDS.map((f, i) => {
          const copied = f.copiedAt != null ? ease(frame, f.copiedAt, f.copiedAt + 6) * (1 - ease(frame, f.copiedAt + 26, f.copiedAt + 38)) : 0
          return (
            <div key={f.label} style={{ height: CRM_GEO.fieldH, display: 'flex', alignItems: 'center', borderBottom: i < CRM_FIELDS.length - 1 ? `1px solid ${theme.gridLine}` : 'none' }}>
              <span style={{ width: CRM_GEO.valueX, fontSize: 12, letterSpacing: 0.4, color: theme.textMuted, textTransform: 'uppercase' }}>{f.label}</span>
              <span style={{ position: 'relative', fontWeight: 500, padding: '4px 10px', marginLeft: -10, borderRadius: 8, background: `rgba(36, 99, 235, ${0.12 * copied})` }}>
                {f.value}
                {copied > 0 && (
                  <span style={{ position: 'absolute', right: -78, top: 3, fontSize: 11.5, fontWeight: 600, color: KIT_BLUE, opacity: copied }}>
                    Copiado
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

/* ── the micro-error: red ring on the wrong cell + Ctrl-Z keycaps ──────── */

function ErrorBeat({ frame }: { frame: number }) {
  const cell = sheetCellRectLocal(WRONG_CELL[0], WRONG_CELL[1])
  const ringIn = ease(frame, ERROR_PASTE_AT + 4, ERROR_PASTE_AT + 12)
  const ringOut = ease(frame, UNDO_AT, UNDO_AT + 8)
  const ring = ringIn * (1 - ringOut)

  const chipIn = ease(frame, ERROR_PASTE_AT + 26, ERROR_PASTE_AT + 34)
  const chipOut = ease(frame, UNDO_AT + 8, UNDO_AT + 18)
  const chip = chipIn * (1 - chipOut)
  // the keys dip right as the undo lands
  const press = ease(frame, UNDO_AT - 5, UNDO_AT - 1) * (1 - ease(frame, UNDO_AT, UNDO_AT + 5))

  if (ring <= 0.001 && chip <= 0.001) return null

  const keycap: CSSProperties = {
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: theme.textStrong,
    transform: `translateY(${press * 2}px)`,
    ...elevation(theme, { depth: press > 0.5 ? 'recessed' : 'raised', distance: 3, blur: 6, radius: 8 }),
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: cell.x - 2,
          top: cell.y - 2,
          width: cell.w + 4,
          height: cell.h + 4,
          boxSizing: 'border-box',
          borderRadius: 5,
          border: `2px solid ${BRAND.red}`,
          background: `rgba(216, 64, 64, ${0.07 * ring})`,
          opacity: ring,
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: cell.x + 14,
          top: cell.y - 52,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          opacity: chip,
          transform: `translateY(${(1 - chipIn) * 8}px)`,
          zIndex: 2,
        }}
      >
        <span style={keycap}>Ctrl</span>
        <span style={keycap}>Z</span>
      </div>
    </>
  )
}

/* ── the reply chip — redactar · adjuntar · Enviar → Enviada ───────────── */

function ReplyChip({ frame }: { frame: number }) {
  const rise = ease(frame, REPLY_AT, REPLY_AT + DUR.reveal)
  const attachIn = ease(frame, ATTACH_AT, ATTACH_AT + DUR.base)
  const pressed = frame >= A[48] && frame < A[48] + CLICK_SETTLE
  const sent = ease(frame, SENT_AT + 1, SENT_AT + 9)

  const card = elevation(theme, { depth: 'raised', distance: 8, blur: 18, radius: 22 })

  return (
    <div
      style={{
        position: 'absolute',
        left: REPLY.x,
        top: REPLY.y,
        width: REPLY.w,
        height: REPLY.h,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 20px',
        zIndex: 5,
        opacity: rise,
        transform: `translateY(${(1 - rise) * 18}px)`,
        ...card,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Para: {PROD01_COPY.replyTo}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, whiteSpace: 'nowrap' }}>{PROD01_COPY.replySubject}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: theme.textMuted, opacity: attachIn }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.6 12.7 21a5.4 5.4 0 0 1-7.7-7.7l8.8-8.8a3.6 3.6 0 0 1 5.1 5.1l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9" />
          </svg>
          {PROD01_COPY.replyAttachment}
        </span>
      </div>
      <div
        style={{
          width: SEND_BTN.w,
          height: SEND_BTN.h,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 13.5,
          fontWeight: 600,
          color: sent > 0.5 ? BRAND.green : theme.textStrong,
          ...elevation(theme, {
            depth: pressed ? 'recessed' : 'raised',
            distance: pressed ? 3 : 5,
            blur: pressed ? 6 : 10,
            radius: 14,
          }),
        }}
      >
        {sent > 0.5 ? (
          <>
            <Icon name="check" size={15} color={BRAND.green} />
            {PROD01_COPY.sent}
          </>
        ) : (
          PROD01_COPY.send
        )}
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
      {PROD01_COPY.eyebrow}
    </div>
  )
}

/** El cronómetro que se arrastra — fixed top-right, frozen when «Enviar» lands. */
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
        <Icon name="clock" size={19} color={frozen ? KIT_BLUE : theme.textMuted} />
        <span style={{ fontSize: 30, fontWeight: 650, letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums', color: theme.textStrong }}>
          {mmss(stopwatchSeconds(frame))}
        </span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.6, color: theme.textMuted }}>EN LA TAREA</span>
    </div>
  )
}

function Captions({ frame }: { frame: number }) {
  return (
    <>
      {PROD01_CAPTIONS.map((c) => {
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
