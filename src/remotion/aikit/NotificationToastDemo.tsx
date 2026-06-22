import { AbsoluteFill } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from '../fonts'
import { ToastStack } from './NotificationToast'
import { type ToastSpec, toastCascade, toastStackDuration, validateToastScript } from './toastScript'
import { CAST } from './cast'

/** TEMP — visual smoke check for NotificationToast; not part of the event deck.
 * Rehearses the Prod04 beat: one notification lands, a cascade piles on top
 * (older ones sliding down), the first one leaves (stack eases back up), and
 * the system's proposal closes. */
const MAIN: ToastSpec[] = [
  {
    variant: 'success',
    title: 'Proceso adaptado',
    message: `${CAST.manolo} ha adaptado tu proceso de almacén.`,
    time: '9:14',
    showAt: 10,
    hideAt: 215,
  },
  ...toastCascade(
    [
      {
        variant: 'info',
        title: 'Nueva app conectada',
        message: `${CAST.laura} ha publicado Predicción de stock.`,
        time: '9:15',
      },
      {
        variant: 'success',
        title: 'Autocompra activada',
        message: `${CAST.pedro} ha automatizado los pedidos.`,
        time: '9:15',
      },
      {
        variant: 'warning',
        title: 'Stock bajo detectado',
        message: 'La predicción avisa: reponer la referencia A-12.',
        time: '9:16',
      },
    ],
    { startAt: 70, stagger: 28 },
  ),
  {
    variant: 'info',
    title: 'Propuesta del sistema',
    message: 'Proceso nuevo: conectar negociación y autocompra. ¿Lo activo?',
    time: 'ahora',
    showAt: 265,
  },
]

/** A second, bottom-anchored stack to smoke direction='up' + the error rail. */
const SIDE: ToastSpec[] = [
  {
    variant: 'error',
    title: 'Paso 23 falló',
    message: 'Reintentado automáticamente. Resuelto.',
    time: '9:14',
    showAt: 120,
    hideAt: 240,
  },
  {
    variant: 'success',
    title: 'Reintento completado',
    time: '9:14',
    showAt: 160,
  },
]

const issues = [...validateToastScript(MAIN), ...validateToastScript(SIDE)]
if (issues.length > 0) {
  throw new Error(`NotificationToastDemo script invalid:\n${issues.join('\n')}`)
}

export const NOTIFICATION_TOAST_DEMO_DURATION = Math.max(
  toastStackDuration(MAIN),
  toastStackDuration(SIDE),
)

export function NotificationToastDemo() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: lightTheme.surface,
        fontFamily: BODY_FONT,
      }}
    >
      <Fonts />
      {/* The notification anchor: top-right, new toasts push older ones down. */}
      <ToastStack script={MAIN} style={{ position: 'absolute', top: 90, right: 120 }} />
      {/* Bottom-left corner: anchored bottom, stack grows upward. */}
      <ToastStack
        script={SIDE}
        direction="up"
        width={300}
        toastHeight={84}
        style={{ position: 'absolute', bottom: 90, left: 120 }}
      />
    </AbsoluteFill>
  )
}
