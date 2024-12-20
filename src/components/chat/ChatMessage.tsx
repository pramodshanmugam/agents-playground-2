type ChatMessageProps = {
  message: string;
  accentColor: string; // This is no longer needed
  name: string;
  isSelf: boolean;
  hideName?: boolean;
};

export const ChatMessage = ({
  name,
  message,
  isSelf,
  hideName,
}: ChatMessageProps) => {
  return (
<div className={`flex flex-col gap-1 ${hideName ? "pt-0" : "pt-6"}`}>
  {/* {!hideName && (
    <div
      className="text-[#628e3d] uppercase text-md font-bold"
    >
      {name}
    </div>
  )} */}
  <div
    className={`pr-4 text-gray-500 text-md font-semibold ${isSelf ? "" : "drop-shadow-[#628e3d]"} whitespace-pre-line`}
  >
    {message}
  </div>
</div>

  );
};
