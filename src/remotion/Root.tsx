import { Composition } from 'remotion';
import { ConversationVideo, CONVERSATION_DURATION } from './ConversationVideo';
import { CodeTerminalVideo, CODE_TERMINAL_DURATION } from './CodeTerminalVideo';
import { ClientTableVideo, CLIENT_TABLE_DURATION } from './ClientTableVideo';
import { InventoryTableVideo, INVENTORY_TABLE_DURATION } from './InventoryTableVideo';
import { DocumentVideo, DOCUMENT_DURATION } from './DocumentVideo';
import { DocumentsVideo, DOCUMENTS_DURATION } from './DocumentsVideo';
import { WebSweepVideo, WEBSWEEP_DURATION } from './WebSweepVideo';
import { DataSweepVideo, DATASWEEP_DURATION } from './DataSweepVideo';
import { DataFieldVideo, DATA_FIELD_DURATION } from './DataFieldVideo';
import { ConectoresDatosVideo, CONECTORES_DATOS_DURATION } from './ConectoresDatosVideo';
import { StoreFlowVideo, STORE_FLOW_DURATION } from './StoreFlowVideo';
import { StoreUnfoldVideo, STORE_UNFOLD_DURATION } from './StoreUnfoldVideo';
import { StoreBuildVideo, STORE_BUILD_DURATION } from './StoreBuildVideo';
import { StoreInventoryVideo, STORE_INVENTORY_DURATION } from './StoreInventoryVideo';
import { InventoryDashboardVideo, INVENTORY_DASHBOARD_DURATION } from './InventoryDashboardVideo';
import { PedidosDashboardVideo, PEDIDOS_DASHBOARD_DURATION } from './PedidosDashboardVideo';
import { ScheduleFillVideo, SCHEDULE_FILL_DURATION } from './ScheduleFillVideo';
import { MusicPulseVideo, MUSIC_PULSE_DURATION, calculateMusicPulseMetadata } from './MusicPulseVideo';
import { PulseOverdriveVideo, PULSE_OVERDRIVE_DURATION, calculatePulseOverdriveMetadata } from './PulseOverdriveVideo';
import { StorePitchVideo, STORE_PITCH_DURATION } from './StorePitchVideo';
import { MotionShowcaseVideo, MOTION_SHOWCASE_DURATION } from './MotionShowcaseVideo';
import { StoreCreateVideo, STORE_CREATE_DURATION } from './StoreCreateVideo';
import { ObjectiveVideo, OBJECTIVE_DURATION } from './ObjectiveVideo';
import { TextShowcaseVideo, TEXT_SHOWCASE_DURATION } from './TextShowcaseVideo';
import { TextRevealVideo, TEXT_REVEAL_DURATION } from './TextRevealVideo';
import { GridRevealVideo, GRID_REVEAL_DEFAULTS, calculateGridRevealMetadata } from './GridRevealVideo';
import { GridStack3DVideo, GRID_STACK3D_DEFAULTS, calculateGridStack3DMetadata } from '../grid3d/GridStack3DVideo';
import { PrintPageVideo, calculatePrintMetadata } from './PrintPageVideo';
import { TaskCardVideo, TASK_CARD_DURATION } from './TaskCardVideo';
import { KitGallery, KIT_GALLERY_DURATION } from './aikit/KitGallery';
import { Prod01Programa, PROD01_DURATION } from './Prod01Programa';
import { Prod02Delegacion, PROD02_DURATION } from './Prod02Delegacion';
import { Prod04Colmena, PROD04_DURATION } from './Prod04Colmena';
import { ProdControlaVideo, PROD_CONTROLA_DURATION } from './ProdControla';
import {
  TituloCard,
  TITULO_CONTROLA,
  TITULO_CONTROLA_DURATION,
  TITULO_DELEGA,
  TITULO_DELEGA_DURATION,
  TITULO_CONSTRUYE,
  TITULO_CONSTRUYE_DURATION,
} from './TituloCard';
import { ControlaDatosVideo, CONTROLA_DATOS_DURATION } from './ControlaDatosVideo';
import { ControlaModulosVideo, CONTROLA_MODULOS_DURATION } from './ControlaModulosVideo';
import { DelegaModulosVideo, DELEGA_MODULOS_DURATION } from './DelegaModulosVideo';
import { PresupuestoChat, PRESUPUESTO_DURATION } from './PresupuestoChat';
import { PresupuestoManual, PRESUPUESTO_MANUAL_DURATION } from './PresupuestoManual';
import { FlowBuilderVideo, FLOW_BUILDER_DURATION } from './FlowBuilderVideo';
import { TejidoVivoVideo, TEJIDO_VIVO_DURATION } from './TejidoVivoVideo';
import { RostrosVivosVideo, ROSTROS_VIVOS_DURATION } from './RostrosVivosVideo';
import { TejidoArranqueVideo, TEJIDO_ARRANQUE_DURATION } from './TejidoArranqueVideo';
import { ConectoresVideo, CONECTORES_DURATION } from './ConectoresVideo';
import { PulseGridVideo, PULSE_GRID_DURATION } from './PulseGridVideo';
import { SkillForgeVideo, SKILL_FORGE_DURATION_FRAMES } from './SkillForgeVideo';
import { CreadorSkillsVideo, CREADOR_SKILLS_DURATION } from './CreadorSkillsVideo';
import { GloboVivoVideo, GLOBO_VIVO_DURATION } from './GloboVivoVideo';
import { LecturaVorazVideo, LECTURA_VORAZ_DURATION } from './LecturaVorazVideo';
import { RegistroInventarioVideo, REGISTRO_INVENTARIO_DURATION } from './RegistroInventarioVideo';
import { AvisoTuberiasVideo, AVISO_TUBERIAS_DURATION } from './AvisoTuberiasVideo';
import { DelegaCorreoVideo, DELEGA_CORREO_DURATION } from './DelegaCorreoVideo';
import { EventoMarketingVideo, EVENTO_MARKETING_DURATION } from './EventoMarketingVideo';
import { EncargoChatVideo, ENCARGO_CHAT_DURATION } from './EncargoChatVideo';
import { IdleGridVideo, IDLE_GRID_DURATION } from './IdleGridVideo';

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Idle — pantalla de espera entre presentaciones: un grid denso 30×27
          ESTÁTICO (no se forma) sobre el que aparecen y se hunden elevaciones
          neumórficas en celdas ALEATORIAS. Sin paths, sin flechas, sin glows —
          sólo el campo respirando. Bucle largo (~4 min). 1920×1728. */}
      <Composition
        id="IdleGrid"
        component={IdleGridVideo}
        durationInFrames={IDLE_GRID_DURATION}
        fps={FPS}
        width={1920}
        height={1728}
      />
      {/* ── AiKit Live (2026-06-17) — pista Producto, en orden de proyección ── */}
      <Composition
        id="Prod01Programa"
        component={Prod01Programa}
        durationInFrames={PROD01_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Prod02Delegacion"
        component={Prod02Delegacion}
        durationInFrames={PROD02_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Prod04Colmena"
        component={Prod04Colmena}
        durationInFrames={PROD04_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Capítulo «Controla → Delega → Construye» — máster que encadena las escenas
          de abajo (cada beat es además su propia composición, abajo). */}
      <Composition
        id="ProdControla"
        component={ProdControlaVideo}
        durationInFrames={PROD_CONTROLA_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* ── Escenas sueltas del capítulo Controla (separadas) ── */}
      {/* Titulares (text-showcase): #1 Cámara·Pan, #4 Palabras, #9 Persiana, sobre blanco. */}
      <Composition
        id="TitControla"
        component={TituloCard}
        defaultProps={TITULO_CONTROLA}
        durationInFrames={TITULO_CONTROLA_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="TitDelega"
        component={TituloCard}
        defaultProps={TITULO_DELEGA}
        durationInFrames={TITULO_DELEGA_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="TitConstruye"
        component={TituloCard}
        defaultProps={TITULO_CONSTRUYE}
        durationInFrames={TITULO_CONSTRUYE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Controla · datos — Data Sweep · Data Field · Lectura Voraz, 2,25 s c/u. */}
      <Composition
        id="ControlaDatos"
        component={ControlaDatosVideo}
        durationInFrames={CONTROLA_DATOS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Controla · módulos — paneo horizontal de la flecha por los módulos azules,
          con la elevación «Controla» sobre el primero; cada módulo (icono + nombre)
          reproduce su Rive al pasar la flecha. */}
      <Composition
        id="ControlaModulos"
        component={ControlaModulosVideo}
        durationInFrames={CONTROLA_MODULOS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Delega · módulos — los 5 módulos naranja (ACTION) en stack centrado, sin
          flechas; los iconos se animan uno a uno. */}
      <Composition
        id="DelegaModulos"
        component={DelegaModulosVideo}
        durationInFrames={DELEGA_MODULOS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PresupuestoChat"
        component={PresupuestoChat}
        durationInFrames={PRESUPUESTO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* El Vía Crucis del Presupuesto — el proceso manual y tedioso (antes de la IA) */}
      <Composition
        id="PresupuestoManual"
        component={PresupuestoManual}
        durationInFrames={PRESUPUESTO_MANUAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* El flujo, a mano — un flow estilo Zapier se autoensambla bloque a bloque
          (disparador · filtros · rutas con bifurcación); largo y tedioso a propósito */}
      <Composition
        id="FlowBuilder"
        component={FlowBuilderVideo}
        durationInFrames={FLOW_BUILDER_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Tejido vivo — un organismo de micro-procesos: el grid se llena, unos se
          disipan, otros se quedan (muchos flows StoreFlow a la vez) */}
      <Composition
        id="TejidoVivo"
        component={TejidoVivoVideo}
        durationInFrames={TEJIDO_VIVO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Rostros vivos — EXACTAMENTE el tejido vivo (mismo fondo, misma cámara,
          misma duración) con una sola adición: la cara del user como círculo
          neumórfico integrado en la celda de la esquina superior izquierda. */}
      <Composition
        id="RostrosVivos"
        component={RostrosVivosVideo}
        durationInFrames={ROSTROS_VIVOS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Tejido (arranque) — la ignición del tejido: un bucle de 4 celdas con una
          flecha que gira → el grid florece hacia fuera (líneas punta azul) → los 16
          módulos dispersos → una ruta los teje todos y el rastro de flechas se queda */}
      <Composition
        id="TejidoArranque"
        component={TejidoArranqueVideo}
        durationInFrames={TEJIDO_ARRANQUE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Conectores (rodeo) — los logos reales (Notion·Zapier·Gmail·Jira·Outlook) en
          elevaciones; la ruta de la flecha va hacia cada uno pero lo RODEA (bordea su
          anillo) en vez de atravesarlo — el reverso de TejidoArranque */}
      <Composition
        id="Conectores"
        component={ConectoresVideo}
        durationInFrames={CONECTORES_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Pulse Grid — un círculo elevado 4×4 en el centro del campo PULSA: el núcleo
          azul se hincha, una onda de choque sale del borde y, en TODAS direcciones,
          se dispara un abanico de cometas de pathfinding (chevrons FlowPlate) que
          toman escaleras distintas, salen de cuadro y su cola se DISUELVE tras la
          cabeza. La cámara se queda fija en el centro con un zoom-out lento. */}
      <Composition
        id="PulseGrid"
        component={PulseGridVideo}
        durationInFrames={PULSE_GRID_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Skill Forge — la línea recta de elevaciones pasa por el módulo Skill Hub
          (Rive en bucle) y la siguiente elevación (pastilla de "puntos trabajando")
          se ABRE como StoreCreate, sin texto: los puntos en el centro mientras cae
          código en modo claro; luego la MISMA apertura en REVERSA empaqueta el
          panel de vuelta en una elevación con icono + "Comparador de alquileres". */}
      <Composition
        id="SkillForge"
        component={SkillForgeVideo}
        durationInFrames={SKILL_FORGE_DURATION_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Creador de skills — una columna de flechas baja por el spine izquierdo y,
          al pasar, emergen cuatro pasos de un presupuesto (nº + icono + barra). El
          cabezal llega a la elevación «Creador de skills» (logo Skill-Forge en Rive,
          que reacciona al tocarla); entonces a la derecha se hunde un recuadro
          (press en muchas celdas) y los pasos se PINTAN en él uno a uno — cada
          tarjeta pintada enciende en azul su gemela de la izquierda. */}
      <Composition
        id="CreadorSkills"
        component={CreadorSkillsVideo}
        durationInFrames={CREADOR_SKILLS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Globo Vivo — hero AAA: globo terráqueo fotorrealista colonizado por el
          tejido vivo hasta un orbe-grid blanco. Esfera 3D determinista vía
          @remotion/three; duración finalizada a la escena completa (~900f / 30s,
          cuadrada al schedule del tejido — sin overflow en el editor). */}
      <Composition
        id="GloboVivo"
        component={GloboVivoVideo}
        durationInFrames={GLOBO_VIVO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Lectura voraz — la IA procesa información de todas partes a la vez: fuentes
          estructuradas (tablas, JSON, respuestas API) caen y se APILAN; cada nueva
          se escanea con destacados frenéticos (subrayado/recuadro/barrido) mientras
          las de debajo se desvanecen, hasta que la última se disuelve. Sin chrome ni
          rótulos; brain determinista en lecturaVorazScript.ts */}
      <Composition
        id="LecturaVoraz"
        component={LecturaVorazVideo}
        durationInFrames={LECTURA_VORAZ_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Registro inventario — llega un correo (Gmail: "han llegado las tuberías"),
          se enciende el objetivo "Registrar las tuberías en el inventario" y la IA
          completa el proceso paso a paso (leer · conectar datos · editar · registrar) */}
      <Composition
        id="RegistroInventario"
        component={RegistroInventarioVideo}
        durationInFrames={REGISTRO_INVENTARIO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Aviso tuberías — el AGENTE pregunta desde la pantalla de bloqueo del
          móvil 3D (iPhone FBX en @remotion/three): «¿Las tuberías son C2 o C3?»
          con dos respuestas rápidas (C2 · C3). Enlaza con RegistroInventario. */}
      <Composition
        id="AvisoTuberias"
        component={AvisoTuberiasVideo}
        durationInFrames={AVISO_TUBERIAS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Delega correo — remix de RegistroInventario desde la BOLA: el disco emerge
          con una notificación de Gmail, la limpia, se enciende el objetivo y la IA
          DELEGA el trabajo recorriendo los 5 módulos de acción (naranja): Action
          Runner · Action Script · TeamWork · Feedback Loop · Heartbeat — cada uno
          reproduce su Rive cuando el path pasa por él; corta al disparar el último. */}
      <Composition
        id="DelegaCorreo"
        component={DelegaCorreoVideo}
        durationInFrames={DELEGA_CORREO_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Evento · Marketing — la IA prepara el márketing de un evento como un
          proceso en el grid (ruta de elevaciones, cámara plato a plato) que
          culmina consultando Google Calendar ("Consultando timeline de
          montaje"); de ahí salta a conversación, donde la IA pregunta por qué el
          día de montaje va ANTES de que llegue el material gráfico. */}
      <Composition
        id="EventoMarketing"
        component={EventoMarketingVideo}
        durationInFrames={EVENTO_MARKETING_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Encargo · Chat — un chat a pantalla completa y limpio: el humano dispara
          una RÁFAGA de burbujas SIN texto (todas suyas, a la derecha); la IA
          responde una línea («Entendido, preparo tu presupuesto») y lanza un
          tool-call (pastilla ✦ «Generando el presupuesto» + spinner) que se
          EXPANDE con el mismo patrón que StoreCreate hasta ocupar el frame. */}
      <Composition
        id="EncargoChat"
        component={EncargoChatVideo}
        durationInFrames={ENCARGO_CHAT_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Conversation"
        component={ConversationVideo}
        durationInFrames={CONVERSATION_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="CodeTerminal"
        component={CodeTerminalVideo}
        durationInFrames={CODE_TERMINAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ClientTable"
        component={ClientTableVideo}
        durationInFrames={CLIENT_TABLE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="InventoryTable"
        component={InventoryTableVideo}
        durationInFrames={INVENTORY_TABLE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Document"
        component={DocumentVideo}
        durationInFrames={DOCUMENT_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Documents"
        component={DocumentsVideo}
        durationInFrames={DOCUMENTS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="WebSweep"
        component={WebSweepVideo}
        durationInFrames={WEBSWEEP_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="DataSweep"
        component={DataSweepVideo}
        durationInFrames={DATASWEEP_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* DataField — la prima de DataSweep en pequeño: los mismos datos crudos
          (SQL · JSON · código · logs · hex · ADN · métricas · triples · mini-gráficas)
          aparecen MINÚSCULOS por TODOS los puntos de la página y desaparecen, en un
          campo denso que respira. Determinista y loop perfecto (M·CYCLE). */}
      <Composition
        id="DataField"
        component={DataFieldVideo}
        durationInFrames={DATA_FIELD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* ConectoresDatos — la línea de proceso ATRAVIESA los conectores en línea
          recta (reverso de «Conectores rodeo»): trail de chevrons elevados que pasa
          POR DENTRO de Outlook · Notion · Gmail · Jira · Zapier. Entorno limpio →
          al pasar por cada app florece en el FONDO su mar de datos en texto plano
          (sin cards, sin rotar; cada pieza anima su destacado). Cámara que viaja. */}
      <Composition
        id="ConectoresDatos"
        component={ConectoresDatosVideo}
        durationInFrames={CONECTORES_DATOS_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StoreFlow"
        component={StoreFlowVideo}
        durationInFrames={STORE_FLOW_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StoreUnfold"
        component={StoreUnfoldVideo}
        durationInFrames={STORE_UNFOLD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StoreBuild"
        component={StoreBuildVideo}
        durationInFrames={STORE_BUILD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StoreInventory"
        component={StoreInventoryVideo}
        durationInFrames={STORE_INVENTORY_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Pedidos · Dashboard — la secuencia completa: la intro StoreTitle
          recopiada ("Crear Dashboard de pedidos" → "Usando herramienta") y, con
          CORTE DURO, el dashboard construyéndose solo (InventoryDashboard). */}
      <Composition
        id="PedidosDashboard"
        component={PedidosDashboardVideo}
        durationInFrames={PEDIDOS_DASHBOARD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* Inventory dashboard — una UI de dashboard de inventario que se
          construye SOLA (estilo «Store Create»): la ventana se autodibuja y los
          módulos emergen y se rellenan con animación, casi sin texto — KPIs que
          cuentan, barras que crecen, donut que barre, lista que cae fila a fila,
          y un heat-grid de ocupación de almacén que se enciende en oleada. */}
      <Composition
        id="InventoryDashboard"
        component={InventoryDashboardVideo}
        durationInFrames={INVENTORY_DASHBOARD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StorePitch"
        component={StorePitchVideo}
        durationInFrames={STORE_PITCH_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ScheduleFill"
        component={ScheduleFillVideo}
        durationInFrames={SCHEDULE_FILL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="MusicPulse"
        component={MusicPulseVideo}
        durationInFrames={MUSIC_PULSE_DURATION}
        calculateMetadata={calculateMusicPulseMetadata}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PulseOverdrive"
        component={PulseOverdriveVideo}
        durationInFrames={PULSE_OVERDRIVE_DURATION}
        calculateMetadata={calculatePulseOverdriveMetadata}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="MotionShowcase"
        component={MotionShowcaseVideo}
        durationInFrames={MOTION_SHOWCASE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="StoreCreate"
        component={StoreCreateVideo}
        durationInFrames={STORE_CREATE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Objective"
        component={ObjectiveVideo}
        durationInFrames={OBJECTIVE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="TextShowcase"
        component={TextShowcaseVideo}
        durationInFrames={TEXT_SHOWCASE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="TextReveal"
        component={TextRevealVideo}
        durationInFrames={TEXT_REVEAL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          variant: 'camera-pan',
          text: 'Automatiza tu negocio',
          subtitle: 'Agentes de IA que trabajan por ti',
          dark: false,
        }}
      />
      <Composition
        id="GridReveal"
        component={GridRevealVideo}
        calculateMetadata={calculateGridRevealMetadata}
        durationInFrames={1}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={GRID_REVEAL_DEFAULTS}
      />
      <Composition
        id="GridStack3D"
        component={GridStack3DVideo}
        calculateMetadata={calculateGridStack3DMetadata}
        durationInFrames={1}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={GRID_STACK3D_DEFAULTS}
      />
      <Composition
        id="TaskCard"
        component={TaskCardVideo}
        durationInFrames={TASK_CARD_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* TEMP — Phase-1 smoke gallery (the eight kit demos chaptered);
          Phase 4 retires it. */}
      <Composition
        id="KitGallery"
        component={KitGallery}
        durationInFrames={KIT_GALLERY_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PrintPage"
        component={PrintPageVideo}
        calculateMetadata={calculatePrintMetadata}
        durationInFrames={1}
        fps={1}
        width={2551}
        height={3579}
      />
    </>
  );
};
