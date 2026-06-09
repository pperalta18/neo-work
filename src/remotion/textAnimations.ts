/**
 * textAnimations.ts — the kinetic-typography registry
 * ──────────────────────────────────────────────────────────────────────────
 * The single ordered list of heading/title animation techniques. Two
 * compositions consume it:
 *   · TextReveal   — pick ONE technique (a Studio prop) to drop a title in a video.
 *   · TextShowcase — plays them all back-to-back as a "choose your animation" reel.
 *
 * Every entry is a self-contained, deterministic reveal that ENTERS then HOLDS.
 * The list order is the reel order — sequenced for rhythm (start cinematic,
 * vary the energy, close on data).
 */
import { type TextAnim } from './text/shared';

import { CameraPan } from './text/variants/camera-pan';
import { Simple } from './text/variants/simple';
import { FocusIn } from './text/variants/focus-in';
import { WordRise } from './text/variants/word-rise';
import { WordSequence } from './text/variants/word-sequence';
import { CharCascade } from './text/variants/char-cascade';
import { LineWipe } from './text/variants/line-wipe';
import { PerspectiveCards } from './text/variants/perspective-cards';
import { SplitFlap } from './text/variants/split-flap';
import { ScalePunch } from './text/variants/scale-punch';
import { LightSweep } from './text/variants/light-sweep';
import { LineStack } from './text/variants/line-stack';
import { Typewriter } from './text/variants/typewriter';
import { CounterStat } from './text/variants/counter-stat';
import { TopHeading } from './text/variants/top-heading';

export const TEXT_ANIMS: TextAnim[] = [
  { id: 'camera-pan', name: 'Cámara · Pan + Zoom', blurb: 'La cámara recorre el texto con mucho zoom', duration: 110, Component: CameraPan },
  { id: 'simple', name: 'Simple', blurb: 'Aparición limpia: fundido y subida sutil', duration: 78, Component: Simple },
  { id: 'focus-in', name: 'Rack focus', blurb: 'Entra desenfocado y enfoca al instante', duration: 80, Component: FocusIn },
  { id: 'word-rise', name: 'Palabras', blurb: 'Cada palabra sube tras una máscara', duration: 80, Component: WordRise },
  { id: 'word-sequence', name: 'Secuencia', blurb: 'Palabra a palabra en el centro; se lee por el ritmo', duration: 108, Component: WordSequence },
  { id: 'char-cascade', name: 'Letra a letra', blurb: 'Las letras caen y enfocan una a una', duration: 85, Component: CharCascade },
  { id: 'line-wipe', name: 'Cortinilla', blurb: 'Una barra de acento descubre el texto', duration: 80, Component: LineWipe },
  { id: 'perspective-cards', name: 'Flip 3D', blurb: 'Las palabras voltean en perspectiva', duration: 85, Component: PerspectiveCards },
  { id: 'split-flap', name: 'Persiana', blurb: 'Dos mitades encajan en una', duration: 80, Component: SplitFlap },
  { id: 'scale-punch', name: 'Impacto', blurb: 'Entra enorme y aterriza nítido', duration: 72, Component: ScalePunch },
  { id: 'light-sweep', name: 'Barrido de luz', blurb: 'Un brillo recorre el relleno', duration: 90, Component: LightSweep },
  { id: 'line-stack', name: 'Pila multilínea', blurb: 'Líneas que entran alternando lados', duration: 90, Component: LineStack },
  { id: 'typewriter', name: 'Máquina de escribir', blurb: 'Se teclea con cursor parpadeante', duration: 96, Component: Typewriter },
  { id: 'counter-stat', name: 'Contador', blurb: 'Una cifra sube y la etiqueta aparece', duration: 85, Component: CounterStat },
  { id: 'top-heading', name: 'Encabezado superior', blurb: 'Heading suave arriba; deja sitio para contenido debajo', duration: 96, Component: TopHeading },
];

export const TEXT_ANIM_IDS = TEXT_ANIMS.map((a) => a.id);

/** Look up a technique by id (falls back to the first one). */
export const getTextAnim = (id: string): TextAnim =>
  TEXT_ANIMS.find((a) => a.id === id) ?? TEXT_ANIMS[0];
