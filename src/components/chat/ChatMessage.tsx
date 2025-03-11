type ChatMessageProps = {
  message: string;
  accentColor: string;
  name: string;
  isSelf: boolean;
  hideName?: boolean;
};

export const ChatMessage = ({
  name,
  message,
  accentColor,
  isSelf,
  hideName,
}: ChatMessageProps) => {
  return (
<<<<<<< HEAD
    <div className={`flex flex-col gap-1 ${hideName ? "pt-0" : "pt-6"}`}>
      {!hideName && (
        <div
          className={`text-${
            isSelf ? "gray-700" : accentColor + "-800 text-ts-" + accentColor
          } uppercase text-xs`}
        >
          {name}
        </div>
      )}
      <div
        className={`pr-4 text-${
          isSelf ? "gray-300" : accentColor + "-500"
        } text-sm ${
          isSelf ? "" : "drop-shadow-" + accentColor
        } whitespace-pre-line`}
      >
        {message}
      </div>
    </div>
=======
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

>>>>>>> 382e5e3 (Ui Updated For Ai Interview)
  );
};
