import { useState, useEffect } from "react";

const regexMobile = /iPhone|iPad|iPod|Android/i;

// Hook to detect mobile device
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof navigator === "undefined") return false;
    return regexMobile.test(navigator.userAgent);
  });

  useEffect(() => {
    // Also check screen width as a fallback
    const checkMobile = () => {
      const userAgentMobile = regexMobile.test(navigator.userAgent);
      const screenMobile = window.innerWidth < 768;
      setIsMobile(userAgentMobile || screenMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}
