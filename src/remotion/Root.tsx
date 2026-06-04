import { Composition } from 'remotion';
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
import { MotionShowcaseVideo, MOTION_SHOWCASE_DURATION } from './MotionShowcaseVideo';
import { StoreCreateVideo, STORE_CREATE_DURATION } from './StoreCreateVideo';
import { ObjectiveVideo, OBJECTIVE_DURATION } from './ObjectiveVideo';
import { TextShowcaseVideo, TEXT_SHOWCASE_DURATION } from './TextShowcaseVideo';
import { TextRevealVideo, TEXT_REVEAL_DURATION } from './TextRevealVideo';
import { GridRevealVideo, GRID_REVEAL_DEFAULTS, calculateGridRevealMetadata } from './GridRevealVideo';
import { PrintPageVideo, calculatePrintMetadata } from './PrintPageVideo';

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
        id="SourcesActions"
        component={SourcesActionsVideo}
        durationInFrames={SOURCES_ACTIONS_DURATION}
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
