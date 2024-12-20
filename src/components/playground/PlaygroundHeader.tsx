import { Button } from "@/components/button/Button";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { SettingsDropdown } from "@/components/playground/SettingsDropdown";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionState } from "livekit-client";
import { ReactNode } from "react";
import Image from "next/image";
import Image1 from "../../../public/Untitled+design.png";

type PlaygroundHeader = {
  logo?: ReactNode;
  title?: ReactNode;
  githubLink?: string;
  height: number;
  accentColor: string;
  connectionState: ConnectionState;
  onConnectClicked: () => void;
};

export const PlaygroundHeader = ({
  logo,
  title,
  githubLink,
  accentColor,
  height,
  onConnectClicked,
  connectionState,
}: PlaygroundHeader) => {
  const { config } = useConfig();
  return (
    <div
      className={`flex text-[#628e3d] justify-between bg-white rounded-xl items-center shrink-0`}
      style={{
        height: "90px",
        width: "100%",
      }}
    >
      <div className="flex items-center gap-3 basis-2/3">
        <div className="flex lg:basis-1/2">
          <a href="https://images.squarespace-cdn.com/content/v1/6195b781b8f5b60659d7a41e/e81a10ae-321f-4cf6-8fb1-b6757d197f37/Untitled+design.png?format=1500w">
            <Image
              src={Image1}
              alt="Logo"
              width={300}
              height={200}
              className="object-contain"
            />
          </a>
        </div>
        {/* <div className="lg:basis-1/2 lg:text-center text-2xl lg:text-base text-2xl lg:font-semibold text-[#628e3d]">
          {title}
        </div> */}
        <div className="text-base lg:basis-1/2  lg:text-2xl lg:text-center  lg:font-semibold  text-[#628e3d]">
          {title}
        </div>
      </div>
      <div className="flex basis-1/3 justify-end items-center gap-2">
        {config.settings.editable && <SettingsDropdown />}
        <Button
          className={`h-9 gap-2 p-1 py-1 bg-[#628e3d] text-white rounded-md mr-2`}
          accentColor={
            connectionState === ConnectionState.Connected ? "red" : accentColor
          }
          disabled={connectionState === ConnectionState.Connecting}
          onClick={() => {
            onConnectClicked();
          }}
        >
          <span className="mt-1">
            {connectionState === ConnectionState.Connecting ? (
              <LoadingSVG />
            ) : connectionState === ConnectionState.Connected ? (
              "Disconnect"
            ) : (
              "Connect"
            )}
          </span>
        </Button>
      </div>
    </div>
  );
};

// const LKLogo = () => (
//   <svg
//     width="28"
//     height="28"
//     viewBox="0 0 32 32"
//     fill="none"
//     xmlns="http://www.w3.org/2000/svg"
//   >
//     <g clipPath="url(#clip0_101_119699)">
//       <path
//         d="M19.2006 12.7998H12.7996V19.2008H19.2006V12.7998Z"
//         fill="currentColor"
//       />
//       <path
//         d="M25.6014 6.40137H19.2004V12.8024H25.6014V6.40137Z"
//         fill="currentColor"
//       />
//       <path
//         d="M25.6014 19.2002H19.2004V25.6012H25.6014V19.2002Z"
//         fill="currentColor"
//       />
//       <path d="M32 0H25.599V6.401H32V0Z" fill="currentColor" />
//       <path d="M32 25.5986H25.599V31.9996H32V25.5986Z" fill="currentColor" />
//       <path
//         d="M6.401 25.599V19.2005V12.7995V6.401V0H0V6.401V12.7995V19.2005V25.599V32H6.401H12.7995H19.2005V25.599H12.7995H6.401Z"
//         fill="white"
//       />
//     </g>
//     <defs>
//       <clipPath id="clip0_101_119699">
//         <rect width="32" height="32" fill="white" />
//       </clipPath>
//     </defs>
//   </svg>
// );
