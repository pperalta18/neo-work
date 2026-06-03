import { forwardRef, type AnchorHTMLAttributes } from 'react'

/**
 * Link — a drop-in replacement for `next/link` in this Vite app.
 * Tailark Pro blocks are authored for Next.js and import `Link from 'next/link'`
 * with an `href` prop; this project has no router, so we render a plain anchor and
 * map `href` straight through. Keeps pulled blocks working with a one-line import
 * swap (next/link → @/components/ui/link) instead of editing every <Link>.
 */
export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, ...props }, ref) {
  return <a ref={ref} href={href} {...props} />
})

export default Link
