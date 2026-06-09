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

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
