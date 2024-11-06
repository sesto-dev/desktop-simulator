/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  DndProvider,
  useDrag,
  useDrop,
  DragSourceMonitor,
  DropTargetMonitor,
} from "react-dnd";
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
  ChevronRight,
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
import { Toaster, toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import Tree from "./tree";

export interface Item {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: Item[];
  link?: string;
  parentId: string | null;
  path: string;
}

interface WindowItem {
  id: string;
  itemId: string; // Updated to reference item by ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

interface ModalState {
  open: boolean;
  type: "new" | "edit" | "rename" | null;
  itemType: "file" | "folder" | null;
  parentId: string | null;
  item: Item | null;
}

// Define DropResult interface
interface DropResult {
  id: string;
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
        path: "/desktop/Documents/Resume",
      },
    ],
    parentId: null,
    path: "/desktop/Documents",
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
        path: "/desktop/Images/Photo",
      },
    ],
    parentId: null,
    path: "/desktop/Images",
  },
  {
    id: "3",
    name: "Notes",
    type: "file",
    link: "https://example.com/notes",
    parentId: null,
    path: "/desktop/Notes",
  },
];

const Desktop: React.FC = () => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    type: null,
    itemType: null,
    parentId: null,
    item: null,
  });
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);

  const desktopRef = useRef<HTMLDivElement>(null);

  const getItemPath = useCallback((items: Item[], itemId: string): string => {
    const findPath = (currentItems: Item[]): string | null => {
      for (const item of currentItems) {
        if (item.id === itemId) {
          return item.path;
        }
        if (item.content) {
          const path = findPath(item.content);
          if (path) {
            return path;
          }
        }
      }
      return null;
    };

    return findPath(items) || "/desktop";
  }, []);

  const findItemById = useCallback((items: Item[], id: string): Item | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === "folder" && item.content) {
        const found = findItemById(item.content, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const moveItem = useCallback(
    (draggedId: string, targetId: string | null, sourcePath: string) => {
      setItems((prevItems) => {
        // Immutable removal
        const findItemAndRemove = (
          items: Item[],
          id: string
        ): [Item | null, Item[]] => {
          let removedItem: Item | null = null;

          const newItems = items.reduce<Item[]>((acc, item) => {
            if (item.id === id) {
              removedItem = { ...item };
              return acc;
            }
            if (item.content) {
              const [found, updatedContent] = findItemAndRemove(
                item.content,
                id
              );
              if (found) {
                acc.push({ ...item, content: updatedContent });
                removedItem = found;
                return acc;
              }
            }
            acc.push(item);
            return acc;
          }, []);

          return [removedItem, newItems];
        };

        const [draggedItem, newItems] = findItemAndRemove(prevItems, draggedId);
        if (!draggedItem) return prevItems;

        // Immutable insertion
        const insertItem = (
          items: Item[],
          item: Item,
          targetId: string | null
        ): Item[] => {
          if (targetId === null) {
            const newPath = `/desktop/${item.name}`;
            return [...items, { ...item, parentId: null, path: newPath }];
          }

          return items.map((i) => {
            if (i.id === targetId) {
              const newPath = `${i.path}/${item.name}`;
              return {
                ...i,
                content: i.content
                  ? [
                      ...i.content,
                      { ...item, parentId: targetId, path: newPath },
                    ]
                  : [{ ...item, parentId: targetId, path: newPath }],
              };
            }
            if (i.content) {
              return { ...i, content: insertItem(i.content, item, targetId) };
            }
            return i;
          });
        };

        const updatedItems = insertItem(newItems, draggedItem, targetId);

        // Get the correct target path
        const targetPath = targetId
          ? getItemPath(updatedItems, targetId)
          : "/desktop";

        // Log the operation using Sonner
        toast.success(
          `Transferring ${draggedItem.name} ${draggedItem.type} from ${sourcePath} to ${targetPath}`
        );

        return updatedItems;
      });
    },
    [getItemPath]
  );

  const handleItemOperation = useCallback(
    (name: string, link?: string) => {
      if (modalState.type === "new") {
        const parentPath = modalState.parentId
          ? getItemPath(items, modalState.parentId)
          : "/desktop";
        const newItem: Item = {
          id: Date.now().toString(),
          name,
          type: modalState.itemType!,
          parentId: modalState.parentId,
          path: `${parentPath}/${name}`,
          ...(modalState.itemType === "file" ? { link } : { content: [] }),
        };

        setItems((prevItems) => {
          const updateItemsRecursively = (items: Item[]): Item[] => {
            return items.map((item) => {
              if (item.id === modalState.parentId) {
                return {
                  ...item,
                  content: [...(item.content || []), newItem],
                };
              }
              if (item.content) {
                return {
                  ...item,
                  content: updateItemsRecursively(item.content),
                };
              }
              return item;
            });
          };

          if (modalState.parentId === null) {
            return [...prevItems, newItem];
          } else {
            return updateItemsRecursively(prevItems);
          }
        });

        setWindows((prevWindows) => {
          return prevWindows.map((window) => {
            if (window.itemId === modalState.parentId) {
              // No longer needed to update windows here
              return window;
            }
            return window;
          });
        });
      } else if (modalState.type === "edit" || modalState.type === "rename") {
        if (!modalState.item) {
          // Early return or handle error as needed
          toast.error("No item selected for editing.");
          return;
        }

        setItems((prevItems) => {
          const updateItemRecursively = (items: Item[]): Item[] => {
            return items.map((item) => {
              if (item.id === modalState.item!.id) {
                const updatedItem = { ...item, name };
                if (item.parentId) {
                  const parentPath = getItemPath(prevItems, item.parentId);
                  updatedItem.path = `${parentPath}/${name}`;
                } else {
                  updatedItem.path = `/desktop/${name}`;
                }
                if (item.type === "file" && link) {
                  updatedItem.link = link;
                }
                return updatedItem;
              }
              if (item.content) {
                return {
                  ...item,
                  content: updateItemRecursively(item.content),
                };
              }
              return item;
            });
          };

          return updateItemRecursively(prevItems);
        });

        setWindows((prevWindows) => {
          return prevWindows.map((window) => {
            if (window.itemId === modalState.item!.id) {
              return window; // No need to update since window references the item by ID
            }
            return window;
          });
        });
      }

      setModalState({
        open: false,
        type: null,
        itemType: null,
        parentId: null,
        item: null,
      });
    },
    [modalState, items, getItemPath]
  );

  const openWindow = useCallback((item: Item) => {
    setWindows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        itemId: item.id, // Reference to the folder's ID
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

  const handleDragStart = useCallback((item: Item) => {
    setDraggedItem(item);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const deleteItemRecursively = (items: Item[]): Item[] => {
        return items
          .filter((item) => item.id !== itemId)
          .map((item) => ({
            ...item,
            content: item.content
              ? deleteItemRecursively(item.content)
              : undefined,
          }));
      };

      return deleteItemRecursively(prevItems);
    });

    setWindows(
      (prevWindows) => prevWindows.filter((w) => w.itemId !== itemId) // Remove windows referencing the deleted item
    );

    toast.success("Item deleted successfully.");
  }, []);

  const convertToTreeFormat = (items: Item[]): any[] => {
    return items.map((item) => {
      if (item.type === "folder" && item.content) {
        return [item.name, ...convertToTreeFormat(item.content)];
      }
      return item.name;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <SidebarProvider>
        <div ref={desktopRef} className="flex h-screen" tabIndex={-1}>
          <Toaster />
          <AppSidebar items={items} />
          <div className="flex-1 p-4 relative">
            <ContextMenu>
              <ContextMenuTrigger className="min-h-full w-full">
                <div className="min-h-full w-full">
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
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-64">
                <ContextMenuItem
                  onSelect={() =>
                    setModalState({
                      open: true,
                      type: "new",
                      itemType: "folder",
                      parentId: null,
                      item: null,
                    })
                  }
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <span>New Folder</span>
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() =>
                    setModalState({
                      open: true,
                      type: "new",
                      itemType: "file",
                      parentId: null,
                      item: null,
                    })
                  }
                >
                  <File className="mr-2 h-4 w-4" />
                  <span>New Bookmark</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>

            {windows.map((windowItem) => {
              const currentItem = findItemById(items, windowItem.itemId);

              if (!currentItem) return null; // Handle case where item might be deleted

              return (
                <DraggableWindow
                  key={windowItem.id}
                  windowItem={{
                    ...windowItem,
                    item: currentItem, // Use the latest item data
                  }}
                  closeWindow={closeWindow}
                  minimizeWindow={minimizeWindow}
                  moveWindow={moveWindow}
                >
                  <DragDropArea
                    items={currentItem.content || []}
                    moveItem={moveItem}
                    openWindow={openWindow}
                    setModalState={setModalState}
                    parentId={currentItem.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    deleteItem={deleteItem}
                    parentPath={currentItem.path}
                  />
                </DraggableWindow>
              );
            })}

            <ItemModal
              modalState={modalState}
              setModalState={setModalState}
              handleItemOperation={handleItemOperation}
            />
          </div>
        </div>
      </SidebarProvider>
    </DndProvider>
  );
};

function AppSidebar({
  items,
}: React.ComponentProps<typeof Sidebar> & { items: Item[] }) {
  const treeData = convertToTreeFormat(items);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <Tree key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

interface TreeProps {
  item: Item;
}

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

const DragDropArea: React.FC<DragDropAreaProps> = ({
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

const DesktopItem: React.FC<DesktopItemProps> = ({
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

interface ItemModalProps {
  modalState: ModalState;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  handleItemOperation: (name: string, link?: string) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({
  modalState,
  setModalState,
  handleItemOperation,
}) => {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalState.open) {
      setName(modalState.item?.name || "");
      setLink(modalState.item?.link || "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [modalState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleItemOperation(name, link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setModalState({
        open: false,
        type: null,
        itemType: null,
        parentId: null,
        item: null,
      });
    }
  };

  if (!modalState.open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white p-4 rounded-lg w-96">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {modalState.type === "new"
                ? modalState.itemType === "folder"
                  ? "New Folder"
                  : "New Bookmark"
                : modalState.type === "edit"
                ? "Edit Bookmark"
                : "Rename Folder"}
            </h2>
            <button
              type="button"
              onClick={() =>
                setModalState({
                  open: false,
                  type: null,
                  itemType: null,
                  parentId: null,
                  item: null,
                })
              }
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                modalState.itemType === "folder"
                  ? "Folder name"
                  : "Bookmark name"
              }
              required
            />
            {modalState.itemType === "file" && (
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                required={modalState.type === "new"}
              />
            )}
            <Button type="submit" className="w-full">
              {modalState.type === "new" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DraggableWindowProps {
  windowItem: WindowItem & { item: Item };
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  children: React.ReactNode;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
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

// Convert to Tree Format remains unchanged
function convertToTreeFormat(items: Item[]): any[] {
  return items.map((item) => {
    if (item.type === "folder" && item.content) {
      return [item.name, ...convertToTreeFormat(item.content)];
    }
    return item.name;
  });
}

export default function Component() {
  return <Desktop />;
}
