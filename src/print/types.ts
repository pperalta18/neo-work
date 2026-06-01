import type { ReactNode } from 'react'
import type { PrintGeometry } from './geometry'

/**
 * Print document model
 * ────────────────────
 * A print is a JSON spec (`public/prints/<id>/doc.json`) + a React page component
 * registered under `pageComponentId`. The spec is the single source of truth for
 * both the on-screen preview and the print canvas: dimensions (mm), bleed, DPI and
 * colour all live here, so the same doc renders identically in the app and in the
 * deterministic Remotion `renderStill` export. See `specs/print-generator.md`.
 */

export type PrintTheme = 'light' | 'dark'
export type PrintColorMode = 'cmyk' | 'rgb'
/** PDF/X conformance level. X-1a = max compatibility (PDF 1.3); X-4 = modern. */
export type PdfxVariant = 'x1a' | 'x4'

export type PrintDimensions = {
  /** Finished (cut) width in millimetres. */
  trimWidthMm: number
  /** Finished (cut) height in millimetres. */
  trimHeightMm: number
  /** Bleed on every side in mm — art extends this far past the trim. Default 0. */
  bleedMm: number
  /** Keep-clear margin inside the trim, in mm. Default 0. */
  safeMarginMm: number
  /** Draw printer's crop marks in the bleed area. Default false. */
  cropMarks: boolean
}

export type PrintColor = {
  mode: PrintColorMode
  /** Path to the ICC profile under `public/`, e.g. `icc/GenericCMYK.icc`. */
  iccProfile: string
  pdfxVariant: PdfxVariant
}

export type PrintDoc = {
  id: string
  title: string
  /** ISO timestamp. */
  createdAt: string
  /** Key into the page registry (`src/print/pages/index.ts`). */
  pageComponentId: string
  theme: PrintTheme
  dimensions: PrintDimensions
  /** Render resolution. Print floor + default is 300. */
  dpi: number
  color: PrintColor
  /** Page-specific data passed to the page component. Images referenced by path. */
  props?: Record<string, unknown>
}

/** Props every print page component receives. */
export type PrintPageProps = {
  doc: PrintDoc
  geo: PrintGeometry
}

export type PrintPageComponent = (props: PrintPageProps) => ReactNode

/** A lightweight row for the index view (`public/prints/index.json`). */
export type PrintIndexEntry = {
  id: string
  title: string
  thumb?: string
  dimensions: PrintDimensions
  dpi: number
  updatedAt: string
}
