// hooks/useAnamClient.ts
"use client";

import {
  AnamClient,
  createClient,
  unsafe_createClientWithApiKey,
} from "@anam-ai/js-sdk";
import { AnamEvent } from "@anam-ai/js-sdk";
// If you need the `Message` type, you can either:
// ^ only use type imports (so they don’t get compiled to JS)

import { useRef, useCallback, useEffect } from "react";

/**
 * Provide your real keys, or handle them more securely (for production).
 */
const API_KEY = process.env.NEXT_PUBLIC_ANAM_API_KEY || "";
const PERSONA_ID = process.env.NEXT_PUBLIC_ANAM_PERSONA_ID || "";

/**
 * Our custom hook to manage the Anam client & streaming logic.
 * You can expand it with more functionality as needed.
 */
export function useAnamClient() {
  // We'll store the client instance in a ref so we don't re-instantiate
  // on every render.
  const anamClientRef = useRef<AnamClient | null>(null);

  /**
   * Creates the client if not already created. For dev usage, we do
   * `unsafe_createClientWithApiKey`. For production, you'd want a short-lived token and use `createClient`.
   */
  const initializeClient = useCallback(() => {
    if (!anamClientRef.current) {
      try {
        const client = unsafe_createClientWithApiKey(API_KEY, {
          personaId: PERSONA_ID,
          // e.g., disableBrains: true, if you want to supply your own LLM
          disableBrains: true,
        });
        anamClientRef.current = client;
      } catch (err) {
        console.error("Error creating Anam client:", err);
        // fallback if something fails
        anamClientRef.current = createClient("dummy-token", {
          personaId: PERSONA_ID,
        });
      }
    }
  }, []);

  /**
   * Start streaming to <video> and <audio> elements in the DOM
   */
  const startStreaming = useCallback(
    async (videoElementId: string, audioElementId: string) => {
      if (!anamClientRef.current) return;
      try {
        console.info("[Anam] starting stream...");
        await anamClientRef.current.streamToVideoAndAudioElements(
          videoElementId,
          audioElementId
        );
        console.info("[Anam] stream started successfully");
      } catch (error) {
        console.error("[Anam] Failed to start streaming:", error);
      }
    },
    []
  );

  /**
   * Stop streaming if it's active
   */
  const stopStreaming = useCallback(() => {
    if (anamClientRef.current) {
      anamClientRef.current.stopStreaming().catch((error) => {
        console.error("[Anam] Failed to stop streaming:", error);
      });
    }
  }, []);

  /**
   * A convenience method to talk through the persona
   */
  const talk = useCallback((text: string) => {
    if (anamClientRef.current) {
      anamClientRef.current.talk(text);
    }
  }, []);

  /**
   * Example for adding event listeners like "connection established"
   */
  useEffect(() => {
    initializeClient();

    const client = anamClientRef.current;
    if (!client) return;

    const onConnectionEstablished = () => {
      console.log("[Anam] CONNECTION_ESTABLISHED: can safely .talk() now!");
    };

    const onConnectionClosed = () => {
      console.log("[Anam] CONNECTION_CLOSED");
    };

    client.addListener(AnamEvent.CONNECTION_ESTABLISHED, onConnectionEstablished);
    client.addListener(AnamEvent.CONNECTION_CLOSED, onConnectionClosed);

    return () => {
      // remove all event listeners on unmount
      client.removeListener(
        AnamEvent.CONNECTION_ESTABLISHED,
        onConnectionEstablished
      );
      client.removeListener(AnamEvent.CONNECTION_CLOSED, onConnectionClosed);
      stopStreaming();
    };
  }, [initializeClient, stopStreaming]);

  return {
    anamClient: anamClientRef.current,
    startStreaming,
    stopStreaming,
    talk,
  };
}
