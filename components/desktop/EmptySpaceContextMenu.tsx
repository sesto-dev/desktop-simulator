"use client";

import React from "react";
import { File, Folder } from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { useDesktopContext } from "@/context/desktop";

interface EmptySpaceContextMenuProps {
  locationId?: string | null;
  children: React.ReactNode;
}

export const EmptySpaceContextMenu: React.FC<EmptySpaceContextMenuProps> = ({
  locationId,
  children,
}) => {
  const { handleCreateFile, handleCreateFolder, clipboard, pasteItem } =
    useDesktopContext();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div onContextMenu={(e) => e.stopPropagation()}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="z-[9999]">
        <ContextMenuItem onClick={() => handleCreateFile(locationId)}>
          <File className="mr-2 size-4" />
          New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleCreateFolder(locationId)}>
          <Folder className="mr-2 size-4" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => pasteItem(locationId)}
          disabled={!clipboard}
        >
          <File className="mr-2 size-4" />
          Paste
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
