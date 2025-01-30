import React, { memo } from "react";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, Folder, File } from "lucide-react";

import type { Item } from "@/types/desktop";

interface TreeProps {
  item: Item;
}

const Tree: React.FC<TreeProps> = memo(({ item }) => {
  if (item.type === "folder" && item.content) {
    return (
      <SidebarMenuItem>
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              <ChevronRight className="transition-transform" />
              <Folder className="mr-2" />
              {item.name}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.content.map((subItem) => (
                <Tree key={subItem.id} item={subItem} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuButton>
      <File className="mr-2" />
      {item.name}
    </SidebarMenuButton>
  );
});

// Assigning displayName to the memoized component
Tree.displayName = "Tree";

export default Tree;
