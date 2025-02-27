
import { DragEndEvent, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";
import { Column } from "../types";
import { createTableColumns } from "../table/TableColumns";

interface UseColumnDragAndDropProps {
  getPartyName: (partyId: string | null) => string;
  getCategoryName: (transaction: any) => string;
  handleStatusChange: (id: string, status: any) => void;
  handleVatClearableChange?: (id: string, vatClearable: boolean) => void;
  currencyCode: "USD" | "EUR" | "GBP";
}

export const useColumnDragAndDrop = ({
  getPartyName,
  getCategoryName,
  handleStatusChange,
  handleVatClearableChange = () => {}, // Default noop function if not provided
  currencyCode
}: UseColumnDragAndDropProps) => {
  const sensors = useSensors(useSensor(MouseSensor));
  const [columns, setColumns] = useState<Column[]>([]);

  // Initialize columns if not yet set
  if (columns.length === 0 || columns.length !== 7) {
    setColumns(createTableColumns(
      getPartyName,
      getCategoryName,
      handleStatusChange,
      handleVatClearableChange,
      currencyCode
    ));
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return {
    sensors,
    columns,
    handleDragEnd
  };
};
