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
import { useEffect, useState } from "react";

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
  // Get transcription segments for agent and local mic
  const agentMessages = useTrackTranscription(agentAudioTrack);
  const localParticipant = useLocalParticipant();
  const localMessages = useTrackTranscription({
    publication: localParticipant.microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant.localParticipant,
  });

  const [transcripts, setTranscripts] = useState<Map<string, ChatMessageType>>(
    new Map()
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const { chatMessages, send: sendChat } = useChat();

  // Only update transcripts if agentAudioTrack and its participant exist
  useEffect(() => {
    if (!agentAudioTrack || !agentAudioTrack.participant) return;

    // Update transcripts for agent segments
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

    // Update transcripts for local microphone segments
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
    agentAudioTrack,
    agentMessages.segments,
    localMessages.segments,
  ]);

  // Keep track of the last final segment to avoid calling onAgentTranscript repeatedly.
  const [lastFinalSegmentId, setLastFinalSegmentId] = useState<string | null>(null);
  useEffect(() => {
    if (
      onAgentTranscript &&
      agentMessages.segments.length > 0 &&
      agentAudioTrack &&
      agentAudioTrack.participant
    ) {
      const lastSegment = agentMessages.segments[agentMessages.segments.length - 1];
      if (lastSegment.final && lastSegment.id !== lastFinalSegmentId) {
        setLastFinalSegmentId(lastSegment.id);
        onAgentTranscript(lastSegment.text);
      }
    }
  }, [agentMessages.segments, onAgentTranscript, lastFinalSegmentId, agentAudioTrack]);

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
