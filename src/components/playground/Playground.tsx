"use client";

import { useEffect, useMemo, useState } from "react";
// (Other imports remain unchanged)
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { ChatMessageType } from "@/components/chat/ChatTile";
import { ColorPicker } from "@/components/colorPicker/ColorPicker";
import { AudioInputTile } from "@/components/config/AudioInputTile";
import { ConfigurationPanelItem } from "@/components/config/ConfigurationPanelItem";
import { NameValueRow } from "@/components/config/NameValueRow";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import {
  PlaygroundTab,
  PlaygroundTabbedTile,
  PlaygroundTile,
} from "@/components/playground/PlaygroundTile";
import { useConfig } from "@/hooks/useConfig";
import { TranscriptionTile } from "@/transcriptions/TranscriptionTile";
import {
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useRoomInfo,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { QRCodeSVG } from "qrcode.react";
import tailwindTheme from "../../lib/tailwindTheme.preval";

// Import the combined Anam hook.
import { useAnamAi } from "@/hooks/useAnamAi";

export interface PlaygroundMeta {
  name: string;
  value: string;
}

export interface PlaygroundProps {
  logo?: React.ReactNode;
  themeColors: string[];
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

const headerHeight = 56;

export default function Playground({
  logo,
  themeColors,
  onConnect,
}: PlaygroundProps) {
  const { config, setUserSettings } = useConfig();
  const { name } = useRoomInfo();
  const [transcripts, setTranscripts] = useState<ChatMessageType[]>([]);
  const { localParticipant } = useLocalParticipant();
  const voiceAssistant = useVoiceAssistant();
  const roomState = useConnectionState();
  const tracks = useTracks();

  // Use the combined Anam hook.
  const {
    startStreaming,
    stopStreaming,
    talk,
    createTalkMessageStream,
    streamTranscript,
  } = useAnamAi();
  const [hasStarted, setHasStarted] = useState(false);

  // Now pass streamTranscript as the onAgentTranscript callback.
  const chatTileContent = useMemo(() => {
    if (voiceAssistant.audioTrack) {
      return (
        <TranscriptionTile
          agentAudioTrack={voiceAssistant.audioTrack}
          accentColor={config.settings.theme_color}
          onAgentTranscript={streamTranscript}
        />
      );
    }
    return null;
  }, [voiceAssistant.audioTrack, config.settings.theme_color, streamTranscript]);

  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      startStreaming("anam-video", "anam-audio");
    }
    return () => {
      // Optionally stop streaming on unmount.
      // stopStreaming();
    };
  }, [hasStarted, startStreaming, stopStreaming]);

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setCameraEnabled(config.settings.inputs.camera);
      localParticipant.setMicrophoneEnabled(config.settings.inputs.mic);
    }
  }, [config, localParticipant, roomState]);

  const agentVideoTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Video &&
      trackRef.participant.isAgent
  );
  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  );
  const localVideoTrack = localTracks.find((t) => t.source === Track.Source.Camera);
  const localMicTrack = localTracks.find((t) => t.source === Track.Source.Microphone);

  const videoTileContent = useMemo(() => {
    const videoFitClassName = `object-${config.video_fit || "cover"}`;
    if (roomState === ConnectionState.Disconnected) {
      return (
        <div className="flex items-center justify-center text-gray-700 text-center w-full h-full">
          No video track. Connect to get started.
        </div>
      );
    }
    if (!agentVideoTrack) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center h-full w-full">
          <LoadingSVG />
          Waiting for agent video track
        </div>
      );
    }
    return (
      <div className="flex flex-col w-full grow text-gray-950 bg-black rounded-sm border border-gray-800 relative">
        <VideoTrack
          trackRef={agentVideoTrack}
          className={`absolute top-1/2 -translate-y-1/2 ${videoFitClassName} object-position-center w-full h-full`}
        />
      </div>
    );
  }, [agentVideoTrack, config.video_fit, roomState]);

  const audioTileContent = useMemo(() => (
    <div className="flex flex-col items-center justify-center text-gray-700 text-center w-full h-full">
      <p>Agent's LiveKit audio is disabled.</p>
      <p>Only using Anam for audio output.</p>
    </div>
  ), []);

  const settingsTileContent = useMemo(() => (
    <div className="flex flex-col gap-4 h-full w-full items-start overflow-y-auto">
      {config.description && (
        <ConfigurationPanelItem title="Description">
          {config.description}
        </ConfigurationPanelItem>
      )}
      <ConfigurationPanelItem title="Settings">
        {localParticipant && (
          <div className="flex flex-col gap-2">
            <NameValueRow name="Room" value={name} valueColor={`${config.settings.theme_color}-500`} />
            <NameValueRow name="Participant" value={localParticipant.identity} />
          </div>
        )}
      </ConfigurationPanelItem>
      <ConfigurationPanelItem title="Status">
        <div className="flex flex-col gap-2">
          <NameValueRow
            name="Room connected"
            value={
              roomState === ConnectionState.Connecting ? (
                <LoadingSVG diameter={16} strokeWidth={2} />
              ) : (
                roomState.toUpperCase()
              )
            }
            valueColor={roomState === ConnectionState.Connected ? `${config.settings.theme_color}-500` : "gray-500"}
          />
          <NameValueRow
            name="Agent connected"
            value={
              voiceAssistant.agent ? "TRUE" : roomState === ConnectionState.Connected ? <LoadingSVG diameter={12} strokeWidth={2} /> : "FALSE"
            }
            valueColor={voiceAssistant.agent ? `${config.settings.theme_color}-500` : "gray-500"}
          />
        </div>
      </ConfigurationPanelItem>
      {localVideoTrack && (
        <ConfigurationPanelItem title="Camera" deviceSelectorKind="videoinput">
          <div className="relative">
            <VideoTrack className="rounded-sm border border-gray-800 opacity-70 w-full" trackRef={localVideoTrack} />
          </div>
        </ConfigurationPanelItem>
      )}
      {localMicTrack && (
        <ConfigurationPanelItem title="Microphone" deviceSelectorKind="audioinput">
          <AudioInputTile trackRef={localMicTrack} />
        </ConfigurationPanelItem>
      )}
      <ConfigurationPanelItem title="Color">
        <ColorPicker
          colors={themeColors}
          selectedColor={config.settings.theme_color}
          onSelect={(color) => {
            const userSettings = { ...config.settings };
            userSettings.theme_color = color;
            setUserSettings(userSettings);
          }}
        />
      </ConfigurationPanelItem>
      {config.show_qr && (
        <ConfigurationPanelItem title="QR Code">
          <QRCodeSVG value={window.location.href} width="128" />
        </ConfigurationPanelItem>
      )}
    </div>
  ), [config.description, config.settings, localParticipant, name, roomState, localVideoTrack, localMicTrack, themeColors, setUserSettings, voiceAssistant.agent]);

  let mobileTabs: PlaygroundTab[] = [];
  if (config.settings.outputs.video) {
    mobileTabs.push({
      title: "Video",
      content: (
        <PlaygroundTile className="w-full h-full grow" childrenClassName="justify-center">
          {videoTileContent}
        </PlaygroundTile>
      ),
    });
  }
  if (config.settings.outputs.audio) {
    mobileTabs.push({
      title: "Audio",
      content: (
        <PlaygroundTile className="w-full h-full grow" childrenClassName="justify-center">
          {audioTileContent}
        </PlaygroundTile>
      ),
    });
  }
  if (config.settings.chat) {
    mobileTabs.push({
      title: "Chat",
      content: chatTileContent ?? null,
    });
  }
  mobileTabs.push({
    title: "Settings",
    content: (
      <PlaygroundTile
        padding={false}
        backgroundColor="gray-950"
        className="h-full w-full basis-1/4 items-start overflow-y-auto flex"
        childrenClassName="h-full grow items-start"
      >
        {settingsTileContent}
      </PlaygroundTile>
    ),
  });

  useEffect(() => {
    document.body.style.setProperty(
      "--lk-theme-color",
      // @ts-ignore
      tailwindTheme.colors[config.settings.theme_color]["500"]
    );
    document.body.style.setProperty("--lk-drop-shadow", `var(--lk-theme-color) 0px 0px 18px`);
  }, [config.settings.theme_color]);

  useEffect(() => {
    console.log("All tracks:", tracks);
  }, [tracks]);

  useEffect(() => {
    const muteLiveKitAudio = () => {
      const audioElements = Array.from(document.querySelectorAll("audio")).filter(
        (el) => (el as HTMLAudioElement).id !== "anam-audio"
      );
      audioElements.forEach((el) => {
        (el as HTMLAudioElement).muted = true;
      });
      console.log("Muted LiveKit audio elements:", audioElements);
    };

    const initialTimeout = setTimeout(muteLiveKitAudio, 1000);
    const observer = new MutationObserver(() => {
      muteLiveKitAudio();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(initialTimeout);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <video id="anam-video" autoPlay playsInline />
      <audio id="anam-audio" autoPlay />

      <PlaygroundHeader
        title={config.title}
        logo={logo}
        githubLink={config.github_link}
        height={headerHeight}
        accentColor={config.settings.theme_color}
        connectionState={roomState}
        onConnectClicked={() => onConnect(roomState === ConnectionState.Disconnected)}
      />

      <div className={`flex gap-4 py-4 grow w-full selection:bg-${config.settings.theme_color}-900`} style={{ height: `calc(100% - ${headerHeight}px)` }}>
        <div className="flex flex-col grow basis-1/2 gap-4 h-full lg:hidden">
          <PlaygroundTabbedTile className="h-full" tabs={mobileTabs} initialTab={mobileTabs.length - 1} />
        </div>
        <div className={`flex-col grow basis-1/2 gap-4 h-full hidden lg:${!config.settings.outputs.audio && !config.settings.outputs.video ? "hidden" : "flex"}`}>
          {config.settings.outputs.video && (
            <PlaygroundTile title="Video" className="w-full h-full grow" childrenClassName="justify-center">
              {videoTileContent}
            </PlaygroundTile>
          )}
          {config.settings.outputs.audio && (
            <PlaygroundTile title="Audio" className="w-full h-full grow" childrenClassName="justify-center">
              {audioTileContent}
            </PlaygroundTile>
          )}
        </div>
        {config.settings.chat && (
          <PlaygroundTile title="Chat" className="h-full grow basis-1/4 hidden lg:flex">
            {chatTileContent}
          </PlaygroundTile>
        )}
        <PlaygroundTile
          padding={false}
          backgroundColor="gray-950"
          className="h-full w-full basis-1/4 items-start overflow-y-auto hidden max-w-[480px] lg:flex"
          childrenClassName="h-full grow items-start"
        >
          {settingsTileContent}
        </PlaygroundTile>
      </div>
    </>
  );
}
