// In-page Rive capture driver. Loaded by index.html and processed by Vite, so
// the bare import of the low-level WASM runtime resolves from node_modules.
//
// Deterministic capture by absolute SEEK (not wall-clock advance):
//   riveLoad(bytes[], size)  -> load a .riv, return its animation count + names.
//   riveSelect(index)        -> build the artboard + a LinearAnimationInstance for
//                               that animation, binding the default view-model
//                               instance so the module's baked colours render.
//   riveSeekGrab(t)          -> set the animation to absolute time t, apply it,
//                               draw (Fit.contain, centred) on a transparent
//                               canvas, and return a PNG data URL.
//
// The renderer is canvas2d. Two hard-won details make it actually paint:
//   • r.resolveAnimationFrame() after the draw — the runtime batches the canvas2d
//     commands and this is what flushes them (without it the canvas stays blank).
//   • The lively animation lives in a SEPARATE timeline ("React") from the static
//     rest pose ("Start"); the capture script auto-detects the moving one.
import RiveCanvas from '@rive-app/canvas-advanced-single'

let R = null
let renderer = null
let canvas = null
let bytes = null
let size = 0
let cur = null // { file, artboard, anim, frame }

async function ready() {
  if (!R) R = await RiveCanvas()
  return R
}
window.__riveReady = ready().then(() => true)

function disposeCur() {
  if (!cur) return
  try { cur.anim.delete?.() } catch {}
  try { cur.artboard.delete?.() } catch {}
  try { cur.file.cleanup?.() } catch {}
  cur = null
}

window.riveLoad = async (bytesArr, sz) => {
  const r = await ready()
  size = sz
  canvas = document.getElementById('cv')
  canvas.width = size
  canvas.height = size
  if (!renderer) renderer = r.makeRenderer(canvas)
  bytes = new Uint8Array(bytesArr)

  const file = await r.load(bytes)
  const ab = file.defaultArtboard()
  let count = 0
  try { count = ab.animationCount() } catch {}
  const names = []
  for (let i = 0; i < count; i++) {
    try { names.push(ab.animationByIndex(i).name ?? null) } catch { names.push(null) }
  }
  try { ab.delete?.() } catch {}
  try { file.cleanup?.() } catch {}
  return { count, names }
}

window.riveSelect = async (animIndex) => {
  const r = await ready()
  disposeCur()
  const file = await r.load(bytes)
  const artboard = file.defaultArtboard()
  // bind the default view-model instance so baked colours render (mirrors Storybook)
  try {
    const vm = file.defaultArtboardViewModel(artboard)
    const vmi = vm.defaultInstance ? vm.defaultInstance() : vm.instance()
    if (vmi) artboard.bindViewModelInstance(vmi)
  } catch { /* no view model — baked colours render directly */ }
  const anim = new r.LinearAnimationInstance(artboard.animationByIndex(animIndex), artboard)
  cur = { file, artboard, anim, frame: { minX: 0, minY: 0, maxX: size, maxY: size } }
  return { ok: true }
}

window.riveSeekGrab = (t) => {
  const r = R
  const { artboard, anim, frame } = cur
  anim.time = t
  anim.apply(1.0)
  artboard.advance(0) // settle the object hierarchy at this time
  renderer.clear()
  renderer.save()
  renderer.align(r.Fit.contain, r.Alignment.center, frame, artboard.bounds)
  artboard.draw(renderer)
  renderer.restore()
  renderer.flush()
  r.resolveAnimationFrame() // flush the batched canvas2d commands to the canvas
  return canvas.toDataURL('image/png')
}
