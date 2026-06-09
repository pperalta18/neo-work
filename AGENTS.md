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

## Operations Manual (animaciones / módulos)

Al **inicio de cada tarea** de animaciones de la landing o de módulos AiKit, carga
primero **`specs/operations-manual.md`**: es el estado compartido (registro de los
16 módulos con su icono SVG + animación Rive, arquitectura de assets y checklist
para añadir un módulo) junto a `specs/flow-blueprints.md` (recetas de cada flujo).
**Mantenlos vivos**: al añadir un módulo se añade su **icono y su `.riv`**; al
iterar un flujo, actualiza el blueprint.

## Generated Assets

When a scene, mockup or layout needs imagery that doesn't exist yet (photos,
illustrations, figures, product shots, hero banners, thumbnails, portraits,
textures), generate it with the **image-gen skill** (`/image-gen`) in a style
matched to the case — don't ship placeholders. Commit PNGs under
`public/<scene>/` and load them via `staticFile`. See `specs/generated-assets.md`.
