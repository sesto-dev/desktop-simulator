"use client";

import React, { useState, useCallback, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Folder, File } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

import AppSidebar from "@/components/desktop/Sidebar";
import { DragDropArea } from "@/components/desktop/DragAndDropArea";
import { ItemModal } from "@/components/desktop/ItemModal";
import { DraggableWindow } from "@/components/desktop/DraggableWindow";
import DotPattern from "../ui/dot-pattern";
import { cn } from "@/lib/utils";
import type { Item, WindowItem, ModalState } from "@/types/desktop";
import { initialItems } from "@/config/desktop";
import { useDesktop } from "@/hooks/useDesktop";

const DesktopWrapper: React.FC = () => {
  const {
    items,
    windows,
    modalState,
    draggedItem,
    desktopRef,
    moveItem,
    openWindow,
    closeWindow,
    minimizeWindow,
    moveWindow,
    setModalState,
    handleItemOperation,
    deleteItem,
    handleDragStart,
    handleDragEnd,
  } = useDesktop(initialItems);

  return (
    <DndProvider backend={HTML5Backend}>
      <div ref={desktopRef} className="flex h-screen w-screen">
        <AppSidebar items={items} />
        <div className="relative p-2 flex h-full w-full items-center justify-center overflow-hidden bg-background md:shadow-xl">
          <DotPattern
            className={cn(
              "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
            )}
          />
          <ContextMenu>
            <ContextMenuTrigger className="min-h-full w-full">
              <div className="min-h-full w-full">
                <DragDropArea
                  items={items.filter((item) => item.parentId === null)}
                  moveItem={moveItem}
                  openWindow={openWindow}
                  setModalState={setModalState}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  deleteItem={deleteItem}
                  parentPath="/desktop"
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onSelect={() =>
                  setModalState({
                    open: true,
                    type: "new",
                    itemType: "folder",
                    parentId: null,
                    item: null,
                  })
                }
              >
                <Folder className="mr-2 size-4" />
                <span>New Folder</span>
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() =>
                  setModalState({
                    open: true,
                    type: "new",
                    itemType: "file",
                    parentId: null,
                    item: null,
                  })
                }
              >
                <File className="mr-2 size-4" />
                <span>New Bookmark</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {windows.map((windowItem: WindowItem) => (
            <DraggableWindow
              key={windowItem.id}
              windowItem={windowItem}
              closeWindow={closeWindow}
              minimizeWindow={minimizeWindow}
              moveWindow={moveWindow}
            >
              <DragDropArea
                items={windowItem.item.content || []}
                moveItem={moveItem}
                openWindow={openWindow}
                setModalState={setModalState}
                parentId={windowItem.item.id}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                deleteItem={deleteItem}
                parentPath={windowItem.item.path}
              />
            </DraggableWindow>
          ))}
          <ItemModal
            modalState={modalState}
            setModalState={setModalState}
            handleItemOperation={handleItemOperation}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default DesktopWrapper;
