import { useDrop } from "react-dnd";
import { DesktopItem } from "@/components/desktop/DesktopItem";
import type { Item } from "@/types/desktop";
import { useDesktopContext } from "@/context/desktop";

interface DragDropAreaProps {
  items: Item[];
  locationId?: string | null;
  parentPath: string;
}

export const DragDropArea: React.FC<DragDropAreaProps> = ({
  items,
  locationId = null,
  parentPath,
}) => {
  const {
    pasteItem,
    openWindow,
    setModalState,
    deleteItem,
    handleCopy,
    handleCut,
  } = useDesktopContext();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "ITEM",
    drop: () => ({ id: locationId ?? null }),
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
          <DesktopItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};
