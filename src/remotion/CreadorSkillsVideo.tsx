/**
 * CreadorSkillsVideo — «Creador de skills».
 * ──────────────────────────────────────────────────────────────────────────
 * Act 1: a chevron backbone descends THROUGH four un-numbered budget steps; the
 * head reaches the one-cell-tall **Creador de skills** plate (Skill-Forge Rive
 * logo, plays on touch); a big cell presses in beside it and the steps **paint
 * themselves in**, now numbered, under the label «Creador de presupuestos», each
 * lighting its left twin. Act 2: a beat later the camera **pans linearly right**
 * across the fleet of other skills the forge has already made.
 *
 * Every pixel is a pure function of frame (see {@link creadorSkillsScript}).
 */
import { type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CELL, PLATE_INSET, TEXT_FONT, KIT_BLUE, elevation } from '@/lib/neumorphism'
import { GridLines, theme } from './storeFlowScene'
import { Chevron } from '@/components/content'
import { Icon, type IconName } from '@/components/icons'
import { RiveClip } from './RiveClip'
import { Fonts } from './fonts'
import {
  ARROW_COL,
  CHEVRON_ROWS,
  CREADOR_COL0,
  CREADOR_COLSPAN,
  CREADOR_PLAY,
  CREADOR_ROW,
  CREADOR_ROWSPAN,
  DURATION,
  GRID_H,
  GRID_IN,
  GRID_W,
  HERO,
  SKILLS,
  STEP_COL0,
  STEP_COLSPAN,
  STEP_ROWS,
  type Skill,
  cameraPZ,
  cellGrow,
  clamp01,
  creadorGrow,
  leftStepGrow,
  paintedGrow,
  panelPress,
  panelRowSpan,
  stepRowAt,
  titleOpacity,
  twinLit,
  window01,
} from './creadorSkillsScript'

export const CREADOR_SKILLS_DURATION = DURATION

// ── colour mixing (base → KIT_BLUE as a row lights up) ──────────────────────────
function mixHex(a: string, b: string, t: number): string {
  const k = clamp01(t)
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * k)
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * k)
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * k)
  return `rgb(${r}, ${g}, ${bl})`
}

