import { createContext, useContext } from "react";
import type { DesktopContextValue } from "@/hooks/useDesktop";

export const DesktopContext = createContext<DesktopContextValue | null>(null);

export const useDesktopContext = () => {
  const context = useContext(DesktopContext);
  if (!context) {
    throw new Error("useDesktopContext must be used within a DesktopProvider");
  }
  return context;
};
