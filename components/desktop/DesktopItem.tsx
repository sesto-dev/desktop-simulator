/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import { Edit, Folder, File, Trash2 } from "lucide-react";
import { DropResult, Item, ModalState } from "./Desktop";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DndProvider,
  useDrag,
  useDrop,
  DragSourceMonitor,
  DropTargetMonitor,
} from "react-dnd";

interface DesktopItemProps {
  item: Item;
  moveItem: (
    draggedId: string,
    targetId: string | null,
    sourcePath: string
  ) => void;
  openWindow: (item: Item) => void;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  onDragStart: (item: Item) => void;
  onDragEnd: () => void;
  deleteItem: (itemId: string) => void;
}

export const DesktopItem: React.FC<DesktopItemProps> = ({
  item,
  moveItem,
  openWindow,
  setModalState,
  onDragStart,
  onDragEnd,
  deleteItem,
}) => {
  const [{ isDragging }, drag] = useDrag<
    Item,
    DropResult,
    { isDragging: boolean }
  >({
    type: "ITEM",
    item: () => {
      onDragStart(item);
      return item;
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (droppedItem: Item, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult<DropResult>();
      if (dropResult && dropResult.id) {
        moveItem(
          droppedItem.id,
          dropResult.id === "desktop" ? null : dropResult.id,
          droppedItem.path
        );
      }
      onDragEnd();
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop<
    Item,
    DropResult,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: "ITEM",
    canDrop: (draggedItem: Item) => item.type === "folder",
    drop: () => ({ id: item.id }),
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleClick = () => {
    if (item.type === "file" && item.link) {
      window.open(item.link, "_blank");
    } else if (item.type === "folder") {
      openWindow(item);
    }
  };

  const isActive = isOver && canDrop;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item.type === "folder" && ref.current) {
      drop(ref.current);
    }
  }, [drop, item.type]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={ref}
          className={`flex flex-col items-center p-2 cursor-pointer relative ${
            isDragging ? "opacity-50" : ""
          } ${isActive ? "bg-blue-200" : ""}`}
          onClick={handleClick}
        >
          <div
            ref={(node) => {
              if (node) {
                drag(node as unknown as HTMLElement);
              }
            }}
            className="w-16 h-16 flex items-center justify-center bg-white rounded-lg shadow-md"
          >
            {item.type === "folder" ? (
              <Folder className="w-10 h-10 text-yellow-500" />
            ) : (
              <File className="w-10 h-10 text-blue-500" />
            )}
          </div>
          <span className="mt-2 text-sm text-center">{item.name}</span>
          {isActive && item.type === "folder" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm">
              {item.path}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {item.type === "file" ? (
          <ContextMenuItem
            onSelect={() =>
              setModalState({
                open: true,
                type: "edit",
                itemType: "file",
                parentId: item.parentId,
                item,
              })
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Bookmark</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onSelect={() =>
              setModalState({
                open: true,
                type: "rename",
                itemType: "folder",
                parentId: item.parentId,
                item,
              })
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Rename Folder</span>
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => deleteItem(item.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete {item.type === "folder" ? "Folder" : "Bookmark"}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
