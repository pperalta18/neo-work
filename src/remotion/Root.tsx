import { Composition, Folder } from 'remotion';
import { ConversationVideo, CONVERSATION_DURATION } from './ConversationVideo';
import { CodeTerminalVideo, CODE_TERMINAL_DURATION } from './CodeTerminalVideo';
import { ClientTableVideo, CLIENT_TABLE_DURATION } from './ClientTableVideo';
import { InventoryTableVideo, INVENTORY_TABLE_DURATION } from './InventoryTableVideo';
import { DocumentVideo, DOCUMENT_DURATION } from './DocumentVideo';
import { DocumentsVideo, DOCUMENTS_DURATION } from './DocumentsVideo';
import { StoreFlowVideo, STORE_FLOW_DURATION } from './StoreFlowVideo';
import { StoreBuildVideo, STORE_BUILD_DURATION } from './StoreBuildVideo';
import { StoreInventoryVideo, STORE_INVENTORY_DURATION } from './StoreInventoryVideo';
import { ScheduleFillVideo, SCHEDULE_FILL_DURATION } from './ScheduleFillVideo';
import { MusicPulseVideo, MUSIC_PULSE_DURATION, calculateMusicPulseMetadata } from './MusicPulseVideo';
import { PulseOverdriveVideo, PULSE_OVERDRIVE_DURATION, calculatePulseOverdriveMetadata } from './PulseOverdriveVideo';
import { SourcesActionsVideo, SOURCES_ACTIONS_DURATION } from './SourcesActionsVideo';
import { StorePitchVideo, STORE_PITCH_DURATION } from './StorePitchVideo';
import { GridEmergeVideo, GRID_EMERGE_DURATION } from './GridEmergeVideo';
import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo';
import { AccountingFlowVideo, ACCOUNTING_DURATION } from './AccountingFlowVideo';
import { InvoiceIntakeScene, INVOICE_INTAKE_DURATION } from './InvoiceIntakeScene';
import { AccountingLoopScene, ACCOUNTING_LOOP_DURATION } from './AccountingLoopScene';
import { AccountingCloseScene, ACCOUNTING_CLOSE_DURATION } from './AccountingCloseScene';
import { EcommerceFlowVideo, ECOMMERCE_DURATION } from './EcommerceFlowVideo';
import { PlatformChaosScene, PLATFORM_CHAOS_DURATION } from './PlatformChaosScene';
import { InventoryIntakeScene, INVENTORY_INTAKE_DURATION } from './InventoryIntakeScene';
import { EcommerceChatScene, ECOMMERCE_CHAT_DURATION } from './EcommerceChatScene';
import { StoreTerminalScene, STORE_TERMINAL_DURATION } from './StoreTerminalScene';
import { StoreCreateScene, STORE_CREATE_DURATION } from './StoreCreateScene';
import { EmailFlowVideo, EMAIL_MARKETING_DURATION } from './EmailFlowVideo';
import { EmailGrindScene, EMAIL_GRIND_DURATION } from './EmailGrindScene';
import { ContactsMergeScene, CONTACTS_MERGE_DURATION } from './ContactsMergeScene';
import { EmailComposeScene, EMAIL_COMPOSE_DURATION } from './EmailComposeScene';
import { CampaignLiveScene, CAMPAIGN_LIVE_DURATION } from './CampaignLiveScene';
import { SupportFlowVideo, SUPPORT_DURATION } from './SupportFlowVideo';
import { MessageStormScene, MESSAGE_STORM_DURATION } from './MessageStormScene';
import { ChannelsConnectScene, CHANNELS_CONNECT_DURATION } from './ChannelsConnectScene';
import { SupportChatScene, SUPPORT_CHAT_DURATION } from './SupportChatScene';
import { SupportResolvedScene, SUPPORT_RESOLVED_DURATION } from './SupportResolvedScene';
import { SchedulingFlowVideo, SCHEDULING_DURATION } from './SchedulingFlowVideo';
import { ShiftChaosScene, SHIFT_CHAOS_DURATION } from './ShiftChaosScene';
import { StaffImportScene, STAFF_IMPORT_DURATION } from './StaffImportScene';
import { SchedulingRulesScene, SCHEDULING_RULES_DURATION } from './SchedulingRulesScene';
import { ScheduleTemplateScene, SCHEDULE_TEMPLATE_DURATION } from './ScheduleTemplateScene';
import { ScheduleResultsScene, SCHEDULE_RESULTS_DURATION } from './ScheduleResultsScene';
import { MotionShowcaseVideo, MOTION_SHOWCASE_DURATION } from './MotionShowcaseVideo';
import { StoreCreateVideo, STORE_CREATE_DURATION as STORE_CREATE_VIDEO_DURATION } from './StoreCreateVideo';
import { ObjectiveVideo, OBJECTIVE_DURATION } from './ObjectiveVideo';
import { TextShowcaseVideo, TEXT_SHOWCASE_DURATION } from './TextShowcaseVideo';
import { TextRevealVideo, TEXT_REVEAL_DURATION } from './TextRevealVideo';
import { GridRevealVideo, GRID_REVEAL_DEFAULTS, calculateGridRevealMetadata } from './GridRevealVideo';
import { PrintPageVideo, calculatePrintMetadata } from './PrintPageVideo';
import { HeroIntroVideo, HERO_INTRO_DURATION } from './hero/HeroIntroVideo';
import { HeroAltClicksVideo, HERO_ALT_CLICKS_DURATION } from './hero/HeroAltClicksVideo';
import { HeroAltFamiliesVideo, HERO_ALT_FAMILIES_DURATION } from './hero/HeroAltFamiliesVideo';
import { HeroAltTractorVideo, HERO_ALT_TRACTOR_DURATION } from './hero/HeroAltTractorVideo';
// ── Módulos seleccionables (new-landing): 10 clips en bucle perfecto ──
import { M1AbsencesScene, M1_ABSENCES_DURATION } from './modules/M1Absences';
import { M1AbsencesLoopScene, M1_ABSENCES_LOOP_DURATION } from './modules/M1AbsencesLoop';
// Absences ya no es un bucle: es una mini-película de 3 actos (peticiones → módulo → marcador)
import { M1AbsencesRequestsScene, ABS_REQUESTS_DURATION } from './modules/M1AbsencesRequests';
import { M1AbsencesProcessScene, ABS_PROCESS_DURATION } from './modules/M1AbsencesProcess';
import { M1AbsencesSummaryScene, ABS_SUMMARY_DURATION } from './modules/M1AbsencesSummary';
import { M1InvoicesScene, M1_INVOICES_DURATION } from './modules/M1Invoices';
import { M1StockScene, M1_STOCK_DURATION } from './modules/M1Stock';
import { M1TicketsScene, M1_TICKETS_DURATION } from './modules/M1Tickets';
import { M1CartScene, M1_CART_DURATION } from './modules/M1Cart';
import { M2OnboardingScene, M2_ONBOARDING_DURATION } from './modules/M2Onboarding';
import { M2SaleChainScene, M2_SALECHAIN_DURATION } from './modules/M2SaleChain';
// Dunning ya no es un bucle: es una mini-película de 3 actos (vence → reclama+avisa → cobrada)
import { M2DunningVideo, M2_DUNNING_DURATION } from './modules/M2DunningVideo';
import { M2DunningOverdueScene, M2_DUNNING_OVERDUE_DURATION } from './modules/M2DunningOverdue';
import { M2DunningRunScene, M2_DUNNING_RUN_DURATION } from './modules/M2DunningRun';
import { M2DunningPaidScene, M2_DUNNING_PAID_DURATION } from './modules/M2DunningPaid';
// MonthClose ya no es un bucle: es una mini-película de 3 actos (libro diario → módulo → resumen)
import { M2MonthCloseVideo, M2_MONTHCLOSE_DURATION } from './modules/M2MonthCloseVideo';
import { M2MonthCloseLedgerScene, MC_LEDGER_DURATION } from './modules/M2MonthCloseLedger';
import { M2MonthCloseRunScene, MC_RUN_DURATION } from './modules/M2MonthCloseRun';
import { M2MonthCloseSummaryScene, MC_SUMMARY_DURATION } from './modules/M2MonthCloseSummary';
import { M2LeadFunnelScene, M2_LEADFUNNEL_DURATION } from './modules/M2LeadFunnel';
// Copias V1 (abstractas, pre-Tailark) — solo para comparar lado a lado en Studio
import { M1AbsencesV1Scene, M1_ABSENCES_V1_DURATION } from './modules/M1AbsencesV1';
import { M1InvoicesV1Scene, M1_INVOICES_V1_DURATION } from './modules/M1InvoicesV1';
import { M1StockV1Scene, M1_STOCK_V1_DURATION } from './modules/M1StockV1';
import { M1TicketsV1Scene, M1_TICKETS_V1_DURATION } from './modules/M1TicketsV1';
import { M1CartV1Scene, M1_CART_V1_DURATION } from './modules/M1CartV1';
import { M2OnboardingV1Scene, M2_ONBOARDING_V1_DURATION } from './modules/M2OnboardingV1';
import { M2SaleChainV1Scene, M2_SALECHAIN_V1_DURATION } from './modules/M2SaleChainV1';
import { M2DunningV1Scene, M2_DUNNING_V1_DURATION } from './modules/M2DunningV1';
import { M2MonthCloseV1Scene, M2_MONTHCLOSE_V1_DURATION } from './modules/M2MonthCloseV1';
import { M2MonthCloseLoopScene, M2_MONTHCLOSE_LOOP_DURATION } from './modules/M2MonthCloseLoop';
import { M2LeadFunnelV1Scene, M2_LEADFUNNEL_V1_DURATION } from './modules/M2LeadFunnelV1';

