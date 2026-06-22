import { AbsoluteFill } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from '../fonts'
import { CAST } from './cast'
import { Spreadsheet } from './Spreadsheet'
import { Inbox } from './Inbox'
import { CalendarMonth } from './CalendarMonth'
import { LineChart } from './LineChart'
import { StatTile } from './StatTile'
import { Invoice } from './Invoice'
import { invoiceSchedule, validateSheetWrites, writeCascade, type CellValue } from './widgetScript'

/** TEMP — visual smoke check for the six in-window widget ports; not part of
 * the event deck (Phase 4 retires it with the other demos). Rehearses each
 * port's real beat: the email arriving + click (Prod01), the paste-by-paste
 * spreadsheet (Prod01), the presupuesto materialising (Prod02), the 23 min →
 * 40 s comparison (Prod02), the Monday recurrence landing on the month
 * (Prod03) and la curva drawing itself (Yusta07). */

const SHEET_BASE: CellValue[][] = [
  ['Concepto', 'Uds', 'Precio'],
  ['Diseño estructura', 1, ''],
  ['Montaje', '', ''],
  ['Transporte', 1, 95],
  ['Acabados', '', ''],
]

const SHEET_WRITES = writeCascade(
  [
    { cell: [1, 2], value: 420 },
    { cell: [2, 1], value: 2 },
    { cell: [2, 2], value: 180 },
    { cell: [4, 1], value: 1 },
    { cell: [4, 2], value: 260 },
  ],
  { startAt: 40, stagger: 14 },
)

const sheetIssues = validateSheetWrites(SHEET_BASE, SHEET_WRITES)
if (sheetIssues.length > 0) {
  throw new Error(`WidgetKitDemo sheet writes invalid:\n${sheetIssues.join('\n')}`)
}

const INVOICE_SCHEDULE = invoiceSchedule(3, { enterAt: 50, lineStagger: 12, countFrames: 18 })

export const WIDGET_KIT_DEMO_DURATION = 210

export function WidgetKitDemo() {
  return (
    <AbsoluteFill style={{ backgroundColor: lightTheme.surface, fontFamily: BODY_FONT }}>
      <Fonts />

      {/* Col 1 — Prod01: the paste-by-paste spreadsheet + a metric tile. */}
      <Spreadsheet
        base={SHEET_BASE}
        writes={SHEET_WRITES}
        enterAt={5}
        style={{ position: 'absolute', left: 70, top: 70 }}
      />
      <StatTile
        label="Tiempo por presupuesto"
        value="23 min"
        delta={-4}
        deltaCaption="vs. el mes pasado"
        enterAt={20}
        revealAt={60}
        style={{ position: 'absolute', left: 70, top: 470 }}
      />

      {/* Col 2 — Prod01: the email arrives and is clicked; Prod02's contrast. */}
      <Inbox
        items={[
          {
            channel: 'email',
            sender: CAST.clientContact,
            preview: '¿Me pasáis presupuesto del pedido de junio?',
            time: 'ahora',
            unread: true,
            showAt: 20,
            selectAt: 90,
          },
          {
            channel: 'whatsapp',
            sender: 'Soporte Acme',
            preview: 'Reenvío la factura con el IVA corregido.',
            time: '18 min',
            unread: true,
          },
          {
            channel: 'chat',
            sender: 'Visitante #4821',
            preview: 'Hola, ¿esto lo hacéis vosotros o un robot?',
            time: '1 h',
          },
          {
            channel: 'web',
            sender: 'Formulario · Contacto',
            preview: 'Quiero automatizar la parte aburrida de mi tienda.',
            time: '3 h',
          },
        ]}
        enterAt={0}
        style={{ position: 'absolute', left: 570, top: 70 }}
      />
      <StatTile
        label="Tiempo de ejecución"
        before="23 min"
        after="40 s"
        delta={-97}
        accent="blue"
        enterAt={90}
        revealAt={120}
        style={{ position: 'absolute', left: 570, top: 500 }}
      />

      {/* Col 3 — Prod03: the Monday recurrence; Yusta07: la curva drawing. */}
      <CalendarMonth
        events={[1, 8, 15, 22, 29].map((date, i) => ({
          date,
          appearAt: 60 + i * 10,
        }))}
        today={17}
        enterAt={10}
        style={{ position: 'absolute', left: 1030, top: 70 }}
      />
      <LineChart
        data={[4200, 3850, 5100, 4700, 6250, 5900, 7400]}
        labels={['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul']}
        delta="+18,4%"
        drawAt={80}
        drawFrames={60}
        enterAt={30}
        style={{ position: 'absolute', left: 1030, top: 560 }}
      />

      {/* Col 4 — Prod02: the presupuesto materialising line by line. */}
      <Invoice
        from={CAST.company}
        billTo={CAST.clientCompany}
        number="PRE-0042"
        items={[
          { description: 'Diseño estructura', qty: 1, price: 420 },
          { description: 'Montaje', qty: 2, price: 180 },
          { description: 'Acabados', qty: 1, price: 260 },
        ]}
        schedule={INVOICE_SCHEDULE}
        style={{ position: 'absolute', left: 1490, top: 70 }}
      />
    </AbsoluteFill>
  )
}
