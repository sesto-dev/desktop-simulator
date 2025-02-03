import { useDrop } from "react-dnd";
import { DesktopItem } from "@/components/desktop/DesktopItem";
import type { Item, ModalState } from "@/types/desktop";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { useState } from "react";
import { File, Folder } from "lucide-react";

interface DragDropAreaProps {
  items: Item[];
  moveItem: (
    draggedId: string,
    targetId: string | null,
    sourcePath: string
  ) => void;
  openWindow: (item: Item) => void;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  parentId?: string | null;
  onDragStart: (item: Item) => void;
  onDragEnd: () => void;
  deleteItem: (itemId: string) => void;
  parentPath: string;
  handleEmptySpaceRightClick: (e: React.MouseEvent) => void;
  handlePaste: () => void;
}

export const DragDropArea: React.FC<DragDropAreaProps> = ({
  items,
  moveItem,
  openWindow,
  setModalState,
  parentId = null,
  onDragStart,
  onDragEnd,
  deleteItem,
  parentPath,
  handleEmptySpaceRightClick,
  handlePaste,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "ITEM",
    drop: () => ({ id: parentId ?? "desktop" }),
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenuPosition(null);
  };

  return (
    <div
      ref={(node) => {
        if (node) {
          drop(node as unknown as HTMLElement);
        }
      }}
      className="relative w-full h-full"
      onContextMenu={handleContextMenu}
    >
      {isOver && canDrop && (
        <div className="absolute inset-0 rounded-xl animate-pulse bg-blue-200/10 flex items-center justify-center" />
      )}
      <div
        className={`grid ${
          parentPath === "/desktop" ? "grid-cols-12" : "grid-cols-3"
        } gap-4 p-4`}
      >
        {items.map((item) => (
          <DesktopItem
            key={item.id}
            item={item}
            moveItem={moveItem}
            openWindow={openWindow}
            setModalState={setModalState}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            deleteItem={deleteItem}
            handleCopy={(item) =>
              setModalState({
                open: true,
                type: "copy",
                itemType: item.type,
                parentId: item.parentId,
                item,
              })
            }
            handleCut={(item) =>
              setModalState({
                open: true,
                type: "cut",
                itemType: item.type,
                parentId: item.parentId,
                item,
              })
            }
          />
        ))}
      </div>

      {contextMenuPosition && (
        <div
          className="fixed"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            zIndex: 2000,
          }}
        >
          <ContextMenu>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  setModalState({
                    open: true,
                    type: "new",
                    itemType: "file",
                    parentId: parentId,
                    item: null,
                  });
                  closeContextMenu();
                }}
              >
                <File className="mr-2 size-4" />
                New File
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setModalState({
                    open: true,
                    type: "new",
                    itemType: "folder",
                    parentId: parentId,
                    item: null,
                  });
                  closeContextMenu();
                }}
              >
                <Folder className="mr-2 size-4" />
                New Folder
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  handlePaste();
                  closeContextMenu();
                }}
              >
                <File className="mr-2 size-4" />
                Paste
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      )}
    </div>
  );
};
