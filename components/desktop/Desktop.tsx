/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Folder, File } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Toaster, toast } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

import AppSidebar from "@/components/desktop/Sidebar";
import { DragDropArea } from "@/components/desktop/DragAndDropArea";
import { ItemModal } from "@/components/desktop/ItemModal";
import { DraggableWindow } from "@/components/desktop/DraggableWindow";

export interface Item {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: Item[];
  link?: string;
  parentId: string | null;
  path: string;
}

export interface WindowItem {
  id: string;
  itemId: string; // Updated to reference item by ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

export interface ModalState {
  open: boolean;
  type: "new" | "edit" | "rename" | null;
  itemType: "file" | "folder" | null;
  parentId: string | null;
  item: Item | null;
}

export interface DropResult {
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

export default function Component() {
  return <Desktop />;
}
