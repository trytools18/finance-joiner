
import { TableHead } from "@/components/ui/table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Column } from "../types";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SortableHeaderProps {
  column: Column & {
    sortable?: boolean;
    sortDirection?: "asc" | "desc" | null;
    onSort?: () => void;
  };
}

export const SortableHeader = ({ column }: SortableHeaderProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: column.sortable ? 'pointer' : 'grab',
    touchAction: 'none',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={column.sortable ? column.onSort : undefined}
      className={cn(
        isDragging && "bg-muted/50 backdrop-blur-sm",
        "select-none relative group",
        column.sortable && "cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2">
        {column.label}
        {column.sortable && (
          <div className="flex flex-col">
            <ArrowUp 
              className={cn(
                "h-3 w-3 transition-colors",
                column.sortDirection === "asc" ? "text-foreground" : "text-muted-foreground/30"
              )}
            />
            <ArrowDown 
              className={cn(
                "h-3 w-3 transition-colors",
                column.sortDirection === "desc" ? "text-foreground" : "text-muted-foreground/30"
              )}
            />
          </div>
        )}
      </div>
    </TableHead>
  );
};
