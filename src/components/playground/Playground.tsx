"use client";

// --- REACT & ANAM IMPORTS ---
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  AnamClient,
  unsafe_createClientWithApiKey,
} from "@anam-ai/js-sdk";

// --- LIVEKIT & YOUR COMPONENT IMPORTS ---
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

function useAnamClient() {
  const API_KEY =
    "Y2FjYmJhMmMtMTQ4Ni00MjE1LTkzYjYtNjRmOTk3MTZkZGNhOitQYWhKdTNhT0UwRmVCaS9vQ09HV1hIWU1KTnNDdXlvaFBHWmhZUCtJL2M9";
  const PERSONA_ID = "1a5588b4-a717-468c-ad8b-03b323e78e78";

  const anamClientRef = useRef<AnamClient | null>(null);

  useEffect(() => {
    if (anamClientRef.current) return;
    const client = unsafe_createClientWithApiKey(API_KEY, {
      personaId: PERSONA_ID,
      disableBrains: true,
    });
    anamClientRef.current = client;

    const onConnectionEstablished = () => {
      console.log("[Anam] CONNECTION_ESTABLISHED; can safely talk now.");
      client.talk("Hello from Anam avatar!");
    };
    client.addListener("CONNECTION_ESTABLISHED", onConnectionEstablished);
    return () => {
      client.removeListener("CONNECTION_ESTABLISHED", onConnectionEstablished);
    };
  }, []);

  async function startStreaming(videoId: string, audioId: string) {
    if (!anamClientRef.current) return;
    console.log("[Anam] Starting stream...");
    try {
      await anamClientRef.current.streamToVideoAndAudioElements(videoId, audioId);
      console.log("[Anam] Stream started successfully.");
    } catch (err) {
      console.error("[Anam] Failed to start streaming:", err);
    }
  }

  function stopStreaming() {
    if (!anamClientRef.current) return;
    anamClientRef.current.stopStreaming().catch((err) => {
      console.error("[Anam] Failed to stop streaming:", err);
    });
  }

  function talk(text: string) {
    if (!anamClientRef.current) return;
    console.log("[Anam] talk() called with text:", text);
    anamClientRef.current.talk(text);
  }

  function createTalkMessageStream() {
    if (!anamClientRef.current) return null;
    return anamClientRef.current.createTalkMessageStream();
  }

  return {
    startStreaming,
    stopStreaming,
    talk,
    createTalkMessageStream,
  };
}

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

  const { startStreaming, stopStreaming, talk, createTalkMessageStream } = useAnamClient();
  const [hasStarted, setHasStarted] = useState(false);

  // Ref for a queue of incoming text chunks.
  // Refs for managing the talk stream and debouncing
const talkStreamRef = useRef<any>(null);
const queuedChunksRef = useRef<string[]>([]);
const endTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // flushQueue: When there is no active talk stream, create one and stream the queued chunks.
  const flushQueue = useCallback(() => {
    if (queuedChunksRef.current.length === 0) return;
    talkStreamRef.current = createTalkMessageStream();
    if (talkStreamRef.current && talkStreamRef.current.isActive()) {
      console.log("[Debug] Flushing queued chunks:", queuedChunksRef.current);
      for (let i = 0; i < queuedChunksRef.current.length; i++) {
        const chunk = queuedChunksRef.current[i];
        const isLast = i === queuedChunksRef.current.length - 1;
        talkStreamRef.current.streamMessageChunk(chunk, isLast);
      }
    }
    // Clear the queue.
    queuedChunksRef.current = [];
    // Reset the talk stream ref after a short delay.
    setTimeout(() => {
      talkStreamRef.current = null;
      // If new chunks arrived in the meantime, flush again.
      if (queuedChunksRef.current.length > 0) {
        flushQueue();
      }
    }, 100);
  }, [createTalkMessageStream]);

  // Custom onAgentTranscript callback: add incoming words to the queue.
  const onAgentTranscript = useCallback((newWords: string, isFinal: boolean) => {
    console.log("[Debug] onAgentTranscript triggered with words:", newWords, "isFinal:", isFinal);
    // Add the new words to the queue.
    queuedChunksRef.current.push(newWords);
    
    // Clear any existing debounce timer.
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current);
    }
    
    // If the segment is final, flush immediately.
    if (isFinal) {
      flushQueue();
    } else {
      // Otherwise, wait for a pause (e.g. 1500ms) before flushing.
      endTurnTimeoutRef.current = setTimeout(() => {
        flushQueue();
      }, 1500);
    }
  }, [flushQueue]);

  const chatTileContent = useMemo(() => {
    if (voiceAssistant.audioTrack) {
      return (
        <TranscriptionTile
          agentAudioTrack={voiceAssistant.audioTrack}
          accentColor={config.settings.theme_color}
          onAgentTranscript={onAgentTranscript}
        />
      );
    }
    return null;
  }, [voiceAssistant.audioTrack, config.settings.theme_color, onAgentTranscript]);

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
