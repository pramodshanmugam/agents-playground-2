// hooks/useAnamAi.ts
"use client";

import { useRef, useCallback, useEffect } from "react";
import { AnamClient, unsafe_createClientWithApiKey, createClient } from "@anam-ai/js-sdk";

// Read credentials from environment variables.
const API_KEY = process.env.NEXT_PUBLIC_ANAM_API_KEY || "";
const PERSONA_ID = process.env.NEXT_PUBLIC_ANAM_PERSONA_ID || "";

export function useAnamAi() {
  // Client instance ref.
  const clientRef = useRef<AnamClient | null>(null);

  // Initialize the client if credentials are provided.
  useEffect(() => {
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

  // --- TEXT STREAMING LOGIC ---

  // Ref to store the active talk stream.
  const talkStreamRef = useRef<any>(null);
  // Ref to accumulate incoming text chunks.
  const queuedChunksRef = useRef<string[]>([]);
  // Ref for debounce timer.
  const endTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // flushQueue creates a new talk stream (if needed) and streams all queued text.
  const flushQueue = useCallback(() => {
    if (queuedChunksRef.current.length === 0) return;
    // Ensure we have an active talk stream.
    if (!talkStreamRef.current || !talkStreamRef.current.isActive()) {
      talkStreamRef.current = createTalkMessageStream();
    }
    if (talkStreamRef.current && talkStreamRef.current.isActive()) {
      const fullMessage = queuedChunksRef.current.join(" ");
      console.log("[AnamTextStream] Flushing queued chunks:", queuedChunksRef.current, "Combined:", fullMessage);
      // Stream the full combined message as final.
      talkStreamRef.current.streamMessageChunk(fullMessage, true);
    }
    // Clear the queue and reset the stream and timer.
    queuedChunksRef.current = [];
    talkStreamRef.current = null;
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current);
      endTurnTimeoutRef.current = null;
    }
  }, [createTalkMessageStream]);

  /**
   * streamTranscript: This function is meant to be used as the onAgentTranscript
   * callback. It receives newWords (a string) and a boolean flag isFinal.
   *
   * - It pushes newWords into a queue.
   * - If isFinal is true, or if no new words arrive for a debounce period (1500ms),
   *   it flushes the queue by creating a talk stream and streaming the combined message.
   */
  const streamTranscript = useCallback((newWords: string, isFinal: boolean) => {
    console.log("[AnamTextStream] Received chunk:", newWords, "isFinal:", isFinal);
    queuedChunksRef.current.push(newWords);
    // Clear any existing debounce timer.
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current);
    }
    if (isFinal) {
      flushQueue();
    } else {
      // Wait 1500ms after the last word before flushing.
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
  };
}
