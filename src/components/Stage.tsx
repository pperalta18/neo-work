import { useLayoutEffect, useState, type ReactNode } from 'react'
import type { NeoTheme } from '@/lib/neumorphism'

const STAGE_W = 1920
const STAGE_H = 1080

/** Fixed 1920×1080 stage, scaled to fit the viewport, painted in the theme surface. */
export function Stage({ theme, children }: { theme: NeoTheme; children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const compute = () =>
      setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H))
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        backgroundColor: theme.surface,
      }}
    >
      <div
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          backgroundColor: theme.surface,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { STAGE_W, STAGE_H }
