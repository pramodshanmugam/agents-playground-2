"use client";

import { useRef, useCallback, useEffect } from "react";
import { AnamClient, unsafe_createClientWithApiKey, createClient } from "@anam-ai/js-sdk";

// Read credentials from env variables.
const API_KEY = process.env.NEXT_PUBLIC_ANAM_API_KEY || "";
const PERSONA_ID = process.env.NEXT_PUBLIC_ANAM_PERSONA_ID || "";
const isEnabled = process.env.NEXT_PUBLIC_ANAM_ENABLED === "true";

export function useAnamAi() {
  // Client instance ref.
  const clientRef = useRef<AnamClient | null>(null);

  // Refs for text streaming.
  const talkStreamRef = useRef<any>(null);
  const queuedChunksRef = useRef<string[]>([]);
  const endTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the client only if credentials are provided and Anam is enabled.
  useEffect(() => {
    if (!isEnabled) {
      console.info("Anam not enabled; skipping AnamClient init.");
      return;
    }
    if (!API_KEY || !PERSONA_ID) {
      console.warn("Anam AI credentials not provided. Anam functionalities are disabled.");
      return;
    }
    if (!clientRef.current) {
      try {
        const client = unsafe_createClientWithApiKey(API_KEY, {
          personaId: PERSONA_ID,
          disableBrains: true,
        });
        clientRef.current = client;
        const onConnectionEstablished = () => {
          console.log("[Anam] CONNECTION_ESTABLISHED; can safely talk now.");
          client.talk("Hello from Anam avatar!");
        };
        client.addListener("CONNECTION_ESTABLISHED", onConnectionEstablished);
        return () => {
          client.removeListener("CONNECTION_ESTABLISHED", onConnectionEstablished);
        };
      } catch (err) {
        console.error("Error creating Anam client:", err);
        clientRef.current = null;
      }
    }
  }, []);

  const startStreaming = useCallback(async (videoId: string, audioId: string) => {
    if (!clientRef.current) return;
    console.info("[Anam] Starting stream...");
    try {
      await clientRef.current.streamToVideoAndAudioElements(videoId, audioId);
      console.info("[Anam] Stream started successfully.");
    } catch (err) {
      console.error("[Anam] Failed to start streaming:", err);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.stopStreaming().catch((err) => {
      console.error("[Anam] Failed to stop streaming:", err);
    });
  }, []);

  const talk = useCallback((text: string) => {
    if (!clientRef.current) return;
    console.info("[Anam] talk() called with text:", text);
    clientRef.current.talk(text);
  }, []);

  const createTalkMessageStream = useCallback(() => {
    if (!clientRef.current) return null;
    return clientRef.current.createTalkMessageStream();
  }, []);

  // flushQueue: Create a talk stream and stream all queued text as one message.
  const flushQueue = useCallback(() => {
    if (queuedChunksRef.current.length === 0) return;
    if (!talkStreamRef.current || !talkStreamRef.current.isActive()) {
      talkStreamRef.current = createTalkMessageStream();
    }
    if (talkStreamRef.current && talkStreamRef.current.isActive()) {
      const fullMessage = queuedChunksRef.current.join(" ");
      console.log("[AnamTextStream] Flushing queued chunks:", queuedChunksRef.current, "Combined:", fullMessage);
      talkStreamRef.current.streamMessageChunk(fullMessage, true);
    }
    queuedChunksRef.current = [];
    talkStreamRef.current = null;
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current);
      endTurnTimeoutRef.current = null;
    }
  }, [createTalkMessageStream]);

  /**
   * streamTranscript: This function is intended for use as the onAgentTranscript callback.
   * It queues incoming text chunks and flushes them when the current turn ends
   * (either via a final flag or after a 1500ms pause).
   */
  const streamTranscript = useCallback((newWords: string, isFinal: boolean) => {
    console.log("[AnamTextStream] Received chunk:", newWords, "isFinal:", isFinal);
    queuedChunksRef.current.push(newWords);
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current);
    }
    if (isFinal) {
      flushQueue();
    } else {
      endTurnTimeoutRef.current = setTimeout(() => {
        flushQueue();
      }, 1500);
    }
  }, [flushQueue]);

  return {
    anamClient: clientRef.current,
    startStreaming,
    stopStreaming,
    talk,
    createTalkMessageStream,
    streamTranscript,
    isEnabled, // <-- Return isEnabled so it can be used in Playground.tsx
  };
}
