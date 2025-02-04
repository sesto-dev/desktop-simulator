import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import type {
  Item,
  WindowItem,
  ModalState,
  ClipboardItem,
} from "@/types/desktop";

export const useDesktop = (initialItems: Item[]) => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    type: null,
    itemType: null,
    parentId: null,
    item: null,
  });
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<Item | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  // Update windows state whenever items change
  useEffect(() => {
    setWindows((prevWindows) =>
      prevWindows.map((window) => {
        const updatedItem = findItemById(items, window.itemId);
        return updatedItem ? { ...window, item: updatedItem } : window;
      })
    );
  }, [items]);

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
      if (draggedId === targetId) {
        toast(
          "Cannot move item to the same location. Please select a different location."
        );
        return; // Prevent dragging onto itself
      }

      setItems((prevItems) => {
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

        const targetPath = targetId
          ? getItemPath(updatedItems, targetId)
          : "/desktop";

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
      } else if (modalState.type === "edit" || modalState.type === "rename") {
        if (!modalState.item) {
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
        itemId: item.id,
        position: { x: 50 + prev.length * 20, y: 50 + prev.length * 20 },
        size: { width: 400, height: 300 },
        isMinimized: false,
        item, // Include the item directly in the window object
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

    setWindows((prevWindows) => prevWindows.filter((w) => w.itemId !== itemId));

    toast.success("Item deleted successfully.");
  }, []);

  const handleCopy = useCallback((item: Item) => {
    setClipboard({
      item,
      operation: "copy",
    });
    toast.success(`Copied ${item.name}`);
  }, []);

  const handleCut = useCallback((item: Item) => {
    setClipboard({
      item,
      operation: "cut",
    });
    setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
    toast.success(`Cut ${item.name}`);
  }, []);

  const handlePaste = useCallback(
    (parentId?: string | null) => {
      if (!clipboard) {
        toast.error("Clipboard is empty");
        return;
      }

      setItems((prevItems) => {
        const newItem = {
          ...clipboard.item,
          id: Date.now().toString(),
          parentId: parentId || modalState.parentId,
        };

        if (clipboard.operation === "cut") {
          // Remove the original item
          const updatedItems = prevItems.filter(
            (item) => item.id !== clipboard.item.id
          );
          return [...updatedItems, newItem];
        } else {
          return [...prevItems, newItem];
        }
      });

      setClipboard(null);
      toast.success(`Pasted ${clipboard.item.name}`);
    },
    [clipboard, modalState.parentId]
  );

  const handleEmptySpaceRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return {
    items,
    windows,
    modalState,
    draggedItem,
    desktopRef,
    moveItem,
    openWindow,
    closeWindow,
    minimizeWindow,
    moveWindow,
    setModalState,
    handleItemOperation,
    deleteItem,
    handleDragStart,
    handleDragEnd,
    handleCopy,
    handleCut,
    handlePaste,
    handleEmptySpaceRightClick,
  };
};
