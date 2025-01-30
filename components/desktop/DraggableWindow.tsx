/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useCallback, useEffect } from "react";
import { Minimize, X } from "lucide-react";
import type { WindowItem, Item } from "@/types/desktop";

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
      className="absolute backdrop-blur-xl bg-neutral-800/10 rounded-lg shadow-lg overflow-hidden"
      style={{
        left: windowItem.position.x,
        top: windowItem.position.y,
        width: windowItem.size.width,
        height: windowItem.size.height,
        zIndex: 1000,
      }}
    >
      <div
        className="p-2 px-4 flex bg-neutral-700/10 justify-between items-center cursor-move"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm">{windowItem.item.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => closeWindow(windowItem.id)}
            className="focus:outline-none"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div
        className="p-4 px-8 overflow-auto"
        style={{ height: "calc(100% - 40px)" }}
      >
        {children}
      </div>
    </div>
  );
};
