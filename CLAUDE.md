# Project

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

## Specs

You can use `/spec study` to review existing systems before implementing.

## Generated Assets

When a scene, mockup or layout needs imagery that doesn't exist yet (photos,
illustrations, figures, product shots, hero banners, thumbnails, portraits,
textures), generate it with the **image-gen skill** (`/image-gen`) in a style
matched to the case — don't ship placeholders. Commit PNGs under
`public/<scene>/` and load them via `staticFile`. See `specs/generated-assets.md`.
