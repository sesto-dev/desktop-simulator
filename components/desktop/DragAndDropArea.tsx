import { useDrop } from "react-dnd";
import { DesktopItem } from "@/components/desktop/DesktopItem";
import type { Item, ModalState } from "@/types/desktop";

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
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "ITEM",
    drop: () => ({ id: parentId ?? "desktop" }),
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
      className="relative min-h-full w-full"
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
          />
        ))}
      </div>
    </div>
  );
};
