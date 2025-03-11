import { ChatMessage } from "@/components/chat/ChatMessage";

export type ChatMessageType = {
  name: string;
  message: string;
  isSelf: boolean;
  timestamp: number;
};

type ChatTileProps = {
  messages: ChatMessageType[]; 
  accentColor: string;
};

export const ChatTile = ({ messages, accentColor }: ChatTileProps) => {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="overflow-y-auto h-full">
        <div className="flex flex-col justify-end">
    
          {messages.slice(-1).map((message, index) => (
            <ChatMessage
              key={index}
              hideName={false}  
              name={message.name}
              message={message.message}
              isSelf={message.isSelf}
              accentColor={accentColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
