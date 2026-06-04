/**
 * DocumentXlxIllustration — Tailark Pro `document-xlx`, re-tinted to our palette.
 * ──────────────────────────────────────────────────────────────────────────────
 * Pulled with `npx shadcn add @tailark-pro/document-xlx`, then recoloured: the
 * extension badge + spreadsheet header row use our brand green (#2ada56) instead
 * of Tailark's emerald.
 *
 * NOTE: this is the Tailwind/class-based variant for the app + Storybook. The
 * Remotion graph never imports Tailwind (see tailwind.config.ts), so the video
 * uses an inline-styled port of this same illustration (XlsIllustration in
 * StoreInventoryVideo) — keep the two in sync.
 */
export const DocumentXlxIllustration = () => {
    return (
        <div aria-hidden className="relative size-fit">
            <div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-[#2ada56] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-[#0b7a23]/30 after:absolute after:inset-0 after:rounded after:border">
                XLS
            </div>
            <div className="bg-illustration ring-border-illustration z-1 shadow-black/6.5 relative w-16 space-y-2 rounded-md rounded-tr-[28%] p-2 shadow-md ring-1">
                <div className="border-foreground/10 grid grid-cols-3 gap-px overflow-hidden rounded-sm rounded-tr-[40%]">
                    <div className="col-span-3 grid grid-cols-3 gap-px">
                        <div className="h-2 bg-[#2ada56]/85" />
                        <div className="h-2 bg-[#2ada56]/85" />
                        <div className="h-2 bg-[#2ada56]/85" />
                    </div>
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="bg-foreground/5 h-2" />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DocumentXlxIllustration
