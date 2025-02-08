"use client";

import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DesktopContext } from "@/context/desktop";
import AppSidebar from "@/components/desktop/Sidebar";
import { DragDropArea } from "@/components/desktop/DragAndDropArea";
import { ItemModal } from "@/components/desktop/ItemModal";
import { DraggableWindow } from "@/components/desktop/DraggableWindow";
import { EmptySpaceContextMenu } from "@/components/desktop/EmptySpaceContextMenu";
import DotPattern from "../ui/dot-pattern";
import { cn } from "@/lib/utils";
import { useDesktop } from "@/hooks/useDesktop";

const DesktopWrapper: React.FC = () => {
  const desktopValues = useDesktop();

  return (
    <DndProvider backend={HTML5Backend}>
      <DesktopContext.Provider value={desktopValues}>
        <div ref={desktopValues.desktopRef} className="flex h-screen w-screen">
          <AppSidebar items={desktopValues.items} />
          <EmptySpaceContextMenu locationId="desktop">
            <div className="relative p-2 w-full h-full bg-background md:shadow-xl">
              <DotPattern
                className={cn(
                  "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
                )}
              />

              <DragDropArea
                items={desktopValues.items.filter(
                  (item) => item.locationId === null
                )}
                parentPath="/desktop"
              />

              {desktopValues.windows.map((windowItem) => (
                <DraggableWindow key={windowItem.id} windowItem={windowItem}>
                  <EmptySpaceContextMenu locationId={windowItem.item.id}>
                    <DragDropArea
                      items={windowItem.item.content || []}
                      locationId={windowItem.item.id}
                      parentPath={windowItem.item.path}
                    />
                  </EmptySpaceContextMenu>
                </DraggableWindow>
              ))}

              <ItemModal />
            </div>
          </EmptySpaceContextMenu>
        </div>
      </DesktopContext.Provider>
    </DndProvider>
  );
};

export default DesktopWrapper;
