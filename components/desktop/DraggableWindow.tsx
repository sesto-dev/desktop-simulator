import { useState, useCallback, useEffect } from "react";
import { Minimize, X } from "lucide-react";
import { WindowItem, Item } from "./Desktop";

interface DraggableWindowProps {
  windowItem: WindowItem & { item: Item };
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  children: React.ReactNode;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  windowItem,
  closeWindow,
  minimizeWindow,
  moveWindow,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - windowItem.position.x,
      y: e.clientY - windowItem.position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        moveWindow(windowItem.id, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, moveWindow, windowItem.id]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (windowItem.isMinimized) return null;

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        left: windowItem.position.x,
        top: windowItem.position.y,
        width: windowItem.size.width,
        height: windowItem.size.height,
        zIndex: 1000,
      }}
    >
      <div
        className="bg-gray-200 p-2 flex justify-between items-center cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-bold">{windowItem.item.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => minimizeWindow(windowItem.id)}
            className="focus:outline-none"
          >
            <Minimize className="h-4 w-4" />
          </button>
          <button
            onClick={() => closeWindow(windowItem.id)}
            className="focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        className="p-4 overflow-auto"
        style={{ height: "calc(100% - 40px)" }}
      >
        {children}
      </div>
    </div>
  );
};
