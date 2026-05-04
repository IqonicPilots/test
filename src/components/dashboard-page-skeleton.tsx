import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

export function StatValueSkeleton() {
  return (
    <div className="mt-1 flex items-baseline gap-2">
      <Skeleton className="h-7 w-10" />
      <Skeleton className="h-4 w-14" />
    </div>
  )
}

const ROW_WIDTHS = ["w-[95%]", "w-[85%]", "w-[90%]", "w-[80%]", "w-[88%]"]

export function TableBodySkeleton({
  columnCount,
  rowCount = 5,
}: {
  columnCount: number
  rowCount?: number
}) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <TableRow key={rowIdx} className="hover:bg-transparent">
          <TableCell colSpan={columnCount} className="py-5 px-4">
            <Skeleton
              className={`h-5 rounded ${ROW_WIDTHS[rowIdx % ROW_WIDTHS.length]}`}
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function ListingTableSkeleton({ rowCount = 6 }: { rowCount?: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-9 w-64 rounded-md" />
        <Skeleton className="ml-auto h-9 w-28 rounded-md" />
      </div>
      <div className="rounded-md border">
        <div className="flex items-center gap-4 border-b py-3 px-4">
          <Skeleton className="h-4 w-10 shrink-0" />
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-4 w-20 shrink-0" />
          <Skeleton className="h-4 w-16 shrink-0" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 px-4">
            <Skeleton className="h-4 w-10 shrink-0" />
            <Skeleton className="h-4 w-32 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
         <Skeleton className="h-5 w-1/4" />
         <Skeleton className="h-4 w-2/4" />
      </div>
      <div className="space-y-4 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-10 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <Skeleton className="h-10 w-24 shrink-0 rounded-md" />
      </div>
    </div>
  )
}
