/**
 * ControlaDatosVideo — «Controla · datos», the data-fragments beat.
 * ──────────────────────────────────────────────────────────────────────────
 * The three data scenes after «Controla», as ONE scene at hard cuts, 2,25 s each
 * (la IA leyendo todo): Data Sweep · Data Field · Lectura Voraz. The third starts
 * in its dense/frantic stretch (negative offset) so it lands «más poblado».
 */
import { AbsoluteFill, Sequence } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { DataSweepVideo } from './DataSweepVideo'
import { DataFieldVideo } from './DataFieldVideo'
import { LecturaVorazVideo } from './LecturaVorazVideo'

const FPS = 30
const T = Math.round(2.25 * FPS) // 68 — each fragment scene
const LECTURA_OFFSET = 250 // start Lectura Voraz in its dense stretch

export const CONTROLA_DATOS_DURATION = 3 * T

export const ControlaDatosVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: lightTheme.surface }}>
      <Sequence durationInFrames={T}>
        <DataSweepVideo />
      </Sequence>
      <Sequence from={T} durationInFrames={T}>
        <DataFieldVideo />
      </Sequence>
      <Sequence from={2 * T} durationInFrames={T}>
        {/* nested negative offset → Lectura Voraz plays from its dense frame ~250 */}
        <Sequence from={-LECTURA_OFFSET}>
          <LecturaVorazVideo />
        </Sequence>
      </Sequence>
    </AbsoluteFill>
  )
}
