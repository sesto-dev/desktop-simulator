export interface Item {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: Item[];
  link?: string;
  locationId: string | null;
  path: string;
}

export interface WindowItem {
  id: string;
  itemId: string;
  item: Item;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
}

export interface ModalState {
  open: boolean;
  type: "new" | "edit" | "rename" | "copy" | "cut" | null;
  itemType: "file" | "folder" | null;
  locationId: string | null;
  item: Item | null;
}

export interface DropResult {
  id: string;
}

export interface ClipboardItem {
  item: Item;
  operation: "copy" | "cut";
}
