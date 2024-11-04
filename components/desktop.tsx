"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Folder,
  File,
  Edit,
  X,
  Minimize,
  ChevronLeft,
  Trash2,
  Check,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface Item {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: Item[];
  link?: string;
  parentId: string | null;
}

interface Window {
  id: string;
  item: Item;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

const initialItems: Item[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    content: [
      {
        id: "4",
        name: "Resume",
        type: "file",
        link: "https://example.com/resume",
        parentId: "1",
      },
    ],
    parentId: null,
  },
  {
    id: "2",
    name: "Images",
    type: "folder",
    content: [
      {
        id: "5",
        name: "Photo",
        type: "file",
        link: "https://example.com/photo",
        parentId: "2",
      },
    ],
    parentId: null,
  },
  {
    id: "3",
    name: "Notes",
    type: "file",
    link: "https://example.com/notes",
    parentId: null,
  },
];

const Desktop: React.FC = () => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [windows, setWindows] = useState<Window[]>([]);
  const [contextMenuState, setContextMenuState] = useState<
    "default" | "newFolder" | "newBookmark"
  >("default");
  const [newItemName, setNewItemName] = useState("");
  const [newItemLink, setNewItemLink] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const moveItem = useCallback((draggedId: string, targetId: string | null) => {
    setItems((prevItems) => {
      const updateItemsRecursively = (
        items: Item[],
        draggedId: string,
        targetId: string | null
      ): Item[] => {
        return items.map((item) => {
          if (item.id === draggedId) {
            return { ...item, parentId: targetId };
          }
          if (item.content) {
            return {
              ...item,
              content: updateItemsRecursively(
                item.content,
                draggedId,
                targetId
              ),
            };
          }
          return item;
        });
      };

      const updatedItems = updateItemsRecursively(
        prevItems,
        draggedId,
        targetId
      );
      return updatedItems.reduce((acc: Item[], item) => {
        if (item.parentId === null) {
          acc.push(item);
        } else {
          const parent =
            acc.find((i) => i.id === item.parentId) ||
            updatedItems.find((i) => i.id === item.parentId);
          if (parent && parent.type === "folder") {
            parent.content = parent.content
              ? [...parent.content, item]
              : [item];
          }
        }
        return acc;
      }, []);
    });
  }, []);

  const handleCreateNewItem = useCallback(() => {
    if (!newItemName) return;

    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName,
      type: contextMenuState === "newFolder" ? "folder" : "file",
      parentId: activeParentId,
      ...(contextMenuState === "newBookmark"
        ? { link: newItemLink }
        : { content: [] }),
    };

    setItems((prevItems) => {
      const updateItemsRecursively = (items: Item[]): Item[] => {
        return items.map((item) => {
          if (item.id === activeParentId) {
            return { ...item, content: [...(item.content || []), newItem] };
          }
          if (item.content) {
            return { ...item, content: updateItemsRecursively(item.content) };
          }
          return item;
        });
      };

      if (activeParentId === null) {
        return [...prevItems, newItem];
      } else {
        return updateItemsRecursively(prevItems);
      }
    });

    setWindows((prevWindows) => {
      return prevWindows.map((window) => {
        if (window.item.id === activeParentId) {
          return {
            ...window,
            item: {
              ...window.item,
              content: [...(window.item.content || []), newItem],
            },
          };
        }
        return window;
      });
    });

    setNewItemName("");
    setNewItemLink("");
    setContextMenuState("default");
  }, [contextMenuState, newItemName, newItemLink, activeParentId]);

  const openWindow = useCallback((item: Item) => {
    setWindows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        item,
        position: { x: 50 + prev.length * 20, y: 50 + prev.length * 20 },
        size: { width: 400, height: 300 },
        isMinimized: false,
      },
    ]);
  }, []);

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
      )
    );
  }, []);

  const moveWindow = useCallback(
    (windowId: string, position: { x: number; y: number }) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === windowId ? { ...w, position } : w))
      );
    },
    []
  );

  const handleDragStart = (item: Item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const deleteItem = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const deleteItemRecursively = (items: Item[]): Item[] => {
        return items.filter((item) => {
          if (item.id === itemId) {
            return false;
          }
          if (item.content) {
            item.content = deleteItemRecursively(item.content);
          }
          return true;
        });
      };

      return deleteItemRecursively(prevItems);
    });

    setWindows((prevWindows) =>
      prevWindows.filter((w) => w.item.id !== itemId)
    );
  }, []);

  const [, drop] = useDrop(
    () => ({
      accept: "ITEM",
      drop: (droppedItem: { id: string }, monitor) => {
        if (!monitor.didDrop()) {
          moveItem(droppedItem.id, null);
        }
      },
    }),
    [moveItem]
  );

  useEffect(() => {
    if (contextMenuState !== "default" && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [contextMenuState]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateNewItem();
    } else if (e.key === "Escape") {
      setContextMenuState("default");
      setNewItemName("");
      setNewItemLink("");
    }
  };

  return (
    <div
      ref={(node) => {
        if (node) {
          drop(node as unknown as HTMLElement);
        }
      }}
      className="bg-blue-100 min-h-screen p-4 relative"
    >
      <ContextMenu>
        <ContextMenuTrigger className="flex-1 h-full">
          <div className="min-h-screen">
            <DesktopContent
              items={items.filter((item) => item.parentId === null)}
              moveItem={moveItem}
              openWindow={openWindow}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              deleteItem={deleteItem}
              setActiveParentId={setActiveParentId}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <AnimatePresence mode="wait">
            {contextMenuState === "default" && (
              <motion.div
                key="default"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <ContextMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setContextMenuState("newFolder");
                  }}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <span>New Folder</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setContextMenuState("newBookmark");
                  }}
                >
                  <File className="mr-2 h-4 w-4" />
                  <span>New Bookmark</span>
                </ContextMenuItem>
              </motion.div>
            )}
            {contextMenuState === "newFolder" && (
              <motion.div
                key="newFolder"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2">
                  <button
                    onClick={() => setContextMenuState("default")}
                    className="mb-2 p-1 hover:bg-gray-100 rounded-full"
                    aria-label="Back"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <Input
                    ref={inputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Folder name"
                    className="mb-2"
                  />
                  <Button onClick={handleCreateNewItem} className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Create Folder
                  </Button>
                </div>
              </motion.div>
            )}
            {contextMenuState === "newBookmark" && (
              <motion.div
                key="newBookmark"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2">
                  <button
                    onClick={() => setContextMenuState("default")}
                    className="mb-2 p-1 hover:bg-gray-100 rounded-full"
                    aria-label="Back"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <Input
                    ref={inputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Bookmark name"
                    className="mb-2"
                  />
                  <Input
                    value={newItemLink}
                    onChange={(e) => setNewItemLink(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://example.com"
                    className="mb-2"
                  />
                  <Button onClick={handleCreateNewItem} className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Create Bookmark
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ContextMenuContent>
      </ContextMenu>

      {windows.map((windowItem) => (
        <DraggableWindow
          key={windowItem.id}
          windowItem={windowItem}
          closeWindow={closeWindow}
          minimizeWindow={minimizeWindow}
          moveWindow={moveWindow}
        >
          <DesktopContent
            items={windowItem.item.content || []}
            moveItem={moveItem}
            openWindow={openWindow}
            parentId={windowItem.item.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            deleteItem={deleteItem}
            setActiveParentId={setActiveParentId}
          />
        </DraggableWindow>
      ))}
    </div>
  );
};

const DesktopContent: React.FC<{
  items: Item[];
  moveItem: (draggedId: string, targetId: string | null) => void;
  openWindow: (item: Item) => void;
  parentId?: string | null;
  onDragStart: (item: Item) => void;
  onDragEnd: () => void;
  deleteItem: (itemId: string) => void;
  setActiveParentId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({
  items,
  moveItem,
  openWindow,
  parentId = null,
  onDragStart,
  onDragEnd,
  deleteItem,
  setActiveParentId,
}) => {
  const [, drop] = useDrop(
    () => ({
      accept: "ITEM",
      drop: (droppedItem: Item) => {
        moveItem(droppedItem.id, parentId);
      },
    }),
    [moveItem, parentId]
  );

  return (
    <div
      ref={(node) => {
        if (node) {
          drop(node as unknown as HTMLElement);
        }
      }}
      className="min-h-full"
      onClick={() => setActiveParentId(parentId)}
    >
      <div className="grid grid-cols-6 gap-4">
        {items.map((item) => (
          <DesktopItem
            key={item.id}
            item={item}
            moveItem={moveItem}
            openWindow={openWindow}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            deleteItem={deleteItem}
            setActiveParentId={setActiveParentId}
          />
        ))}
      </div>
    </div>
  );
};

const DesktopItem: React.FC<{
  item: Item;
  moveItem: (draggedId: string, targetId: string | null) => void;
  openWindow: (item: Item) => void;
  onDragStart: (item: Item) => void;
  onDragEnd: () => void;
  deleteItem: (itemId: string) => void;
  setActiveParentId: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({
  item,
  moveItem,
  openWindow,
  onDragStart,
  onDragEnd,
  deleteItem,
  setActiveParentId,
}) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "ITEM",
      item: () => {
        onDragStart(item);
        return { ...item };
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      end: () => {
        onDragEnd();
      },
    }),
    [item, onDragStart, onDragEnd]
  );

  const [, drop] = useDrop(
    () => ({
      accept: "ITEM",
      drop: (droppedItem: Item) => {
        if (item.type === "folder") {
          moveItem(droppedItem.id, item.id);
        }
      },
    }),
    [item, moveItem]
  );

  const handleClick = () => {
    if (item.type === "file" && item.link) {
      window.open(item.link, "_blank");
    } else if (item.type === "folder") {
      openWindow(item);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={(node) => {
            if (item.type === "folder" && node) {
              drop(node as unknown as HTMLElement);
            }
          }}
          className={`flex flex-col items-center p-2 cursor-pointer ${
            isDragging ? "opacity-50" : ""
          }`}
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
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {item.type === "file" ? (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setActiveParentId(item.parentId);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Bookmark</span>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setActiveParentId(item.id);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            <span>Rename Folder</span>
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onSelect={(e) => {
            e.preventDefault();
            deleteItem(item.id);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete {item.type === "folder" ? "Folder" : "Bookmark"}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const DraggableWindow: React.FC<{
  windowItem: Window;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  children: React.ReactNode;
}> = ({ windowItem, closeWindow, minimizeWindow, moveWindow, children }) => {
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

// Wrap Desktop with DndProvider and export
const DesktopWrapper: React.FC = () => (
  <DndProvider backend={HTML5Backend}>
    <Desktop />
  </DndProvider>
);

export default DesktopWrapper;
