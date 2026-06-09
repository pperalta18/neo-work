/**
 * StoreCreateScene — acto 5 (cierre) de la mini-película E-Commerce.
 * ──────────────────────────────────────────────────────────────────────────
 * "Crea una web sencilla para vender tus productos, conectada a tu inventario".
 * El clímax: **Forge** monta la tienda **AURELE** delante de tus ojos. Reutiliza
 * {@link StoreBuildVideo} — la web que se construye sola en un navegador
 * (chrome + nav → hero → titulares → productos → categorías) — pero
 * TIME-REMAPEADA: comprime su construcción de ~17 s a ~5,5 s para que toda la
 * web aparezca, terminada, en un solo acto. Sobre ella, un chip discreto
 * "Creada con Forge" como sello del módulo que la levanta.
 *
 * Todo derivado de `useCurrentFrame()` (la web es función pura de su frame de
 * contenido; el chip, del frame local): determinista frame a frame.
 */

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { TEXT_FONT, lightTheme } from '@/lib/neumorphism'
import { MODULES } from '@/stories/neo/modules/modules'
import { StoreBuildVideo, STORE_GEO } from './StoreBuildVideo'
import { Fonts } from './fonts'

export const STORE_CREATE_DURATION = 165 // ~5,5 s @ 30 fps

// La web de StoreBuild se renderiza a tamaño completo (1920×1080) con su ventana
// casi a sangre. Aquí la encogemos a un viewport "de tarjeta" — equiparable a los
// demás elementos de la película — y la dejamos centrada en el lienzo.
const STORE_SCALE = 0.66
const STORE_LIFT = 0 // px; 0 = ventana centrada verticalmente

// Borde superior de la ventana escalada, en coordenadas de pantalla — ancla el
// chip "Creada con Forge" justo sobre la tienda.
const WIN_TOP =
  STORE_GEO.H / 2 + STORE_LIFT - (STORE_GEO.H / 2) * STORE_SCALE + STORE_GEO.WIN_Y * STORE_SCALE

// Aire entre la base del chip y el borde superior de la ventana.
const CHIP_GAP = 16

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

// Reveals snap (easeOutExpo); camera scrolls glide (easeInOutQuint).
const EXPO = Easing.bezier(0.16, 1, 0.3, 1)
const QUINT = Easing.bezier(0.83, 0, 0.17, 1)

// Remap del frame local (0…STORE_CREATE_DURATION) al frame de contenido de
// StoreBuild (0…516). Cada hito recibe su tramo para que la construcción se lea
// (saltamos el loader vacío rápido y damos aire a hero / titular / productos).
const KF: Array<[number, number, (t: number) => number]> = [
  [0, 0, EXPO], //     arranque
  [10, 122, EXPO], //  chrome + nav entran de golpe (saltamos el loader vacío)
  [40, 250, QUINT], // hero denoise + "TIMELESS / BY DESIGN"
  [70, 330, QUINT], // párrafo + "SHOP THE COLLECTION"
  [105, 470, EXPO], // scroll → New Arrivals + fichas de producto
  [135, 516, QUINT], // banners de categoría + settle (montada)
]

/** Mapea un frame local al frame de contenido de StoreBuild. */
function storeFrameAt(local: number): number {
  if (local <= 0) return 0
  for (let i = 0; i < KF.length - 1; i++) {
    const [a, av, ease] = KF[i]
    const [b, bv] = KF[i + 1]
    if (local < b) {
      const p = clamp01((local - a) / (b - a))
      return av + (bv - av) * ease(p)
    }
  }
  return 516
}

export function StoreCreateScene() {
  const frame = useCurrentFrame()
  const storeFrame = storeFrameAt(frame)
  const chipIn = interpolate(frame, [2, 14], [0, 1], clamp)

  return (
    <AbsoluteFill style={{ backgroundColor: lightTheme.surface }}>
      <Fonts />

      {/* La tienda, encogida a un viewport tipo tarjeta y centrada sobre el lienzo. */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: STORE_GEO.W,
            height: STORE_GEO.H,
            position: 'relative',
            flexShrink: 0,
            transform: `translateY(${STORE_LIFT}px) scale(${STORE_SCALE})`,
          }}
        >
          <StoreBuildVideo frameOverride={storeFrame} transparent />
        </div>
      </AbsoluteFill>

      {/* Sello del módulo: "Creada con Forge", flotando sobre la web. */}
      <div
        style={{
          position: 'absolute',
          top: WIN_TOP - CHIP_GAP,
          left: '50%',
          // translateY(-100%) ancla el chip por su BASE en (WIN_TOP − CHIP_GAP),
          // así flota justo sobre la ventana sin solaparla, sea cual sea su alto.
          transform: `translateX(-50%) translateY(calc(-100% - ${(1 - chipIn) * 10}px))`,
          opacity: chipIn,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 18px 10px 12px',
          borderRadius: 999,
          background: '#ffffff',
          boxShadow: '0 8px 24px rgba(40,36,30,0.18), 0 1px 3px rgba(40,36,30,0.12)',
          fontFamily: TEXT_FONT,
          zIndex: 10,
        }}
      >
        <img src={MODULES.forge.icon} alt="Forge" width={26} height={26} style={{ display: 'block' }} />
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3, color: '#2a2722' }}>
          Creada con Forge
        </span>
      </div>
    </AbsoluteFill>
  )
}
