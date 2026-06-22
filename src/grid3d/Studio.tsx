/**
 * Studio — the interactive environment for the 3D stacked-process generator.
 * ──────────────────────────────────────────────────────────────────────────
 * The authoring half of the hybrid (grid3d.html). Compose a stack by eye:
 *   · the 3D preview (drag to orbit, wheel to zoom) shows the live CSS-3D stack;
 *   · the plane manager adds / clones / reorders / deletes planes;
 *   · "✎" opens the full grid Editor for a plane (grid size + every pill);
 *   · staging sliders tune the fan / depth / rack-focus / camera;
 *   · play / scrub runs the front→back depth wave;
 *   · "Copiar doc" emits the GridStackDoc JSON → paste into the Remotion
 *     <GridStack3DVideo> props to render this exact stack.
 *
 * Same scene + math as Remotion; only the driver (scrub/orbit vs frame) differs.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Editor } from '@/components/Editor';
import type { PathSpec } from '@/components/PathScene';
import { CONCEPTS } from '@/content/concepts';
import { THEMES } from '@/lib/neumorphism';
import { GridStackScene3D } from './GridStackScene3D';
import { GRID_STACK_DOC_DEFAULTS, gridStackBackground, planeStepCounts, type GridStackDoc } from './doc';
import { gridStackTimeline, type GridStackLayout } from './gridStack3d';

const FPS = 30;

const clone = <T,>(v: T): T => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const BLANK_PLANE: PathSpec = { columns: 4, rows: 3, route: [], startNode: [0, 2] };

export function Studio() {
  const [doc, setDoc] = useState<GridStackDoc>(() => clone(GRID_STACK_DOC_DEFAULTS));
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [addId, setAddId] = useState(CONCEPTS[0].id);
  // orbit drag state — declared here (before any early return) per rules of hooks
  const drag = useRef<{ x: number; y: number; rotX: number; rotY: number } | null>(null);

  const total = useMemo(() => gridStackTimeline(planeStepCounts(doc)).total, [doc]);
  const theme = useMemo(() => THEMES[doc.dark ? 'dark' : 'light'], [doc.dark]);

  // playback loop (studio only — Remotion drives its own frame)
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const step = 1000 / FPS;
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      if (acc >= step) {
        const n = Math.floor(acc / step);
        acc -= n * step;
        setFrame((f) => (f + n) % Math.max(1, total));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  useEffect(() => setFrame((f) => f % Math.max(1, total)), [total]);

  const ground = gridStackBackground(doc.dark);

  // ── doc mutators ────────────────────────────────────────────────────────────
  const setLayout = (patch: Partial<GridStackLayout>) =>
    setDoc((d) => ({ ...d, layout: { ...d.layout, ...patch } }));
  const setPlane = (i: number, spec: PathSpec) =>
    setDoc((d) => ({ ...d, planes: d.planes.map((p, k) => (k === i ? spec : p)) }));
  const addPlane = (spec: PathSpec) => setDoc((d) => ({ ...d, planes: [...d.planes, clone(spec)] }));
  const removePlane = (i: number) =>
    setDoc((d) => ({ ...d, planes: d.planes.filter((_, k) => k !== i) }));
  const movePlane = (i: number, dir: -1 | 1) =>
    setDoc((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.planes.length) return d;
      const planes = [...d.planes];
      [planes[i], planes[j]] = [planes[j], planes[i]];
      return { ...d, planes };
    });

  const copyDoc = () => {
    const json = JSON.stringify(doc, null, 2);
    navigator.clipboard?.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  // ── edit-a-plane mode: reuse the full grid Editor ─────────────────────────────
  if (editing != null && doc.planes[editing]) {
    return (
      <Editor
        theme={theme}
        value={doc.planes[editing]}
        onChange={(spec) => setPlane(editing, spec)}
        onClose={() => setEditing(null)}
      />
    );
  }

  // ── orbit / zoom on the preview ──────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, rotX: doc.layout.rotX, rotY: doc.layout.rotY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const b = drag.current;
    setLayout({
      rotY: b.rotY + (e.clientX - b.x) * 0.25,
      rotX: clamp(b.rotX - (e.clientY - b.y) * 0.25, -20, 82),
    });
  };
  const endDrag = () => { drag.current = null; };
  const onWheel = (e: React.WheelEvent) =>
    setLayout({ scale: clamp(doc.layout.scale * (1 - e.deltaY * 0.001), 0.15, 2.2) });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d0f13', color: '#e6e6f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* ── left panel ─────────────────────────────────────────────────────────── */}
      <aside style={panel}>
        <header>
          <h2 style={{ margin: 0, fontSize: 16 }}>Stack 3D · grid builder</h2>
          <p style={hint}>Apila procesos como planos en 3D. Arrastra el preview para orbitar, rueda para zoom. ✎ edita la rejilla y cada pill.</p>
        </header>

        <Section title={`Planos · ${doc.planes.length}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto' }}>
            {doc.planes.map((p, i) => (
              <div key={i} style={planeRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={planeDot(i, doc.planes.length)} />
                  <span style={{ fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ color: muted, fontSize: 11 }}>{p.columns}×{p.rows} · {p.route.length} pasos</span>
                </span>
                <span style={{ display: 'flex', gap: 3 }}>
                  <IconBtn title="subir" onClick={() => movePlane(i, -1)}>↑</IconBtn>
                  <IconBtn title="bajar" onClick={() => movePlane(i, 1)}>↓</IconBtn>
                  <IconBtn title="duplicar" onClick={() => addPlane(p)}>⧉</IconBtn>
                  <IconBtn title="editar" onClick={() => setEditing(i)} accent>✎</IconBtn>
                  <IconBtn title="eliminar" onClick={() => removePlane(i)} danger>✕</IconBtn>
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <select value={addId} onChange={(e) => setAddId(e.target.value)} style={select}>
              {CONCEPTS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button style={ghost} onClick={() => addPlane(CONCEPTS.find((c) => c.id === addId)!.spec)}>＋ concepto</button>
            <button style={ghost} onClick={() => addPlane(BLANK_PLANE)}>＋ vacío</button>
          </div>
        </Section>

        <Section title="Escena / cámara">
          <Slider label="separación (gap)" value={doc.layout.gapPx} min={80} max={700} step={5} onChange={(v) => setLayout({ gapPx: v })} />
          <Slider label="abanico X" value={doc.layout.fanX} min={0} max={260} step={2} onChange={(v) => setLayout({ fanX: v })} />
          <Slider label="abanico Y" value={doc.layout.fanY} min={0} max={260} step={2} onChange={(v) => setLayout({ fanY: v })} />
          <Slider label="giro X" value={doc.layout.rotX} min={-20} max={82} step={1} onChange={(v) => setLayout({ rotX: v })} />
          <Slider label="giro Y" value={doc.layout.rotY} min={-80} max={80} step={1} onChange={(v) => setLayout({ rotY: v })} />
          <Slider label="escala" value={doc.layout.scale} min={0.15} max={2} step={0.01} onChange={(v) => setLayout({ scale: v })} />
          <Slider label="perspectiva" value={doc.layout.perspective} min={800} max={5000} step={50} onChange={(v) => setLayout({ perspective: v })} />
        </Section>

        <Section title="Profundidad / rack-focus">
          <Slider label="relleno del grid" value={doc.layout.fillOpacity} min={0} max={1} step={0.02} onChange={(v) => setLayout({ fillOpacity: v })} />
          <Slider label="dim fondo" value={doc.layout.dimFloor} min={0.1} max={1} step={0.02} onChange={(v) => setLayout({ dimFloor: v })} />
          <Slider label="desenfoque fondo" value={doc.layout.blurFar} min={0} max={12} step={0.5} onChange={(v) => setLayout({ blurFar: v })} />
          <Slider label="celda (px)" value={doc.cell} min={72} max={180} step={2} onChange={(v) => setDoc((d) => ({ ...d, cell: v }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 2 }}>
            <input type="checkbox" checked={doc.dark} onChange={(e) => setDoc((d) => ({ ...d, dark: e.target.checked }))} />
            modo oscuro
          </label>
        </Section>

        <Section title="Exportar">
          <button style={{ ...primary, width: '100%' }} onClick={copyDoc}>{copied ? '✓ copiado' : 'Copiar doc (JSON)'}</button>
          <p style={hint}>Pégalo en los props de la composición <code>GridStack3D</code> en Remotion.</p>
        </Section>
      </aside>

      {/* ── 3D preview + timeline ────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
          style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#0a0c10', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          {/* a 16:9 stage so the preview matches the 1920×1080 render framing */}
          <div style={{ position: 'relative', width: 'min(100%, calc((100vh - 56px) * 16 / 9))', aspectRatio: '16 / 9', overflow: 'hidden', background: ground.background }}>
            <GridStackScene3D doc={doc} frame={frame} />
            <div style={{ position: 'absolute', inset: 0, background: ground.vignette, pointerEvents: 'none' }} />
          </div>
        </div>

        <div style={timeline}>
          <button style={{ ...primary, minWidth: 92 }} onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚ pausa' : '▶ play'}</button>
          <input
            type="range"
            min={0}
            max={Math.max(1, total - 1)}
            value={frame}
            onChange={(e) => { setPlaying(false); setFrame(Number(e.target.value)); }}
            style={{ flex: 1 }}
          />
          <span style={{ fontVariantNumeric: 'tabular-nums', color: muted, minWidth: 96, textAlign: 'right' }}>
            {frame} / {total} · {(total / FPS).toFixed(1)}s
          </span>
        </div>
      </main>
    </div>
  );
}

// ── tokens + small controls ────────────────────────────────────────────────────
const muted = '#8a8aa8';
const line = 'rgba(255,255,255,0.10)';

const panel: CSSProperties = {
  width: 330, flexShrink: 0, height: '100vh', overflowY: 'auto',
  padding: 16, display: 'flex', flexDirection: 'column', gap: 16,
  background: '#15171d', borderRight: `1px solid ${line}`,
};
const hint: CSSProperties = { margin: '6px 0 0', fontSize: 12, color: muted, lineHeight: 1.45 };
const planeRow: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '6px 8px', borderRadius: 8, border: `1px solid ${line}`, background: 'rgba(255,255,255,0.03)', fontSize: 12,
};
const select: CSSProperties = {
  flex: 1, padding: '7px 8px', borderRadius: 8, border: `1px solid ${line}`,
  background: '#0d0f13', color: '#e6e6f0', fontSize: 12.5,
};
const primary: CSSProperties = {
  padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
  background: '#0070f9', color: '#fff', fontWeight: 700, fontSize: 13,
};
const ghost: CSSProperties = {
  padding: '7px 10px', borderRadius: 8, border: `1px solid ${line}`, cursor: 'pointer',
  background: 'rgba(255,255,255,0.06)', color: '#e6e6f0', fontWeight: 600, fontSize: 12.5, whiteSpace: 'nowrap',
};
const timeline: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
  background: '#15171d', borderTop: `1px solid ${line}`,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{title}</div>
      {children}
    </section>
  );
}

function IconBtn({ children, title, onClick, accent, danger }: { children: React.ReactNode; title: string; onClick: () => void; accent?: boolean; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        minWidth: 22, height: 22, padding: '0 5px', borderRadius: 6, cursor: 'pointer',
        border: `1px solid ${line}`, fontSize: 11, lineHeight: 1,
        background: accent ? 'rgba(0,112,249,0.18)' : danger ? 'rgba(255,77,64,0.16)' : 'rgba(255,255,255,0.06)',
        color: accent ? '#7bb6ff' : danger ? '#ff8a80' : '#cfcfe6',
      }}
    >
      {children}
    </button>
  );
}

function planeDot(i: number, n: number): CSSProperties {
  const t = n > 1 ? i / (n - 1) : 0;
  return { width: 9, height: 9, borderRadius: 999, background: '#0070f9', opacity: 1 - t * 0.6, flexShrink: 0 };
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, color: muted }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ color: '#cfcfe6', fontVariantNumeric: 'tabular-nums' }}>{Number.isInteger(step) ? value : value.toFixed(2)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
