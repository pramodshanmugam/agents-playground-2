import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Inter } from "next/font/google";
import Head from "next/head";
import { useCallback, useState, useEffect, useMemo } from "react";
import { unsafe_createClientWithApiKey } from "@anam-ai/js-sdk";

import { PlaygroundConnect } from "@/components/PlaygroundConnect";
import Playground from "@/components/playground/Playground";
import { PlaygroundToast } from "@/components/toast/PlaygroundToast";
import { ConfigProvider, useConfig } from "@/hooks/useConfig";
import {
  ConnectionMode,
  ConnectionProvider,
  useConnection,
} from "@/hooks/useConnection";
import { ToastProvider, useToast } from "@/components/toast/ToasterProvider";

const themeColors = [
  "cyan",
  "green",
  "amber",
  "blue",
  "violet",
  "rose",
  "pink",
  "teal",
];

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <ToastProvider>
      <ConfigProvider>
        <ConnectionProvider>
          <HomeInner />
        </ConnectionProvider>
      </ConfigProvider>
    </ToastProvider>
  );
}

export function HomeInner() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } =
    useConnection();
  const { config } = useConfig();
  const { toastMessage, setToastMessage } = useToast();

  const [anamClient, setAnamClient] = useState<ReturnType<
    typeof unsafe_createClientWithApiKey
  > | null>(null);
  const [customWsUrl, setCustomWsUrl] = useState(
    "wss://taxagent-93a9x17o.livekit.cloud"
  );
  const [customToken, setCustomToken] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2aWRlbyI6eyJyb29tSm9pbiI6dHJ1ZSwicm9vbSI6ImFiYyIsImNhblB1Ymxpc2giOnRydWUsImNhblN1YnNjcmliZSI6dHJ1ZSwiY2FuUHVibGlzaERhdGEiOnRydWV9LCJhdHRyaWJ1dGVzIjp7ImNhbmRpZGF0ZV9uYW1lIjoicHJhbW9kIiwiaW50ZXJ2aWV3X2Rpc3BsYXlfaWQiOiJhYmMiLCJhc3NpZ25tZW50X2lkIjoiYXNzaWdubWVudF9pZCIsInZpc2FfaWQiOiIxIn0sInJvb21Db25maWciOnsiYWdlbnRzIjpbeyJhZ2VudE5hbWUiOiJjYXJlZXJjb25uZWN0In1dfSwic3ViIjoicHJhbW9kIiwiaXNzIjoiQVBJQ1N0WmdMRms4N0g3IiwibmJmIjoxNzQxMzY2ODU3LCJleHAiOjE3NDEzODg0NTd9.vlMLrf05WZQUcVvHkWjA_-DOlUAJbvyyYtPUOyvfh3s"
  );
  const [talkMessage, setTalkMessage] = useState("");

  // Initialize Anam Client once
  useEffect(() => {
    const client = unsafe_createClientWithApiKey(
      // Replace with your API key if needed
      "OGUyZDRmNjQtODgxMy00OTY1LWJkY2ItNjdjMzRmY2E2Mzg1OjJGaHpKREg1QUJodTZNZVJVVFV2R1d0Q29WNnNoZExLc2pxL0U0R1duRzg9",
      {
        personaId: "b3c78602-0552-4a20-a217-d6f6c5402fd5",
        disableBrains: true,
      }
    );
    setAnamClient(client);
  }, []);

  // Start/stop streaming when shouldConnect changes
  useEffect(() => {
    if (anamClient && shouldConnect) {
      // Ensure the video and audio elements exist before calling this
      anamClient.streamToVideoAndAudioElements(
        "video-element-id",
        "audio-element-id"
      );
    }
    return () => {
      if (anamClient) {
        anamClient.stopStreaming();
      }
    };
  }, [anamClient, shouldConnect]);

  const handleConnect = useCallback(
    async (c: boolean, connectMode: ConnectionMode) => {
      c ? connect(connectMode) : disconnect();
    },
    [connect, disconnect]
  );

  // Determine whether to show the Playground UI
  const showPG = useMemo(() => {
    if (process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      return true;
    }
    if (wsUrl) {
      return true;
    }
    return false;
  }, [wsUrl]);

  // Handle sending a talk command to the Anam AI persona
  const handleTalk = () => {
    if (anamClient && talkMessage.trim()) {
      anamClient.talk(talkMessage.trim());
    } else {
      setToastMessage({
        message: "No message to send or Anam Client not ready",
        type: "error",
      });
    }
  };

  return (
    <>
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta
          property="og:image"
          content="https://livekit.io/images/og/agents-playground.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="relative flex flex-col justify-center px-4 items-center h-full w-full bg-black repeating-square-background">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              className="left-0 right-0 top-0 absolute z-10"
              initial={{ opacity: 0, translateY: -50 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -50 }}
            >
              <PlaygroundToast />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video and Audio elements for AnamClient */}
        <video
          id="video-element-id"
          autoPlay
          playsInline
          style={{ width: "400px", background: "black" }}
        />
        <audio id="audio-element-id" autoPlay />

        {/* Connection UI */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="WebSocket URL"
            value={customWsUrl}
            onChange={(e) => setCustomWsUrl(e.target.value)}
            className="text-black"
          />
          <input
            type="text"
            placeholder="Room Token"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            className="text-black"
          />
          <button
            onClick={() => {
              if (customWsUrl && customToken) {
                connect("manual");
              } else {
                setToastMessage({
                  message: "Please provide both WebSocket URL and Room Token",
                  type: "error",
                });
              }
            }}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Connect
          </button>
        </div>

        {/* Talk Command UI */}
        <div className="flex flex-col gap-4 mt-4">
          <input
            type="text"
            placeholder="Enter custom message for persona"
            value={talkMessage}
            onChange={(e) => setTalkMessage(e.target.value)}
            className="text-black p-2"
          />
          <button
            onClick={handleTalk}
            className="bg-green-500 text-white p-2 rounded"
          >
            Send Talk Command
          </button>
        </div>

        {showPG ? (
          <LiveKitRoom
            className="flex flex-col h-full w-full"
            serverUrl={customWsUrl || wsUrl}
            token={customToken || token}
            connect={shouldConnect}
            onError={(e) => {
              setToastMessage({ message: e.message, type: "error" });
              console.error(e);
            }}
          >
            <Playground
              themeColors={themeColors}
              onConnect={(c) => {
                const connectMode = process.env.NEXT_PUBLIC_LIVEKIT_URL
                  ? "env"
                  : mode;
                handleConnect(c, connectMode);
              }}
            />
            <RoomAudioRenderer />
            <StartAudio label="Click to enable audio playback" />
          </LiveKitRoom>
        ) : (
          <PlaygroundConnect
            accentColor={themeColors[0]}
            onConnectClicked={(connectMode) => {
              handleConnect(true, connectMode);
            }}
          />
        )}
      </main>
    </>
  );
}
