"use client";

import React from "react";
import { File, Folder } from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import type { ClipboardItem } from "@/types/desktop";

interface EmptySpaceContextMenuProps {
  locationId?: string | null;
  onCreateFile: (locationId?: string | null) => void;
  onCreateFolder: (locationId?: string | null) => void;
  clipboard: ClipboardItem | null;
  handlePaste: (locationId?: string | null) => void;
  children: React.ReactNode;
}

export const EmptySpaceContextMenu: React.FC<EmptySpaceContextMenuProps> = ({
  locationId,
  onCreateFile,
  onCreateFolder,
  clipboard,
  handlePaste,
  children,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="z-[9999]">
        <ContextMenuItem onClick={() => onCreateFile(locationId)}>
          <File className="mr-2 size-4" />
          New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCreateFolder(locationId)}>
          <Folder className="mr-2 size-4" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handlePaste(locationId)}
          disabled={!clipboard}
        >
          <File className="mr-2 size-4" />
          Paste
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
