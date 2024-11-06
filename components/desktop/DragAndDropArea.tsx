/* eslint-disable @typescript-eslint/no-unused-vars */

import { DropTargetMonitor } from "react-dnd";
import { useDrop } from "react-dnd";
import { DropResult, Item, ModalState } from "./Desktop";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DesktopItem } from "@/components/desktop/DesktopItem";
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
}) => {
  const [{ isOver, canDrop }, drop] = useDrop<
    Item,
    DropResult,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: "ITEM",
    drop: (
      droppedItem: Item,
      monitor: DropTargetMonitor
    ): DropResult | undefined => {
      if (!monitor.didDrop()) {
        return { id: parentId ?? "desktop" };
      }
      return undefined;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => {
        if (node) {
          drop(node as unknown as HTMLElement);
        }
      }}
      className={`relative min-h-full w-full ${
        isOver && canDrop ? "bg-blue-200" : ""
      }`}
    >
      {isOver && canDrop && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 text-white text-lg">
          Drop here
        </div>
      )}
      <div className="grid grid-cols-6 gap-4">
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
          />
        ))}
      </div>
    </div>
  );
};
