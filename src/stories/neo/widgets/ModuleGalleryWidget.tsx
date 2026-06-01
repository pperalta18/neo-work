import { useState } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'
import { MODULES, MODULE_NAMES, type ModuleName, type ModuleSpec } from '../modules/modules.ts'

type Theme = ReturnType<typeof useNeoTheme>

/** The three pestañas, mapped from the module .group taxonomy. */
type Group = 'Controla' | 'Delega' | 'Construye'

const GROUPS: Group[] = ['Controla', 'Delega', 'Construye']

/** modules.ts .group → la pestaña que le toca. */
const GROUP_BY_TAB: Record<Group, 'data' | 'action' | 'orchestration'> = {
  Controla: 'data',
  Delega: 'action',
  Construye: 'orchestration',
}

/** Frase corta de cada pestaña — para el subtítulo. */
const TAB_BLURB: Record<Group, string> = {
  Controla: 'Tus datos, ordenaditos y a mano.',
  Delega: 'El curro de mierda, para nosotros.',
  Construye: 'Monta tu flujo sin pelearte con nadie.',
}

/**
 * Micro-caption por módulo. Tono desenfadado: esto es lo fácil, danos el
 * trabajo aburrido. Una línea, sin rollos.
 */
const CAPTIONS: Partial<Record<ModuleName, string>> = {
  hotpot: 'Junta todo en un sitio',
  sqlsense: 'Pregunta, sin saber SQL',
  udon: 'Conecta tus fuentes',
  sushimi: 'Trocea datos enormes',
  docusense: 'Entiende tus documentos',
  junction: 'Cruza tablas sin sudar',
  glimpse: 'Un vistazo y lo pillas',
  foresight: 'Te lo ve venir',
  actionRunner: 'Lanza tareas solo',
  actionScript: 'Automatiza lo pesado',
  teamwork: 'Reparte el marrón',
  feedbackLoop: 'Aprende sobre la marcha',
  heartbeat: 'Vigila que todo lata',
  smartProcess: 'Procesos que se montan solos',
  forge: 'Crea tus propias piezas',
  skillHub: 'Tus skills, todas juntas',
}

export type ModuleGalleryWidgetProps = {
  /** Pestaña abierta de salida. */
  defaultGroup?: Group
}

/**
 * ModuleGalleryWidget — el catálogo de módulos de AiKit, en pestañas.
 * ───────────────────────────────────────────────────────────────────
 * Un control segmentado recessed arriba (Controla / Delega / Construye) con la
 * pestaña activa como pill raised en KIT_BLUE; debajo, una rejilla de plaquitas
 * raised — el icono real del módulo + su nombre + una micro-frase. Cambiar de
 * pestaña intercambia la rejilla con un fundido suave. Re-iluminado en vivo por
 * el NeoTheme activo como el resto de la familia.
 */
export function ModuleGalleryWidget({
  defaultGroup = 'Controla',
}: ModuleGalleryWidgetProps) {
  const theme = useNeoTheme()
  const [active, setActive] = useState<Group>(defaultGroup)

  const track = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 16 })
  const pill = elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 12 })

  const targetGroup = GROUP_BY_TAB[active]
  const modules = MODULE_NAMES.filter((n) => MODULES[n].group === targetGroup)

  return (
    <NeoCard width={520} center={false} padding={24} radius={30} style={{ gap: 20 }}>
      <style>{`@keyframes neo-mgw-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* Header: títulos + subtítulo que sigue a la pestaña. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: 3, background: KIT_BLUE }} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2, color: theme.textStrong }}>
            El kit de AiKit
          </span>
        </div>
        <span style={{ fontSize: 12.5, color: theme.textMuted, letterSpacing: -0.2, paddingLeft: 19 }}>
          {TAB_BLURB[active]}
        </span>
      </div>

      {/* Control segmentado recessed: la pestaña activa es un pill raised. */}
      <div style={{ display: 'flex', gap: 6, padding: 5, ...track }}>
        {GROUPS.map((g) => {
          const on = g === active
          return (
            <button
              key={g}
              type="button"
              onClick={() => setActive(g)}
              style={{
                flex: 1,
                border: 'none',
                cursor: 'pointer',
                fontFamily: TEXT_FONT,
                fontSize: 13,
                fontWeight: on ? 700 : 500,
                letterSpacing: -0.2,
                padding: '9px 0',
                color: on ? KIT_BLUE : theme.textMuted,
                transition: 'color 160ms ease',
                ...(on ? pill : { background: 'transparent', borderRadius: 12 }),
              }}
            >
              {g}
            </button>
          )
        })}
      </div>

      {/* Rejilla de módulos del grupo activo — se intercambia con un fundido. */}
      <div
        key={active}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          animation: 'neo-mgw-fade 280ms ease both',
        }}
      >
        {modules.map((name) => (
          <Tile key={name} name={name} theme={theme} />
        ))}
      </div>
    </NeoCard>
  )
}

/** Plaquita raised: icono real del módulo + wordmark + micro-frase. */
function Tile({ name, theme }: { name: ModuleName; theme: Theme }) {
  const mod: ModuleSpec = MODULES[name]
  const plate = elevation(theme, { depth: 'raised', distance: 4, blur: 10, radius: 16 })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 9,
        padding: '14px 13px',
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${KIT_BLUE}14`,
        }}
      >
        <img
          src={mod.icon}
          width={26}
          height={26}
          alt=""
          style={{ display: 'block', transform: mod.rotate ? `rotate(${mod.rotate}deg)` : undefined }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: -0.2, color: theme.textStrong }}>
          {mod.name}
        </span>
        <span style={{ fontSize: 10.5, lineHeight: 1.35, color: theme.textMuted }}>
          {CAPTIONS[name] ?? ''}
        </span>
      </div>
    </div>
  )
}
