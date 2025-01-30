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
  itemId: string;
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
