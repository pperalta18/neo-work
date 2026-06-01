import { useEffect, useRef, useState, type ReactNode } from 'react'
import Lottie from 'lottie-react'

export type CursorState = 'arrow' | 'hand' | 'text' | 'grab' | 'grabbing'

/**
 * Lottie assets for the cursor. Any provided state replaces its SVG glyph with
 * the animation (drop a LottieFiles cursor pack here); `click` is a one-shot
 * effect played on every click. Lottie JSON objects are `unknown` to avoid a
 * hard schema dependency.
 */
export type CursorLottie = Partial<Record<CursorState, unknown>> & { click?: unknown }

export type CursorProps = {
  /** Pixel size of the cursor (height of the arrow). */
  size?: number
  /** Follow the real mouse (default). Set false + `at` to drive it for video. */
  followMouse?: boolean
  /** Controlled position (relative to the area), for scripted motion. */
  at?: { x: number; y: number }
  /** Force a state; otherwise it is derived from what's hovered. */
  state?: CursorState
  /** Trigger the click ripple (toggling true→false plays it). */
  clicking?: boolean
  /** 0–1 lerp toward the target. 1 = instant (default), lower = smooth drag. */
  stiffness?: number
  /** Optional Lottie assets per state (+ click). Falls back to SVG glyphs. */
  lottie?: CursorLottie
  /** Where a Lottie glyph's hotspot sits (SVG glyphs handle this themselves). */
  lottieAnchor?: 'center' | 'topleft'
  /** The interactive surface. */
  children?: ReactNode
}

type Pt = { x: number; y: number }

/**
 * Cursor — a realistic on-screen pointer for demo videos.
 * ────────────────────────────────────────────────────────
 * Renders an OS-style arrow that becomes a pointing hand over links / elements
 * marked data-cursor="hand" (or "text"/"grab"), with a click ripple. Drive it
 * from the real mouse, or controlled via `at` + `state` + `clicking` to script a
 * recording. The native cursor is hidden inside its area.
 */
