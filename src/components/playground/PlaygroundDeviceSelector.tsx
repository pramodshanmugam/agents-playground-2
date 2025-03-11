import { useMediaDeviceSelect } from "@livekit/components-react";
import { useEffect, useState } from "react";

type PlaygroundDeviceSelectorProps = {
  kind: MediaDeviceKind;
};

export const PlaygroundDeviceSelector = ({
  kind,
}: PlaygroundDeviceSelectorProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const deviceSelect = useMediaDeviceSelect({ kind: kind });
  const [selectedDeviceName, setSelectedDeviceName] = useState("");

  useEffect(() => {
    deviceSelect.devices.forEach((device) => {
      if (device.deviceId === deviceSelect.activeDeviceId) {
        setSelectedDeviceName(device.label);
      }
    });
  }, [deviceSelect.activeDeviceId, deviceSelect.devices, selectedDeviceName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div>
      <button
<<<<<<< HEAD
        className="flex gap-2 items-center px-2 py-1 bg-gray-900 text-gray-300 border border-gray-800 rounded-sm hover:bg-gray-800"
=======
        className="flex gap-2 items-center px-1  bg-gray-500 text-white  rounded-2xl hover:bg-gray-500"
>>>>>>> 382e5e3 (Ui Updated For Ai Interview)
        onClick={(e) => {
          setShowMenu(!showMenu);
          e.stopPropagation();
        }}
      >
<<<<<<< HEAD
        <span className="max-w-[80px] overflow-ellipsis overflow-hidden whitespace-nowrap">
=======
        <span className="max-w-[80px] overflow-ellipsis overflow-hidden whitespace-nowrap bg-gray-500 py-1 rounded-2xl px-1  text-white  rounded-2xl hover:bg-gray-500 ">
>>>>>>> 382e5e3 (Ui Updated For Ai Interview)
          {selectedDeviceName}
        </span>
        <ChevronSVG />
      </button>
      <div
<<<<<<< HEAD
        className="absolute right-4 top-12 bg-gray-800 text-gray-300 border border-gray-800 rounded-sm z-10"
=======
        className="absolute right-4 top-12 mt-2 ml-4 bg-[#628e3d] text-white  rounded-2xl hover:bg-gray-500 z-10"
>>>>>>> 382e5e3 (Ui Updated For Ai Interview)
        style={{
          display: showMenu ? "block" : "none",
        }}
      >
        {deviceSelect.devices.map((device, index) => {
          return (
            <div
              onClick={() => {
                deviceSelect.setActiveMediaDevice(device.deviceId);
                setShowMenu(false);
              }}
              className={`${
                device.deviceId === deviceSelect.activeDeviceId
                  ? "text-white"
                  : "text-gray-500"
              } flex  items-center px-2 py-2  bg-gray-500  text-white  rounded-2xl hover:bg-gray-500`}
              key={index}
            >
              {device.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ChevronSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 5H5V7H3V5ZM7 9V7H5V9H7ZM9 9V11H7V9H9ZM11 7V9H9V7H11ZM11 7V5H13V7H11Z"
      fill="currentColor"
      fillOpacity="0.8"
    />
  </svg>
);
