// components/desktop/GlobalContextMenu.tsx
"use client";

import React, { useState, useEffect } from "react";
import { File, Folder } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

interface GlobalContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onPaste: () => void;
}

export const GlobalContextMenu: React.FC<GlobalContextMenuProps> = ({
  position,
  onClose,
  onCreateFile,
  onCreateFolder,
  onPaste,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (position) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [position]);

  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [onClose]);

  if (!isOpen || !position) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      <div
        className="absolute"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <ContextMenu>
          <ContextMenuContent>
            <ContextMenuItem onClick={onCreateFile}>
              <File className="mr-2 size-4" />
              New File
            </ContextMenuItem>
            <ContextMenuItem onClick={onCreateFolder}>
              <Folder className="mr-2 size-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuItem onClick={onPaste}>
              <File className="mr-2 size-4" />
              Paste
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
};
