import { Composition } from 'remotion';
import { ConversationVideo, CONVERSATION_DURATION } from './ConversationVideo';
import { CodeTerminalVideo, CODE_TERMINAL_DURATION } from './CodeTerminalVideo';
import { ClientTableVideo, CLIENT_TABLE_DURATION } from './ClientTableVideo';
import { DocumentVideo, DOCUMENT_DURATION } from './DocumentVideo';
import { DocumentsVideo, DOCUMENTS_DURATION } from './DocumentsVideo';
import { StoreFlowVideo, STORE_FLOW_DURATION } from './StoreFlowVideo';
import { StoreBuildVideo, STORE_BUILD_DURATION } from './StoreBuildVideo';
import { ScheduleFillVideo, SCHEDULE_FILL_DURATION } from './ScheduleFillVideo';
import { MusicPulseVideo, MUSIC_PULSE_DURATION, calculateMusicPulseMetadata } from './MusicPulseVideo';
import { PulseOverdriveVideo, PULSE_OVERDRIVE_DURATION, calculatePulseOverdriveMetadata } from './PulseOverdriveVideo';
import { SourcesActionsVideo, SOURCES_ACTIONS_DURATION } from './SourcesActionsVideo';
import { StorePitchVideo, STORE_PITCH_DURATION } from './StorePitchVideo';
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
