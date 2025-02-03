// components/desktop/Desktop.tsx
"use client";

import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";

import AppSidebar from "@/components/desktop/Sidebar";
import { DragDropArea } from "@/components/desktop/DragAndDropArea";
import { ItemModal } from "@/components/desktop/ItemModal";
import { DraggableWindow } from "@/components/desktop/DraggableWindow";
import { GlobalContextMenu } from "@/components/desktop/GlobalContextMenu";
import DotPattern from "../ui/dot-pattern";
import { cn } from "@/lib/utils";
import { useDesktop } from "@/hooks/useDesktop";
import { initialItems } from "@/config/desktop";

const DesktopWrapper: React.FC = () => {
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const {
    items,
    windows,
    modalState,
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
    handlePaste,
  } = useDesktop(initialItems);

  const handleEmptySpaceRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFile = () => {
    setModalState({
      open: true,
      type: "new",
      itemType: "file",
      parentId: null,
      item: null,
    });
    setContextMenuPosition(null);
  };

  const handleCreateFolder = () => {
    setModalState({
      open: true,
      type: "new",
      itemType: "folder",
      parentId: null,
      item: null,
    });
    setContextMenuPosition(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={desktopRef}
        className="flex h-screen w-screen"
        onContextMenu={handleEmptySpaceRightClick}
      >
        <AppSidebar items={items} />
        <div className="relative p-2 w-full h-full bg-background md:shadow-xl">
          <DotPattern
            className={cn(
              "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
            )}
          />

          <GlobalContextMenu
            position={contextMenuPosition}
            onClose={() => setContextMenuPosition(null)}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onPaste={handlePaste}
          />

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

          {windows.map((windowItem) => (
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
