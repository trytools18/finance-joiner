
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
  className?: string;
}

function TableSkeleton({ 
  rowCount = 5, 
  columnCount = 6, 
  className 
}: TableSkeletonProps) {
  return (
    <div className={cn("rounded-md border", className)}>
      <div className="min-w-[800px]">
        <div className="border-b">
          <div className="flex">
            {Array.from({ length: columnCount }).map((_, i) => (
              <div key={`header-${i}`} className="flex-1 p-4">
                <Skeleton className="h-5 w-full max-w-[120px]" />
              </div>
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRowSkeleton key={`row-${rowIndex}`} columnCount={columnCount} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TableRowSkeleton({ columnCount = 6 }: { columnCount?: number }) {
  return (
    <div className="flex border-b last:border-b-0">
      {Array.from({ length: columnCount }).map((_, i) => (
        <div key={`cell-${i}`} className="flex-1 p-4">
          <Skeleton className="h-5 w-full max-w-[150px]" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, TableSkeleton, TableRowSkeleton }
