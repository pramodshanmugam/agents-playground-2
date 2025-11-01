import React from "react";
import Image from "next/image";

export const AvatalkLogo = () => {
  return (
    <div className="avatalk-logo-container">
      <Image
        src="/logo.png"
        alt="avatalk"
        width={200}
        height={80}
        className="avatalk-logo-image"
        priority
      />
    </div>
  );
};

