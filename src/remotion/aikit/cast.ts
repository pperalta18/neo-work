/**
 * cast.ts — placeholder cast & shared business fiction for AiKit Live pieces.
 * ───────────────────────────────────────────────────────────────────────────
 * Every name on screen is a PLACEHOLDER (spec rule): final names land later by
 * editing this one file. Pieces must take people/company strings from here —
 * never inline a name — so the whole deck recasts in one edit.
 *
 * The fiction (consistent across all 13 pieces): a retail company. The owner
 * delegates a budget/inventory process to AiKit; it spreads through the org.
 */

export const CAST = {
  /** The protagonist — the human who runs the 50-step program in Prod01. */
  owner: 'Dani',
  /** Warehouse lead — first reproduction (Prod04 fase 1). */
  manolo: 'Manolo Barroso',
  /** Purchasing analyst — second generation (Prod04 fase 2). */
  laura: 'Laura Vidal',
  /** Local manager 4 — auto purchase orders (Prod04 fase 3). */
  pedro: 'Pedro Alonso',
  /** Direction — negotiation process (Prod04 fase 3). */
  ana: 'Ana Ferrer',
  /** Purchasing team — adapts Laura's app (Prod04 fase 3). */
  carlos: 'Carlos Gil',
  /** The client whose email kicks everything off. */
  clientCompany: 'Talleres Riera S.L.',
  clientContact: 'Lucía Riera',
  /** The company everyone works at. */
  company: 'Comercial Aster',
} as const

/** Initials for avatar chips, e.g. avatarInitials(CAST.manolo) → "MB". */
export function avatarInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
