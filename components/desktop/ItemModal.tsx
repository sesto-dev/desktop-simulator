import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ModalState } from "@/types/desktop";

interface ItemModalProps {
  modalState: ModalState;
  setModalState: React.Dispatch<React.SetStateAction<ModalState>>;
  handleItemOperation: (name: string, link?: string) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
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
      className="fixed inset-0 bg-opacity-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      style={{ zIndex: 1001 }}
    >
      <div className="bg-neutral-800/30 backdrop-blur-sm p-4 rounded-lg w-96">
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
              className=""
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