export function Cursor({
  size = 26,
  followMouse = true,
  at,
  state,
  clicking = false,
  stiffness = 1,
  lottie,
  lottieAnchor = 'center',
  children,
}: CursorProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const target = useRef<Pt>({ x: -100, y: -100 })
  const pos = useRef<Pt>({ x: -100, y: -100 })
  const inside = useRef(false)

  const [hoverState, setHoverState] = useState<CursorState>('arrow')
  const [pressed, setPressed] = useState(false)
  const [visible, setVisible] = useState(!followMouse)
  const [ripple, setRipple] = useState(0)

  const resolved: CursorState = state ?? (pressed && hoverState === 'grab' ? 'grabbing' : hoverState)

  // Controlled position (for scripted video).
  useEffect(() => {
    if (at) {
      target.current = at
      setVisible(true)
    }
  }, [at])

  // Controlled click → play ripple.
  useEffect(() => {
    if (clicking) setRipple((n) => n + 1)
  }, [clicking])

  useEffect(() => {
    const area = areaRef.current
    if (!area) return

    const onMove = (e: MouseEvent) => {
      if (!followMouse) return
      const r = area.getBoundingClientRect()
      target.current = { x: e.clientX - r.left, y: e.clientY - r.top }
      if (!inside.current) {
        inside.current = true
        setVisible(true)
        if (stiffness >= 1) pos.current = { ...target.current }
      }
    }
    const onLeave = () => {
      if (!followMouse) return
      inside.current = false
      setVisible(false)
    }
    const onDown = () => {
      setPressed(true)
      setRipple((n) => n + 1)
    }
    const onUp = () => setPressed(false)
    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest('[data-cursor]')
      const v = el?.getAttribute('data-cursor')
      setHoverState(
        v === 'hand' || v === 'text' || v === 'grab' ? (v as CursorState) : 'arrow',
      )
    }

    if (followMouse) {
      area.addEventListener('mousemove', onMove)
      area.addEventListener('mouseleave', onLeave)
      area.addEventListener('mouseover', onOver)
    }
    area.addEventListener('mousedown', onDown)
    area.addEventListener('mouseup', onUp)

    let raf = 0
    const tick = () => {
      const t = target.current
      const p = pos.current
      if (stiffness >= 1) {
        p.x = t.x
        p.y = t.y
      } else {
        p.x += (t.x - p.x) * stiffness
        p.y += (t.y - p.y) * stiffness
      }
      if (cursorRef.current) {
        const press = pressed ? 0.88 : 1
        cursorRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${press})`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      area.removeEventListener('mousemove', onMove)
      area.removeEventListener('mouseleave', onLeave)
      area.removeEventListener('mouseover', onOver)
      area.removeEventListener('mousedown', onDown)
      area.removeEventListener('mouseup', onUp)
    }
  }, [followMouse, stiffness, pressed])

  return (
    <div
      ref={areaRef}
      style={{
        position: 'relative',
        cursor: 'none',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
      <div
        ref={cursorRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
          willChange: 'transform',
          zIndex: 9999,
        }}
      >
        <CursorGlyph state={resolved} size={size} lottie={lottie} anchor={lottieAnchor} />
        {/* Click effect: a Lottie one-shot if provided, else the CSS ripple. */}
        {lottie?.click ? (
          ripple > 0 && (
            <div
              key={ripple}
              style={{ position: 'absolute', top: 0, left: 0, transform: 'translate(-50%, -50%)' }}
            >
              <Lottie
                animationData={lottie.click as object}
                loop={false}
                autoplay
                style={{ width: size * 2.4, height: size * 2.4 }}
              />
            </div>
          )
        ) : (
          <Ripple key={ripple} active={ripple > 0} />
        )}
      </div>
    </div>
  )
}

/** The drawn pointer for each state. Hotspot sits at the SVG's (0,0). */
function CursorGlyph({
  state,
  size,
  lottie,
  anchor = 'center',
}: {
  state: CursorState
  size: number
  lottie?: CursorLottie
  anchor?: 'center' | 'topleft'
}) {
  // A Lottie asset for this state wins over the SVG glyph.
  const asset = lottie?.[state]
  if (asset) {
    const h = size * 1.6
    return (
      <div
        style={{
          transform: anchor === 'center' ? 'translate(-50%, -50%)' : 'none',
        }}
      >
        <Lottie animationData={asset as object} loop autoplay style={{ width: h, height: h }} />
      </div>
    )
  }

  if (state === 'text') {
    const h = size
    return (
      <svg width={h * 0.5} height={h} viewBox="0 0 12 24" style={{ transform: 'translate(-50%, -50%)' }}>
        <path
          d="M6 2v20M3 2h6M3 22h6"
          stroke="#1e1e20"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M6 2v20M3 2h6M3 22h6" stroke="#fff" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      </svg>
    )
  }

  if (state === 'hand' || state === 'grab' || state === 'grabbing') {
    const grabbing = state === 'grabbing'
    // viewBox 0 0 28 36, fingertip hotspot ~ (11.8, 1).
    const fingers = grabbing
      ? // fist: fingers folded down
        [
          <rect key="i" x={10} y={9} width={3.6} height={11} rx={1.8} />,
          <rect key="m" x={14.2} y={8} width={3.6} height={12} rx={1.8} />,
          <rect key="r" x={18.4} y={8.5} width={3.6} height={11} rx={1.8} />,
          <rect key="p" x={22.4} y={10.5} width={3.4} height={9} rx={1.7} />,
        ]
      : [
          <rect key="i" x={10} y={1} width={3.6} height={19} rx={1.8} />,
          <rect key="m" x={14.2} y={6.5} width={3.6} height={13} rx={1.8} />,
          <rect key="r" x={18.4} y={8.5} width={3.6} height={11} rx={1.8} />,
          <rect key="p" x={22.4} y={10.5} width={3.4} height={9} rx={1.7} />,
        ]
    const shapes = (
      <>
        {fingers}
        <rect x={8} y={14} width={17} height={16} rx={7} />
        <rect x={5} y={15} width={3.8} height={10} rx={1.9} transform="rotate(-30 6.9 20)" />
      </>
    )
    const h = size * 1.35
    return (
      <svg
        width={(h * 28) / 36}
        height={h}
        viewBox="0 0 28 36"
        style={{ transform: `translate(${(-11.8 / 28) * 100}%, ${(-1 / 36) * 100}%)` }}
      >
        {/* dark outline via thick stroke behind */}
        <g fill="#1e1e20" stroke="#1e1e20" strokeWidth={3} strokeLinejoin="round">
          {shapes}
        </g>
        {/* white fill on top */}
        <g fill="#fff" stroke="none">
          {shapes}
        </g>
      </svg>
    )
  }

  // arrow (default). Hotspot at the tip (3, 2).
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: 'translate(-12.5%, -8.3%)' }}>
      <path
        d="M3 2 L3 18.2 L7.2 14.2 L10 20.4 L12.7 19.2 L9.9 13.1 L15.4 13.1 Z"
        fill="#fff"
        stroke="#1e1e20"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Ripple({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: 2,
        width: 14,
        height: 14,
        marginTop: -7,
        marginLeft: -7,
        borderRadius: '50%',
        border: '2px solid rgba(0,112,249,0.7)',
        animation: 'neo-cursor-ripple 0.45s ease-out forwards',
      }}
    >
      <style>{`@keyframes neo-cursor-ripple{0%{transform:scale(0.3);opacity:0.9}100%{transform:scale(2.6);opacity:0}}`}</style>
    </span>
  )
}
