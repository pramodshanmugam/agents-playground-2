import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronIcon } from "./icons";
import { useConfig } from "@/hooks/useConfig";

type SettingType = "inputs" | "outputs" | "chat" | "theme_color"

type SettingValue = {
  title: string;
  type: SettingType | "separator";
  key: string;
};

const settingsDropdown: SettingValue[] = [
  {
    title: "Show chat",
    type: "chat",
    key: "N/A",
  },
  {
    title: "---",
    type: "separator",
    key: "separator_1",
  },
  {
    title: "Show video",
    type: "outputs",
    key: "video",
  },
  {
    title: "Show audio",
    type: "outputs",
    key: "audio",
  },

  {
    title: "---",
    type: "separator",
    key: "separator_2",
  },
  {
    title: "Enable camera",
    type: "inputs",
    key: "camera",
  },
  {
    title: "Enable mic",
    type: "inputs",
    key: "mic",
  },
];

export const SettingsDropdown = () => {
  const {config, setUserSettings} = useConfig();

  const isEnabled = (setting: SettingValue) => {
    if (setting.type === "separator" || setting.type === "theme_color") return false;
    if (setting.type === "chat") {
      return config.settings[setting.type];
    }

    if(setting.type === "inputs") {
      const key = setting.key as "camera" | "mic";
      return config.settings.inputs[key];
    } else if(setting.type === "outputs") {
      const key = setting.key as "video" | "audio";
      return config.settings.outputs[key];
    }

    return false;
  };

  const toggleSetting = (setting: SettingValue) => {
    if (setting.type === "separator" || setting.type === "theme_color") return;
    const newValue = !isEnabled(setting);
    const newSettings = {...config.settings}

    if(setting.type === "chat") {
      newSettings.chat = newValue;
    } else if(setting.type === "inputs") {
      newSettings.inputs[setting.key as "camera" | "mic"] = newValue;
    } else if(setting.type === "outputs") {
      newSettings.outputs[setting.key as "video" | "audio"] = newValue;
    }
    setUserSettings(newSettings);
  };

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="group inline-flex max-h-12 items-center gap-1 rounded-md hover:bg-gray-500 bg-[#628e3d] border-gray-800 p-1 pr-2 text-gray-100">
        <button className="my-auto text-sm flex gap-1 ml-2 pl-2 py-1 h-full items-center bg-[#628e3d] hover:bg-gray-500">
          Settings
          <ChevronIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 flex w-60 flex-col gap-0 overflow-hidden rounded-2xl text-gray-100 bg-gray-200 border-gray-800  py-2 text-sm"
          sideOffset={5}
          collisionPadding={16}
        >
          {settingsDropdown.map((setting) => {
            if (setting.type === "separator") {
              return (
                <div
                  key={setting.key}
                  className="border-t border-gray-800 my-2"
                />
              );
            }

            return (
              <DropdownMenu.Label
              key={setting.key}
              onClick={() => toggleSetting(setting)}
              className="flex max-w-full flex-row items-end gap-2 px-3 py-2 text-xs text-[#628e3d] hover:bg-gray-300 hover:text-white cursor-pointer bg-gray-200 transition-colors"
            >
            
              <div className="w-4 h-4 flex items-center">
                {isEnabled(setting) && <CheckIcon />}
              </div>
              <span className="text-[#628e3d]">{setting.title}</span>
            </DropdownMenu.Label>
            
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};