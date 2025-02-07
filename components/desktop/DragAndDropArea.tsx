// components/desktop/DragAndDropArea.tsx
import { useDrop } from "react-dnd";
import { DesktopItem } from "@/components/desktop/DesktopItem";
import type { Item, ModalState } from "@/types/desktop";

interface DragDropAreaProps {
  items: Item[];
  pasteItem: (locationId?: string | null) => void;
  openWindow: (item: Item) => void;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  locationId?: string | null;
  onDragStart: (item: Item) => void;
  deleteItem: (itemId: string) => void;
  handleCopy: (item: Item) => void;
  handleCut: (item: Item) => void;
  parentPath: string;
}

export const DragDropArea: React.FC<DragDropAreaProps> = ({
  items,
  pasteItem,
  openWindow,
  setModalState,
  locationId = null,
  onDragStart,
  deleteItem,
  handleCopy,
  handleCut,
  parentPath,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "ITEM",
    drop: () => ({ id: locationId ?? null }), // return null instead of "desktop"
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => {
        drop(node as unknown as HTMLElement);
      }}
      className="relative w-full h-full"
    >
      {isOver && canDrop && (
        <div className="absolute inset-0 rounded-xl animate-pulse bg-blue-200/10 flex items-center justify-center" />
      )}
      <div
        className={`grid ${
          parentPath === "/desktop"
            ? "grid-cols-12 lg:grid-cols-10 md:grid-cols-6 sm:grid-cols-4"
            : "grid-cols-3"
        } gap-4 p-4`}
      >
        {items.map((item) => (
          <DesktopItem
            key={item.id}
            item={item}
            pasteItem={pasteItem}
            openWindow={openWindow}
            setModalState={setModalState}
            onDragStart={onDragStart}
            deleteItem={deleteItem}
            handleCut={handleCut}
            handleCopy={handleCopy}
          />
        ))}
      </div>
    </div>
  );
};
