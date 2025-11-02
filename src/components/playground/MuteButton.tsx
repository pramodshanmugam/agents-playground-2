import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";

export const MuteButton = () => {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [error, setError] = useState<string | null>(null);

  const toggleMicrophone = async () => {
    setError(null);
    
    if (!localParticipant) {
      setError("Not connected to room");
      return;
    }

    try {
      // Enable/disable microphone - this will trigger browser permission popup if not already granted
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error: any) {
      console.error("Error toggling microphone:", error);
      
      // Handle specific permission errors
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || 
          error.message?.includes('permission') || error.message?.includes('NotAllowed')) {
        setError("Microphone blocked. Click the lock icon in address bar → Reset permissions → Allow microphone");
      } else if (error.name === 'NotFoundError' || error.message?.includes('not found')) {
        setError("No microphone found on this device");
      } else {
        setError(error.message || "Failed to toggle microphone");
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMicrophone}
        className="px-6 py-3 bg-gray-900 text-white border border-gray-800 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
        aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
      >
      {isMicrophoneEnabled ? (
        // Unmuted - Show microphone icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ) : (
        // Muted - Show microphone with slash icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
      <span>{isMicrophoneEnabled ? "Unmuted" : "Muted"}</span>
      </button>
      {error && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-900 text-white text-xs px-3 py-2 rounded shadow-lg z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

