import { ReactNode, useState } from "react";

// Default title height for the title bar
const titleHeight = 32;

type PlaygroundTileProps = {
  title?: string;
  children?: ReactNode;
  className?: string;
  childrenClassName?: string;
  padding?: boolean;
  backgroundColor?: string;
};

export type PlaygroundTab = {
  title: string;
  content: ReactNode;
};

export type PlaygroundTabbedTileProps = {
  tabs: PlaygroundTab[];
  initialTab?: number;
} & PlaygroundTileProps;

// PlaygroundTile component for rendering tiles with an optional title
export const  PlaygroundTile: React.FC<PlaygroundTileProps> = ({
  children,
  title,
  className,
  childrenClassName,
  padding = true,
  backgroundColor = "transparent",
}) => {
  const contentPadding = padding ? 4 : 0;
  return (
    <div
      className={`flex flex-col border rounded-md text-gray-500 bg-${backgroundColor} ${className}`}
    >
      {title && (
        <div
          className="flex items-center justify-center text-md uppercase py-2 border-b border-b-[#628e3d] tracking-wider"
          style={{
            height: `${titleHeight}px`,
            color: "#628e3d",
          }}
        >
          <h4>{title}</h4>
        </div>
      )}
      <div
        className={`flex flex-col items-center w-full ${childrenClassName}`}
        style={{
          padding: `${contentPadding * 4}px`,
          flexGrow: 1, 
        }}
      >
        {children}
      </div>
    </div>
  );
};


export const PlaygroundTabbedTile: React.FC<PlaygroundTabbedTileProps> = ({
  tabs,
  initialTab = 0,
  className,
  childrenClassName,
  backgroundColor = "transparent",
}) => {
  const contentPadding = 4;
  const [activeTab, setActiveTab] = useState(initialTab);

  if (activeTab >= tabs.length) {
    return null;
  }

  return (
    <div
      className={`flex flex-col h-full border rounded-2xl  border-[#628e3d] text-gray-500 bg-gray-300 ${className}`}
    >
      <div
        className="flex items-center justify-start text-sm uppercase border-b border-b-[#628e3d] tracking-wider"
        style={{
          height: `${titleHeight}px`,
        }}
      >
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-sm hover:bg-gray-800 hover:text-gray-300 border-r border-r-[#628e3d] ${
              index === activeTab
                ? `bg-gray-900 text-gray-300`
                : `bg-transparent text-gray-500`
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div
        className={`w-full ${childrenClassName}`}
        style={{
          padding: `${contentPadding * 4}px`,
          flexGrow: 1,  // Make the content area flexible
          display: "flex",  // Ensure it grows with the content
          flexDirection: "column",  // Maintain the column layout
        }}
      >
        {tabs[activeTab].content}
      </div>
    </div>
  );
};
