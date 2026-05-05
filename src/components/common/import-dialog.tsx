import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, FileText, Loader2, AlertCircle, Download, Trash } from "lucide-react"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type ImportFormat = "csv" | "xls"

function importErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string" && err.trim()) return err
  return "Import failed. Please try again."
}

export interface ImportDialogProps {
  /**
   * Called after the file is parsed. Return `false` to stop without showing
   * the default success toast (e.g. validation failed; show your own toasts).
   */
  onImport: (data: any[]) => Promise<void | false> | void | false
  /** Dialog title text. Defaults to "Import Data" */
  title?: string
  /** Description text below the title. */
  description?: string
  /** Label on the trigger button. Defaults to "Import" */
  buttonLabel?: string
  /** An array of note strings to display at the bottom of the dialog */
  notes?: string[]
  /** An array of required fields to display at the bottom of the dialog */
  requiredFields?: string[]
}

export function ImportDialog({
  onImport,
  title = "Import Data",
  description = "Upload a file to import data. Please ensure it follows the required format.",
  buttonLabel = "Import",
  notes = [],
  requiredFields = [],
}: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [importFormat, setImportFormat] = useState<ImportFormat>("csv")
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      clearSelectedFile()
      setIsImporting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import.")
      return
    }

    setIsImporting(true)
    try {
      const isCsv = importFormat === "csv" || selectedFile.name.endsWith(".csv")
      const isXls = importFormat === "xls" || selectedFile.name.endsWith(".xls") || selectedFile.name.endsWith(".xlsx")
      
      if (importFormat === "csv" && !isCsv) {
        toast.error("Format mismatch: Please upload a valid CSV file.")
        clearSelectedFile()
        setIsImporting(false)
        return
      }

      const reader = newFileReader()
      if (importFormat === "csv") {
         reader.readAsText(selectedFile)
      } else {
         reader.readAsArrayBuffer(selectedFile)
      }

      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          let parsedRows: any[] = []

          if (importFormat === "csv") {
            // Read CSV
            const workbook = XLSX.read(data, { type: "string" })
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
          } else {
            // Read XLS / XLSX
            const workbook = XLSX.read(data, { type: "buffer", cellDates: true, raw: false })
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            parsedRows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
          }

          if (parsedRows.length === 0) {
            toast.error("The uploaded file is empty or invalid.")
            clearSelectedFile()
            return
          }

          try {
            const outcome = await onImport(parsedRows)
            if (outcome === false) {
              clearSelectedFile()
              return
            }
            toast.success("File imported successfully!")
            clearSelectedFile()
            setOpen(false)
          } catch (importError) {
            const msg = importErrorMessage(importError)
            if (process.env.NODE_ENV === "development") {
              console.warn("Import processing failed:", msg)
            }
            toast.error(msg)
            clearSelectedFile()
          }

        } catch (error) {
          const msg = importErrorMessage(error)
          if (process.env.NODE_ENV === "development") {
            console.warn("Error parsing import file:", msg)
          }
          toast.error("Failed to parse file. Please verify the format.")
          clearSelectedFile()
        } finally {
          setIsImporting(false)
        }
      }
      
      reader.onerror = () => {
        toast.error("Failed to read the file.")
        clearSelectedFile()
        setIsImporting(false)
      }
    } catch (e) {
      setIsImporting(false)
    }
  }

  // helper function to return FileReader
  function newFileReader() {
    return new FileReader()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-8 gap-2 cursor-pointer"
          id="import-dialog-btn"
        >
          <Download className="h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-start">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-format-select" className="text-sm font-medium">
              Select Format
            </Label>
            <Select
              value={importFormat}
              onValueChange={(val) => {
                setImportFormat(val as ImportFormat)
                clearSelectedFile()
              }}
            >
              <SelectTrigger
                id="import-format-select"
                className="cursor-pointer w-full"
              >
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      CSV
                      <span className="text-xs text-muted-foreground ml-2">
                        Comma-separated values (.csv)
                      </span>
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="xls" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      Excel (XLS / XLSX)
                      <span className="text-xs text-muted-foreground ml-2">
                        Microsoft Excel format
                      </span>
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file-upload" className="text-sm font-medium">
              File Upload
            </Label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={importFormat === "csv" ? ".csv" : ".xls,.xlsx"}
              onChange={handleFileChange}
              className="sr-only"
              tabIndex={-1}
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 flex-1 border rounded-md py-1 px-2 text-sm bg-muted/40 min-w-0 h-9">
                <span className="flex-1 truncate block overflow-hidden text-ellipsis whitespace-nowrap" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive shrink-0"
                  onClick={clearSelectedFile}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="cursor-pointer w-[150px] gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                <span>Upload File</span>
              </Button>
            )}
          </div>

          {requiredFields && requiredFields.length > 0 && (
            <div className="mt-2 bg-danger-50/50 dark:bg-danger-900/10 border border-destructive rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <div className="text-xs text-muted-foreground mr-1">
                <p className="font-medium text-destructive">
                  Required Fields: 
                </p>
                <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-1 mt-1">
                  {requiredFields.map((field, index) => (
                    <li key={index} className="text-destructive">
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {notes && notes.length > 0 && (
            <div className="mt-2 border border-blue-500 dark:border-amber-500 rounded-lg p-3 flex gap-2">
              <div className="text-xs text-muted-foreground mr-1">
                <p className="text-blue-500 dark:text-amber-500">
                  Notes:
                </p>
                <ul className="list-disc list-inside flex flex-col gap-1 mt-1">
                  {notes.map((note, index) => (
                    <li key={index} className="text-blue-500 dark:text-amber-500">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="cursor-pointer"
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || !selectedFile}
            className="cursor-pointer gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
