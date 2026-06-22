/**
 * TituloCard — a single full-screen kinetic title on the showcase white ground.
 * ──────────────────────────────────────────────────────────────────────────
 * Picks a technique from the text-showcase registry by index (Pablo's 1-based
 * numbering minus 1) and renders one word. Used both as standalone title
 * compositions («Controla» #1, «Delega» #4, «Construye» #9) and inside the
 * ProdControla master.
 */
import { TEXT_ANIMS } from './textAnimations'

export type TituloCardProps = {
  /** Index into TEXT_ANIMS (0-based): #1 camera-pan = 0, #4 word-rise = 3, #9 split-flap = 8. */
  animIndex: number
  text: string
}

export const TituloCard: React.FC<TituloCardProps> = ({ animIndex, text }) => {
  const Comp = (TEXT_ANIMS[animIndex] ?? TEXT_ANIMS[0]).Component
  return <Comp text={text} />
}

/** Default props + a sensible hold per title, for the standalone compositions. */
export const TITULO_CONTROLA = { animIndex: 0, text: 'Controla' } satisfies TituloCardProps
export const TITULO_DELEGA = { animIndex: 3, text: 'Delega' } satisfies TituloCardProps
export const TITULO_CONSTRUYE = { animIndex: 8, text: 'Construye' } satisfies TituloCardProps

export const TITULO_CONTROLA_DURATION = 110
export const TITULO_DELEGA_DURATION = 54
export const TITULO_CONSTRUYE_DURATION = 80
