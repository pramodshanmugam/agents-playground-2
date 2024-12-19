import React, { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = {
  accentColor: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  accentColor,
  children,
  className,
  disabled,
  ...allProps
}) => {
  return (
    <button
      className={`flex flex-row ${
        disabled ? "pointer-events-none" : ""
      } text-gray-950 text-sm justify-center border border-transparent bg-[#628e3d] px-3 py-1 rounded-md transition ease-out duration-250 hover:bg-gray-500 hover:text-white  active:scale-[0.98] ${className}`}
      {...allProps}
    >
      {children}
    </button>
  );
};