const FPS = 30;
const MOD = 1080; // lienzo cuadrado de los clips de módulo

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Hero ── "El motor invisible": qué es AiKit (render único, no es un flujo) */}
      <Folder name="Hero">
        <Composition
          id="HeroIntro"
          component={HeroIntroVideo}
          durationInFrames={HERO_INTRO_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="HeroAltClicks"
          component={HeroAltClicksVideo}
          durationInFrames={HERO_ALT_CLICKS_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="HeroAltFamilies"
          component={HeroAltFamiliesVideo}
          durationInFrames={HERO_ALT_FAMILIES_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="HeroAltTractor"
          component={HeroAltTractorVideo}
          durationInFrames={HERO_ALT_TRACTOR_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
      </Folder>

      {/* ── Módulos seleccionables ── 10 clips en bucle perfecto (cuadrado 1080) */}
      {/* Módulo 1 · «Tus tareas del día a día» — un objeto, una transformación */}
      <Folder name="Modulos-Tareas">
        {/* Absences = mini-película de 3 actos (combinada) + sus actos sueltos */}
        <Composition id="ModAbsences" component={M1AbsencesScene} durationInFrames={M1_ABSENCES_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModAbsencesRequests" component={M1AbsencesRequestsScene} durationInFrames={ABS_REQUESTS_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModAbsencesProcess" component={M1AbsencesProcessScene} durationInFrames={ABS_PROCESS_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModAbsencesSummary" component={M1AbsencesSummaryScene} durationInFrames={ABS_SUMMARY_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModInvoices" component={M1InvoicesScene} durationInFrames={M1_INVOICES_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModStock" component={M1StockScene} durationInFrames={M1_STOCK_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModTickets" component={M1TicketsScene} durationInFrames={M1_TICKETS_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModCart" component={M1CartScene} durationInFrames={M1_CART_DURATION} fps={FPS} width={MOD} height={MOD} />
      </Folder>
      {/* Módulo 2 · «Tu negocio funcionando conectado» — varios nodos + un pulso */}
      <Folder name="Modulos-Conectado">
        <Composition id="ModOnboarding" component={M2OnboardingScene} durationInFrames={M2_ONBOARDING_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModSaleChain" component={M2SaleChainScene} durationInFrames={M2_SALECHAIN_DURATION} fps={FPS} width={MOD} height={MOD} />
        {/* Dunning = mini-película de 3 actos (combinada) + sus actos sueltos */}
        <Composition id="ModDunning" component={M2DunningVideo} durationInFrames={M2_DUNNING_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModDunningOverdue" component={M2DunningOverdueScene} durationInFrames={M2_DUNNING_OVERDUE_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModDunningRun" component={M2DunningRunScene} durationInFrames={M2_DUNNING_RUN_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModDunningPaid" component={M2DunningPaidScene} durationInFrames={M2_DUNNING_PAID_DURATION} fps={FPS} width={MOD} height={MOD} />
        {/* MonthClose = mini-película de 3 actos (combinada) + sus actos sueltos */}
        <Composition id="ModMonthClose" component={M2MonthCloseVideo} durationInFrames={M2_MONTHCLOSE_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModMonthCloseLedger" component={M2MonthCloseLedgerScene} durationInFrames={MC_LEDGER_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModMonthCloseRun" component={M2MonthCloseRunScene} durationInFrames={MC_RUN_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModMonthCloseSummary" component={M2MonthCloseSummaryScene} durationInFrames={MC_SUMMARY_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModLeadFunnel" component={M2LeadFunnelScene} durationInFrames={M2_LEADFUNNEL_DURATION} fps={FPS} width={MOD} height={MOD} />
      </Folder>
      {/* Copias V1 (versión abstracta anterior) + el loop de Ausencias previo a la
          mini-película — comparación lado a lado en Studio */}
      <Folder name="Modulos-V1">
        <Composition id="ModAbsencesLoop" component={M1AbsencesLoopScene} durationInFrames={M1_ABSENCES_LOOP_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModAbsencesV1" component={M1AbsencesV1Scene} durationInFrames={M1_ABSENCES_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModInvoicesV1" component={M1InvoicesV1Scene} durationInFrames={M1_INVOICES_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModStockV1" component={M1StockV1Scene} durationInFrames={M1_STOCK_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModTicketsV1" component={M1TicketsV1Scene} durationInFrames={M1_TICKETS_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModCartV1" component={M1CartV1Scene} durationInFrames={M1_CART_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModOnboardingV1" component={M2OnboardingV1Scene} durationInFrames={M2_ONBOARDING_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModSaleChainV1" component={M2SaleChainV1Scene} durationInFrames={M2_SALECHAIN_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModDunningV1" component={M2DunningV1Scene} durationInFrames={M2_DUNNING_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModMonthCloseV1" component={M2MonthCloseV1Scene} durationInFrames={M2_MONTHCLOSE_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModMonthCloseLoop" component={M2MonthCloseLoopScene} durationInFrames={M2_MONTHCLOSE_LOOP_DURATION} fps={FPS} width={MOD} height={MOD} />
        <Composition id="ModLeadFunnelV1" component={M2LeadFunnelV1Scene} durationInFrames={M2_LEADFUNNEL_V1_DURATION} fps={FPS} width={MOD} height={MOD} />
      </Folder>

      {/* ── Contabilidad ── mini-película (5 actos) + sus clips sueltos */}
      <Folder name="Accounting">
        <Composition
          id="Accounting"
          component={AccountingFlowVideo}
          durationInFrames={ACCOUNTING_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="InvoiceIntake"
          component={InvoiceIntakeScene}
          durationInFrames={INVOICE_INTAKE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="AccountingGrid"
          component={ConceptFlowVideo}
          durationInFrames={flowDuration('cierre-trimestre', 1)}
          defaultProps={{ conceptId: 'cierre-trimestre', teaserBeats: 1 }}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="AccountingLoop"
          component={AccountingLoopScene}
          durationInFrames={ACCOUNTING_LOOP_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="AccountingClose"
          component={AccountingCloseScene}
          durationInFrames={ACCOUNTING_CLOSE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
      </Folder>

      {/* ── E-Commerce ── mini-película (5 actos) + StoreBuild (clip embebido) */}
      <Folder name="Ecommerce">
        <Composition
          id="Ecommerce"
          component={EcommerceFlowVideo}
          durationInFrames={ECOMMERCE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="PlatformChaos"
          component={PlatformChaosScene}
          durationInFrames={PLATFORM_CHAOS_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="InventoryIntake"
          component={InventoryIntakeScene}
          durationInFrames={INVENTORY_INTAKE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="EcommerceGrid"
          component={ConceptFlowVideo}
          durationInFrames={flowDuration('montar-tienda', 1)}
          defaultProps={{ conceptId: 'montar-tienda', teaserBeats: 1 }}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="EcommerceChat"
          component={EcommerceChatScene}
          durationInFrames={ECOMMERCE_CHAT_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="StoreTerminal"
          component={StoreTerminalScene}
          durationInFrames={STORE_TERMINAL_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="StoreCreate"
          component={StoreCreateScene}
          durationInFrames={STORE_CREATE_DURATION}
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
      </Folder>

      {/* ── Email Marketing ── mini-película (5 actos) */}
      <Folder name="EmailMarketing">
        <Composition
          id="EmailMarketing"
          component={EmailFlowVideo}
          durationInFrames={EMAIL_MARKETING_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="EmailGrind"
          component={EmailGrindScene}
          durationInFrames={EMAIL_GRIND_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="ContactsMerge"
          component={ContactsMergeScene}
          durationInFrames={CONTACTS_MERGE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="EmailGrid"
          component={ConceptFlowVideo}
          durationInFrames={flowDuration('campana-email', 1)}
          defaultProps={{ conceptId: 'campana-email', teaserBeats: 1 }}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="EmailCompose"
          component={EmailComposeScene}
          durationInFrames={EMAIL_COMPOSE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="CampaignLive"
          component={CampaignLiveScene}
          durationInFrames={CAMPAIGN_LIVE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
      </Folder>

      {/* ── Atención al cliente ── mini-película (5 actos) */}
      <Folder name="Support">
        <Composition
          id="Support"
          component={SupportFlowVideo}
          durationInFrames={SUPPORT_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="MessageStorm"
          component={MessageStormScene}
          durationInFrames={MESSAGE_STORM_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="ChannelsConnect"
          component={ChannelsConnectScene}
          durationInFrames={CHANNELS_CONNECT_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="SupportGrid"
          component={ConceptFlowVideo}
          durationInFrames={flowDuration('soporte-cliente', 1)}
          defaultProps={{ conceptId: 'soporte-cliente', teaserBeats: 1 }}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="SupportChat"
          component={SupportChatScene}
          durationInFrames={SUPPORT_CHAT_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="SupportResolved"
          component={SupportResolvedScene}
          durationInFrames={SUPPORT_RESOLVED_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
      </Folder>

      {/* ── Planificación de horarios ── mini-película (5 actos) + ScheduleFill (clip embebido) */}
      <Folder name="Scheduling">
        <Composition
          id="Scheduling"
          component={SchedulingFlowVideo}
          durationInFrames={SCHEDULING_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="ShiftChaos"
          component={ShiftChaosScene}
          durationInFrames={SHIFT_CHAOS_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="StaffImport"
          component={StaffImportScene}
          durationInFrames={STAFF_IMPORT_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="SchedulingRules"
          component={SchedulingRulesScene}
          durationInFrames={SCHEDULING_RULES_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="SchedulingGrid"
          component={ConceptFlowVideo}
          durationInFrames={flowDuration('planificacion-horarios', 1)}
          defaultProps={{ conceptId: 'planificacion-horarios', teaserBeats: 1 }}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="ScheduleTemplate"
          component={ScheduleTemplateScene}
          durationInFrames={SCHEDULE_TEMPLATE_DURATION}
          fps={FPS}
          width={1920}
          height={1080}
        />
        <Composition
          id="ScheduleResults"
          component={ScheduleResultsScene}
          durationInFrames={SCHEDULE_RESULTS_DURATION}
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
      </Folder>

      {/* ── Composiciones sueltas (demos previas, audio-reactivas, print) ── */}
      <Composition
        id="GridEmerge"
        component={GridEmergeVideo}
        durationInFrames={GRID_EMERGE_DURATION}
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
        id="StoreFlow"
        component={StoreFlowVideo}
        durationInFrames={STORE_FLOW_DURATION}
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
      <Composition
        id="StorePitch"
        component={StorePitchVideo}
        durationInFrames={STORE_PITCH_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="SourcesActions"
        component={SourcesActionsVideo}
        durationInFrames={SOURCES_ACTIONS_DURATION}
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
        id="StoreCreateVideo"
        component={StoreCreateVideo}
        durationInFrames={STORE_CREATE_VIDEO_DURATION}
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
