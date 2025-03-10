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
import { useEffect, useRef, useState } from "react";

export interface TranscriptionTileProps {
  agentAudioTrack: TrackReferenceOrPlaceholder;
  accentColor: string;
  onAgentTranscript?: (newWords: string, isFinal: boolean) => void; 
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

  // Update transcripts for agent/local segments and show them in ChatTile
  useEffect(() => {
    if (!agentAudioTrack || !agentAudioTrack.participant) return;

    // Update transcripts for agent segments
    agentMessages.segments.forEach((segment) => {
      transcripts.set(
        segment.id,
        segmentToChatMessage(
          segment,
          transcripts.get(segment.id),
          agentAudioTrack.participant
        )
      );
    });

    // Update transcripts for local microphone segments
    localMessages.segments.forEach((segment) => {
      transcripts.set(
        segment.id,
        segmentToChatMessage(
          segment,
          transcripts.get(segment.id),
          localParticipant.localParticipant
        )
      );
    });

    const allMessages = Array.from(transcripts.values());

    // Include any regular chat messages
    for (const msg of chatMessages) {
      const isAgent = msg.from?.identity === agentAudioTrack.participant?.identity;
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

  /**
   * Track the last partial text so we can determine what’s new.
   */
  const lastPartialRef = useRef<string>("");

  useEffect(() => {
    if (
      !onAgentTranscript ||
      !agentAudioTrack ||
      !agentAudioTrack.participant ||
      agentMessages.segments.length === 0
    ) {
      return;
    }

    // Get the latest transcription segment.
    const lastSegment = agentMessages.segments[agentMessages.segments.length - 1];
    const currentText = lastSegment.text.trim();

    // If there's no change, do nothing.
    if (currentText === lastPartialRef.current) return;

    // Split the text into words and compare with the last partial text.
    const oldWords = lastPartialRef.current.split(/\s+/).filter(Boolean);
    const newWords = currentText.split(/\s+/).filter(Boolean);
    const diffWords = newWords.slice(oldWords.length);

    if (diffWords.length > 0) {
      // Join the newly added words into a string.
      const newlyAddedText = diffWords.join(" ");
      // Pass the new words along with a flag indicating if the current segment is final.
      onAgentTranscript(newlyAddedText, !!lastSegment.final);
    }
    lastPartialRef.current = currentText;
  }, [agentMessages.segments, agentAudioTrack, onAgentTranscript]);

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
    message: s.final ? s.text : `${s.text} ...`, // appended "..." for partial
    name: participant instanceof LocalParticipant ? "You" : "Agent",
    isSelf: participant instanceof LocalParticipant,
    timestamp: existingMessage?.timestamp ?? Date.now(),
  };
}
