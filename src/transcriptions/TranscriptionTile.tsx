import { ChatMessageType, ChatTile } from "@/components/chat/ChatTile";
import {
  TrackReferenceOrPlaceholder,
  useChat,
  useLocalParticipant,
  useTrackTranscription,
} from "@livekit/components-react";
import {
  LocalParticipant,
  Participant,
  Track,
  TranscriptionSegment,
} from "livekit-client";
import { useEffect, useState, useRef } from "react";

export interface TranscriptionTileProps {
  agentAudioTrack: TrackReferenceOrPlaceholder;
  accentColor: string;
  onAgentTranscript?: (text: string) => void;
}

export function TranscriptionTile({
  agentAudioTrack,
  accentColor,
  onAgentTranscript,
}: TranscriptionTileProps) {
  const agentMessages = useTrackTranscription(agentAudioTrack);
  const localParticipant = useLocalParticipant();
  const localMessages = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const [transcripts, setTranscripts] = useState<Map<string, ChatMessageType>>(new Map());
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const { chatMessages, send: sendChat } = useChat();

  // Update transcripts map from agent and local segments.
  useEffect(() => {
    agentMessages.segments.forEach((s) => {
      transcripts.set(
        s.id,
        segmentToChatMessage(
          s,
          transcripts.get(s.id),
          agentAudioTrack.participant
        )
      );
    });
    localMessages.segments.forEach((s) => {
      transcripts.set(
        s.id,
        segmentToChatMessage(
          s,
          transcripts.get(s.id),
          localParticipant.localParticipant
        )
      );
    });

    const allMessages = Array.from(transcripts.values());
    for (const msg of chatMessages) {
      const isAgent =
        msg.from?.identity === agentAudioTrack.participant?.identity;
      const isSelf =
        msg.from?.identity === localParticipant.localParticipant.identity;
      let name = msg.from?.name;
      if (!name) {
        name = isAgent ? "Agent" : isSelf ? "You" : "Unknown";
      }
      allMessages.push({
        name,
        message: msg.message,
        timestamp: msg.timestamp,
        isSelf,
      });
    }
    allMessages.sort((a, b) => a.timestamp - b.timestamp);
    setMessages(allMessages);
  }, [
    transcripts,
    chatMessages,
    localParticipant.localParticipant,
    agentAudioTrack.participant,
    agentMessages.segments,
    localMessages.segments,
  ]);

  // Call onAgentTranscript when a new final agent segment arrives.
  const lastSpokenSegmentIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (onAgentTranscript && agentMessages.segments.length > 0) {
      const lastSegment = agentMessages.segments[agentMessages.segments.length - 1];
      if (lastSegment.final && lastSegment.id !== lastSpokenSegmentIdRef.current) {
        lastSpokenSegmentIdRef.current = lastSegment.id;
        onAgentTranscript(lastSegment.text);
      }
    }
  }, [agentMessages.segments, onAgentTranscript]);

  return (
    <ChatTile messages={messages} accentColor={accentColor} onSend={sendChat} />
  );
}

function segmentToChatMessage(
  s: TranscriptionSegment,
  existingMessage: ChatMessageType | undefined,
  participant: Participant
): ChatMessageType {
  return {
    message: s.final ? s.text : `${s.text} ...`,
    name: participant instanceof LocalParticipant ? "You" : "Agent",
    isSelf: participant instanceof LocalParticipant,
    timestamp: existingMessage?.timestamp ?? Date.now(),
  };
}