// ── a text-placeholder bar (skeleton line of length `len`; tints blue while lit) ──
function Bar({ len, lit, h }: { len: number; lit: number; h: number }) {
  return (
    <div style={{ flex: 1, height: h, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div
        style={{
          width: `${clamp01(len) * 100}%`,
          height: h,
          borderRadius: 999,
          background: mixHex('#c3cddb', KIT_BLUE, lit),
          boxShadow: `inset 0 1px 2px rgba(120, 140, 170, ${0.25 * (1 - clamp01(lit))})`,
        }}
      />
    </div>
  )
}

// ── a down-chevron node on the backbone ──────────────────────────────────────────
function ChevronPlate({ col, row, grow }: { col: number; row: number; grow: number }) {
  if (grow <= 0.001) return null
  const scale = 0.965 + 0.035 * grow
  const opacity = clamp01(grow * 1.6)
  const plate = elevation(theme, { depth: 'raised', distance: 7 * grow, blur: 14 * grow, radius: 18 })
  return (
    <div style={{ position: 'absolute', left: (col - 1) * CELL, top: (row - 1) * CELL, width: CELL, height: CELL }}>
      <div
        style={{
          position: 'absolute',
          inset: PLATE_INSET + 6,
          display: 'grid',
          placeItems: 'center',
          ...plate,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <Chevron dir="down" size={22} />
      </div>
    </div>
  )
}

// ── one step: [number] + icon + bar, on a raised plate ───────────────────────────
function StepPlate({
  col0,
  row,
  colSpan,
  grow,
  lit,
  n,
  icon,
  len,
  variant,
}: {
  col0: number
  row: number
  colSpan: number
  grow: number
  lit: number
  n?: number
  icon: IconName
  len: number
  variant: 'left' | 'panel'
}) {
  if (grow <= 0.001) return null
  const mini = variant === 'panel'
  const x = (col0 - 1) * CELL
  const y = (row - 1) * CELL
  const w = colSpan * CELL
  const scale = 0.965 + 0.035 * grow
  const opacity = clamp01(grow * 1.6)
  const radius = mini ? 16 : 20
  const inset = mini ? PLATE_INSET + 10 : PLATE_INSET
  const plate = elevation(theme, { depth: 'raised', distance: 7 * grow, blur: 15 * grow, radius })

  const accent = mixHex(theme.textStrong, KIT_BLUE, lit)
  const numColor = mixHex(theme.textMuted, KIT_BLUE, lit)
  const ring = lit > 0.001 ? `, inset 0 0 0 ${1.1 * lit}px ${KIT_BLUE}` : ''
  const glow = lit > 0.001 ? `, 0 0 ${12 * lit}px ${KIT_BLUE}22` : ''

  const numSize = mini ? 16 : 20
  const iconSize = mini ? 22 : 28
  const barH = mini ? 9 : 12

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: CELL }}>
      {/* left steps erase internal hairlines; panel cards nest in the recess */}
      {variant === 'left' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.surface,
            boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
            opacity: clamp01(grow * 1.8),
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset,
          display: 'flex',
          alignItems: 'center',
          gap: mini ? 12 : 14,
          padding: mini ? '0 16px' : '0 20px',
          fontFamily: TEXT_FONT,
          ...plate,
          boxShadow: `${plate.boxShadow}${ring}${glow}`,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {n != null ? (
          <span
            style={{
              width: numSize * 1.1,
              flexShrink: 0,
              textAlign: 'center',
              fontSize: numSize,
              fontWeight: 600,
              letterSpacing: -0.4,
              color: numColor,
            }}
          >
            {n}
          </span>
        ) : null}
        <span style={{ flexShrink: 0, display: 'flex' }}>
          <Icon name={icon} size={iconSize} color={accent} strokeWidth={1.7} />
        </span>
        <Bar len={len} lit={lit} h={barH} />
      </div>
    </div>
  )
}

// ── the «Creador de skills» plate — ONE cell tall ────────────────────────────────
function CreadorPlate({ grow }: { grow: number }) {
  if (grow <= 0.001) return null
  const x = (CREADOR_COL0 - 1) * CELL
  const y = (CREADOR_ROW - 1) * CELL
  const w = CREADOR_COLSPAN * CELL
  const h = CREADOR_ROWSPAN * CELL
  const scale = 0.965 + 0.035 * grow
  const opacity = clamp01(grow * 1.6)
  const plate = elevation(theme, { depth: 'raised', distance: 8 * grow, blur: 16 * grow, radius: 20 })
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.surface,
          boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
          opacity: clamp01(grow * 1.8),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: PLATE_INSET,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          ...plate,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <RiveClip module="forge" size={50} startAt={CREADOR_PLAY} />
        <span style={{ fontFamily: TEXT_FONT, fontSize: 24, letterSpacing: -0.5, color: theme.textStrong }}>
          Creador de skills
        </span>
      </div>
    </div>
  )
}

// ── one big pressed cell (the recess that holds a skill's steps) ──────────────────
function PressedPanel({
  col0,
  span,
  rowSpan,
  press,
}: {
  col0: number
  span: number
  rowSpan: number
  press: number
}) {
  if (press <= 0.001) return null
  const d = 3 + 20 * press
  const b = 10 + 40 * press
  const boxShadow = `inset ${-d}px ${-d}px ${b}px ${theme.shadow}, inset ${d}px ${d}px ${b}px ${theme.highlight}`
  return (
    <div
      style={{
        position: 'absolute',
        left: (col0 - 1) * CELL,
        top: (2 - 1) * CELL,
        width: span * CELL,
        height: rowSpan * CELL,
        borderRadius: 26,
        background: `rgba(201, 215, 232, ${0.18 * press})`,
        boxShadow,
        opacity: clamp01(press * 2),
      }}
    />
  )
}

// ── a labelled skill: title + pressed panel + numbered steps inside ──────────────
function SkillCard({
  skill,
  getGrow,
  getLit,
  press,
  titleOp,
}: {
  skill: Skill
  getGrow: (i: number) => number
  getLit: (i: number) => number
  press: number
  titleOp: number
}) {
  const rowSpan = panelRowSpan(skill.steps.length)
  return (
    <>
      {/* label above the process */}
      <div
        style={{
          position: 'absolute',
          left: (skill.col0 - 1) * CELL + 6,
          top: 0,
          height: CELL,
          display: 'flex',
          alignItems: 'center',
          opacity: titleOp,
          fontFamily: TEXT_FONT,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: -0.5, color: theme.textStrong }}>
          {skill.title}
        </span>
      </div>
      <PressedPanel col0={skill.col0} span={skill.span} rowSpan={rowSpan} press={press} />
      {skill.steps.map((s, i) => (
        <StepPlate
          key={i}
          col0={skill.col0}
          row={stepRowAt(i)}
          colSpan={skill.span}
          grow={getGrow(i)}
          lit={getLit(i)}
          n={i + 1}
          icon={s.icon}
          len={s.len}
          variant="panel"
        />
      ))}
    </>
  )
}

export function CreadorSkillsVideo() {
  const frame = useCurrentFrame()

  const { P, Z } = cameraPZ(frame)
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${1920 / 2 - P[0] * Z}px, ${1080 / 2 - P[1] * Z}px) scale(${Z})`,
  }
  const gridIn = window01(frame, GRID_IN[0], GRID_IN[1])

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, overflow: 'hidden' }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: GRID_W, height: GRID_H, opacity: gridIn }}>
            <GridLines />

            {/* ── Act 1, left: the manual process executed by the descending arrow ── */}
            {CHEVRON_ROWS.map((row) => (
              <ChevronPlate key={`chev-${row}`} col={ARROW_COL} row={row} grow={cellGrow(frame, row)} />
            ))}
            {HERO.steps.map((s, i) => (
              <StepPlate
                key={`left-${i}`}
                col0={STEP_COL0}
                row={STEP_ROWS[i]}
                colSpan={STEP_COLSPAN}
                grow={leftStepGrow(frame, i)}
                lit={twinLit(frame, i)}
                icon={s.icon}
                len={s.len}
                variant="left"
              />
            ))}
            <CreadorPlate grow={creadorGrow(frame)} />

            {/* ── the hero skill being forged (animated) ── */}
            <SkillCard
              skill={HERO}
              getGrow={(i) => paintedGrow(frame, i)}
              getLit={(i) => twinLit(frame, i)}
              press={panelPress(frame)}
              titleOp={titleOpacity(frame)}
            />

            {/* ── Act 2, the fleet of skills already created (static, revealed by the pan) ── */}
            {SKILLS.slice(1).map((skill, i) => (
              <SkillCard
                key={`fleet-${i}`}
                skill={skill}
                getGrow={() => 1}
                getLit={() => 0}
                press={1}
                titleOp={1}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
