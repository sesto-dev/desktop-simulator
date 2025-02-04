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
import { useDesktop } from "@/hooks/useDesktop";

interface EmptySpaceContextMenuProps {
  parentId?: string | null;
  onCreateFile: (parentId?: string | null) => void;
  onCreateFolder: (parentId?: string | null) => void;
  children: React.ReactNode;
}

export const EmptySpaceContextMenu: React.FC<EmptySpaceContextMenuProps> = ({
  parentId,
  onCreateFile,
  onCreateFolder,
  children,
}) => {
  const { clipboard, clearClipboard } = useDesktop();

  const handlePaste = () => {
    if (!clipboard) {
      toast.error("Clipboard is empty");
      return;
    }

    // Handle the paste operation here
    // You'll need to implement the actual paste logic
    // using the clipboard.item and clipboard.operation

    toast.success(`Pasted ${clipboard.item.name}`);
    if (clipboard.operation === "cut") {
      clearClipboard();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="z-[9999]">
        <ContextMenuItem onClick={() => onCreateFile(parentId)}>
          <File className="mr-2 size-4" />
          New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onCreateFolder(parentId)}>
          <Folder className="mr-2 size-4" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem onClick={handlePaste} disabled={!clipboard}>
          <File className="mr-2 size-4" />
          Paste
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
