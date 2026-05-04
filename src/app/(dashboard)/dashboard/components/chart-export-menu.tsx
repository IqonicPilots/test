"use client"

import { MoreVertical, ImageIcon, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportAsImage, downloadCSV } from "@/lib/chart-export"

interface ChartExportMenuProps {
  chartId: string
  data: any[]
  filename: string
}

export function ChartExportMenu({ chartId, data, filename }: ChartExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground cursor-pointer">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuLabel>Export Chart</DropdownMenuLabel>
        <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => exportAsImage(chartId, 'png', filename)}
        >
          <ImageIcon className="h-4 w-4" /> Download PNG
        </DropdownMenuItem>
        <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => exportAsImage(chartId, 'jpeg', filename)}
        >
          <ImageIcon className="h-4 w-4" /> Download JPEG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => downloadCSV(data, filename)}
        >
          <FileSpreadsheet className="h-4 w-4" /> Download CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
