/**
 * ProdControla — AiKit Live · pista Producto · «Controla → Delega → Construye».
 * ──────────────────────────────────────────────────────────────────────────
 * The assembled master. Every beat is its OWN scene component (also registered
 * standalone in Root): titles (TituloCard), the data trio (ControlaDatos), the
 * módulos pan (ControlaModulos), the orange stack (DelegaModulos). Hard CUTS
 * between scenes; one wipe opens the «Controla» title.
 *
 *   1 · TEJIDO VIVO        — abre el vídeo.
 *   2 · TITULAR «Controla» — text-showcase #1 (Cámara · Pan + Zoom).
 *   3 · CONTROLA · DATOS   — Data Sweep · Data Field · Lectura Voraz, 2,25 s c/u.
 *   4 · CONTROLA · MÓDULOS — paneo horizontal de la flecha por los módulos azules
 *                            (label «Controla»); corta en s29.
 *   5 · TITULAR «Delega»   — text-showcase #4 (Palabras · Rise), breve.
 *   6 · REGISTRO INVENTARIO— hasta su s12.
 *   7 · DELEGA · MÓDULOS   — los 5 módulos naranja en stack, uno a uno.
 *   8 · TITULAR «Construye»— text-showcase #9 (Persiana · Split-flap).
 *   9 · SKILL FORGE.
 *  10 · PEDIDOS DASHBOARD  — hasta su s6,30.
 */
import { AbsoluteFill } from 'remotion'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { wipe } from '@remotion/transitions/wipe'

import { PALETTE } from './text/shared'
import { Fonts } from './fonts'

import { TejidoVivoVideo } from './TejidoVivoVideo'
import { TituloCard, TITULO_CONTROLA, TITULO_CONTROLA_DURATION, TITULO_DELEGA, TITULO_DELEGA_DURATION, TITULO_CONSTRUYE, TITULO_CONSTRUYE_DURATION } from './TituloCard'
import { ControlaDatosVideo, CONTROLA_DATOS_DURATION } from './ControlaDatosVideo'
import { ControlaModulosVideo } from './ControlaModulosVideo'
import { RegistroInventarioVideo } from './RegistroInventarioVideo'
import { DelegaModulosVideo, DELEGA_MODULOS_DURATION } from './DelegaModulosVideo'
import { SkillForgeVideo, SKILL_FORGE_DURATION_FRAMES } from './SkillForgeVideo'
import { PedidosDashboardVideo } from './PedidosDashboardVideo'

const FPS = 30
const secs = (s: number) => Math.round(s * FPS)

// ── beat lengths (frames @ 30 fps) — easy to tune ──────────────────────────────
const T_TEJIDO = 150 // 5 s slice of the living tissue (the opener)
const XF_OPEN = 16 // wipe: tejido → titular «Controla»
const T_CONTROLA = TITULO_CONTROLA_DURATION // 110
const T_DATOS = CONTROLA_DATOS_DURATION // 204 (3 × 2,25 s)
const MODULOS_CUT = secs(29) // the módulos pan cuts at the 0:29 mark (overall)
const T_DELEGA = TITULO_DELEGA_DURATION // 54
const T_REGISTRO = secs(12) // 360 — Registro Inventario up to its 0:12
const T_DELMOD = DELEGA_MODULOS_DURATION // the orange modules, one by one
const T_CONSTRUYE = TITULO_CONSTRUYE_DURATION // 80
const T_SKILLFORGE = SKILL_FORGE_DURATION_FRAMES // 530
const T_PEDIDOS = secs(6.3) // 189

// the módulos pan is TRIMMED so the cut lands exactly on 0:29 (overall timeline).
const START_MODULOS = T_TEJIDO - XF_OPEN + T_CONTROLA + T_DATOS // 448
const T_MODULOS = MODULOS_CUT - START_MODULOS // 422

export const PROD_CONTROLA_DURATION =
  START_MODULOS + T_MODULOS + T_DELEGA + T_REGISTRO + T_DELMOD + T_CONSTRUYE + T_SKILLFORGE + T_PEDIDOS

export function ProdControlaVideo() {
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.bg }}>
      <Fonts />
      <TransitionSeries>
        {/* 1 · TEJIDO VIVO */}
        <TransitionSeries.Sequence durationInFrames={T_TEJIDO}>
          <TejidoVivoVideo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-bottom' })}
          timing={linearTiming({ durationInFrames: XF_OPEN })}
        />

        {/* 2 · TITULAR «Controla» */}
        <TransitionSeries.Sequence durationInFrames={T_CONTROLA}>
          <TituloCard {...TITULO_CONTROLA} />
        </TransitionSeries.Sequence>

        {/* 3 · CONTROLA · DATOS */}
        <TransitionSeries.Sequence durationInFrames={T_DATOS}>
          <ControlaDatosVideo />
        </TransitionSeries.Sequence>

        {/* 4 · CONTROLA · MÓDULOS — paneo horizontal (corta en s29) */}
        <TransitionSeries.Sequence durationInFrames={T_MODULOS}>
          <ControlaModulosVideo />
        </TransitionSeries.Sequence>

        {/* 5 · TITULAR «Delega» */}
        <TransitionSeries.Sequence durationInFrames={T_DELEGA}>
          <TituloCard {...TITULO_DELEGA} />
        </TransitionSeries.Sequence>

        {/* 6 · REGISTRO INVENTARIO — hasta su 0:12 */}
        <TransitionSeries.Sequence durationInFrames={T_REGISTRO}>
          <RegistroInventarioVideo />
        </TransitionSeries.Sequence>

        {/* 7 · DELEGA · MÓDULOS — los 5 naranjas, uno a uno */}
        <TransitionSeries.Sequence durationInFrames={T_DELMOD}>
          <DelegaModulosVideo />
        </TransitionSeries.Sequence>

        {/* 8 · TITULAR «Construye» */}
        <TransitionSeries.Sequence durationInFrames={T_CONSTRUYE}>
          <TituloCard {...TITULO_CONSTRUYE} />
        </TransitionSeries.Sequence>

        {/* 9 · SKILL FORGE */}
        <TransitionSeries.Sequence durationInFrames={T_SKILLFORGE}>
          <SkillForgeVideo />
        </TransitionSeries.Sequence>

        {/* 10 · PEDIDOS DASHBOARD — hasta su 0:06,30 */}
        <TransitionSeries.Sequence durationInFrames={T_PEDIDOS}>
          <PedidosDashboardVideo />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  )
}
