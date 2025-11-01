"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";

type OneClickConnectProps = {
  onConnect: (wsUrl: string, token: string) => void;
  accentColor: string;
};

export const OneClickConnect = ({ onConnect, accentColor }: OneClickConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomRoom = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let room = "room-";
    for (let i = 0; i < 12; i++) {
      room += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return room;
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Generate random room name
      const roomName = generateRandomRoom();
      
      // Call your token endpoint
      const response = await fetch("http://localhost:5000/getAdvancedToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identity: `user-${Math.random().toString(36).substring(7)}`,
          name: "User",
          room: roomName,
          can_publish: true,
          can_subscribe: true,
          metadata: "user_type:participant",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Get WebSocket URL from environment
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      
      if (!wsUrl) {
        throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set in environment variables");
      }

      // Handle different token response formats
      const token = data.token || data.accessToken || data;
      if (!token || typeof token !== 'string') {
        throw new Error("Invalid token response from server");
      }

      // Connect with the token and URL
      onConnect(wsUrl, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo-slogan.png"
          alt="Avatalk"
          width={300}
          height={150}
          className="w-auto h-auto"
          priority
        />
      </div>

      {/* Connect Button */}
      <div className="flex flex-col items-center gap-4">
        <Button
          accentColor={accentColor}
          onClick={handleConnect}
          disabled={isConnecting}
          className="px-8 py-4 text-lg min-w-[200px] flex items-center justify-center"
        >
          {isConnecting ? (
            <>
              <LoadingSVG />
              <span className="ml-2">Connecting...</span>
            </>
          ) : (
            "Connect to Avatalk"
          )}
        </Button>

        {error && (
          <div className="text-red-500 text-sm text-center max-w-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

