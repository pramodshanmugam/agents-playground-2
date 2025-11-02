"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import { PlaygroundTile } from "@/components/playground/PlaygroundTile";
import { useConfig } from "@/hooks/useConfig";
import { TranscriptionTile } from "@/transcriptions/TranscriptionTile";
import {
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";
import { MuteButton } from "./MuteButton";
import { ConnectionState, Track } from "livekit-client";
import { ReactNode, useEffect, useMemo } from "react";
import tailwindTheme from "../../lib/tailwindTheme.preval";

export interface PlaygroundMeta {
  name: string;
  value: string;
}

export interface PlaygroundProps {
  logo?: ReactNode;
  themeColors: string[];
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

const headerHeight = 56;

export default function Playground({
  logo,
  themeColors,
  onConnect,
}: PlaygroundProps) {
  const { config } = useConfig();
  const { localParticipant } = useLocalParticipant();

  const voiceAssistant = useVoiceAssistant();

  const roomState = useConnectionState();
  const tracks = useTracks();

  useEffect(() => {
    // Only disable camera automatically - microphone requires user permission
    // Browsers require user interaction (click) before granting mic access
    // So we let the user enable mic via the mute button which requires a click
    if (
      roomState === ConnectionState.Connected &&
      localParticipant &&
      typeof localParticipant.setCameraEnabled === "function"
    ) {
      try {
        // Disable camera (doesn't require permission)
        localParticipant.setCameraEnabled(false);
        // Don't auto-enable microphone - user must click mute button
        // This ensures browser permission prompt works properly
      } catch (error) {
        console.warn("Could not disable camera:", error);
      }
    }
  }, [localParticipant, roomState]);

  const agentVideoTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Video &&
      trackRef.participant.isAgent,
  );


  const videoTileContent = useMemo(() => {
    const videoFitClassName = `object-${config.video_fit || "contain"}`;

    const disconnectedContent = (
      <div className="flex items-center justify-center text-gray-700 text-center w-full h-full">
        No agent video track. Connect to get started.
      </div>
    );

    const loadingContent = (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-700 text-center h-full w-full">
        <LoadingSVG />
        Waiting for agent video track…
      </div>
    );

    const videoContent = (
      <VideoTrack
        trackRef={agentVideoTrack}
        className={`absolute top-1/2 -translate-y-1/2 ${videoFitClassName} object-position-center w-full h-full`}
      />
    );

    let content = null;
    if (roomState === ConnectionState.Disconnected) {
      content = disconnectedContent;
    } else if (agentVideoTrack) {
      content = videoContent;
    } else {
      content = loadingContent;
    }

    return (
      <div className="flex flex-col w-full grow text-gray-950 bg-black rounded-sm border border-gray-800 relative">
        {content}
      </div>
    );
  }, [agentVideoTrack, config, roomState]);

  useEffect(() => {
    document.body.style.setProperty(
      "--lk-theme-color",
      // @ts-ignore
      tailwindTheme.colors[config.settings.theme_color]["500"],
    );
    document.body.style.setProperty(
      "--lk-drop-shadow",
      `var(--lk-theme-color) 0px 0px 18px`,
    );
  }, [config.settings.theme_color]);


  const chatTileContent = useMemo(() => {
    if (voiceAssistant.agent) {
      return (
        <TranscriptionTile
          agentAudioTrack={voiceAssistant.audioTrack}
          accentColor={config.settings.theme_color}
        />
      );
    }
    return <></>;
  }, [
    config.settings.theme_color,
    voiceAssistant.audioTrack,
    voiceAssistant.agent,
  ]);


  return (
    <>
      <PlaygroundHeader
        title={config.title}
        logo={logo}
        githubLink={config.github_link}
        height={headerHeight}
        accentColor={config.settings.theme_color}
        connectionState={roomState}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected)
        }
      />
      <div
        className={`flex gap-4 py-4 grow w-full selection:bg-${config.settings.theme_color}-900 justify-center`}
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div className="flex gap-4 w-1/4">
          {/* Video Section - Main area */}
          <div className="flex flex-col grow gap-4 h-full">
            <PlaygroundTile
              className="w-full h-full grow"
              childrenClassName="justify-center"
              padding={false}
            >
              {videoTileContent}
            </PlaygroundTile>
            {/* Mute Button */}
            <div className="flex justify-center items-center py-2">
              <MuteButton />
            </div>
          </div>

          {/* Chat Section */}
          {/* {config.settings.chat && (
            <PlaygroundTile
              className="h-full grow basis-3/5"
            >
              {chatTileContent}
            </PlaygroundTile>
          )} */}
        </div>
      </div>
    </>
  );
}
