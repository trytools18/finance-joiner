
import { TableHead } from "@/components/ui/table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Column } from "../types";

export const SortableHeader = ({ column }: { column: Column }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={cn(
        isDragging && "bg-muted/50 backdrop-blur-sm",
        "select-none"
      )}
    >
      {column.label}
    </TableHead>
  );
};
