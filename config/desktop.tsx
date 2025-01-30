import type { Item } from "@/types/desktop";

export const initialItems: Item[] = [
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
