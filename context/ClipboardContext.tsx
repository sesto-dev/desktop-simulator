"use client";

import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import type { Item } from "@/types/desktop";

interface ClipboardContextType {
  clipboard: { item: Item; operation: "copy" | "cut" } | null;
  copyItem: (item: Item) => void;
  cutItem: (item: Item) => void;
  clearClipboard: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | null>(null);

export const ClipboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [clipboard, setClipboard] = useState<{
    item: Item;
    operation: "copy" | "cut";
  } | null>(null);

  const copyItem = (item: Item) => {
    setClipboard({ item, operation: "copy" });
    toast.success(`Copied ${item.name}`);
  };

  const cutItem = (item: Item) => {
    setClipboard({ item, operation: "cut" });
    toast.success(`Cut ${item.name}`);
  };

  const clearClipboard = () => {
    setClipboard(null);
  };

  return (
    <ClipboardContext.Provider
      value={{ clipboard, copyItem, cutItem, clearClipboard }}
    >
      {children}
    </ClipboardContext.Provider>
  );
};

export const useClipboard = () => {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error("useClipboard must be used within a ClipboardProvider");
  }
  return context;
};
