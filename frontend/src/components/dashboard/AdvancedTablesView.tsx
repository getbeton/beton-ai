"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  AlertCircle,
  XCircle,
  Columns,
  MoreHorizontal,
  Filter,
  ListFilter,
  Upload,
  Search,
  Edit,
  Copy,
  Trash2,
  Eye,
  FileSpreadsheet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type TableItem = {
  id: string
  name: string
  rows: number
  columns: number
  source: "CSV" | "Apollo" | "Manual"
  lastModified: Date
  status: "processing" | "ready" | "error" | "importing"
  description?: string
  owner?: string
}

interface AdvancedTablesViewProps {
  tables: TableItem[]
  onImportCSV: () => void
  onSearchApollo: () => void
  onViewTable: (id: string) => void
  onEditTable: (id: string) => void
  onDuplicateTable: (id: string) => void
  onDeleteTable: (id: string) => void
}

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<TableItem> = (row, columnId, filterValue) => {
  const searchableRowContent =
    `${row.original.name} ${row.original.description || ""}`.toLowerCase()
  const searchTerm = (filterValue ?? "").toLowerCase()
  return searchableRowContent.includes(searchTerm)
}

// Filter function for source type
const sourceFilterFn: FilterFn<TableItem> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true
  const source = row.getValue(columnId) as string
  return filterValue.includes(source)
}

// Filter function for status
const statusFilterFn: FilterFn<TableItem> = (
  row,
  columnId,
  filterValue: string[]
) => {
  if (!filterValue?.length) return true
  const status = row.getValue(columnId) as string
  return filterValue.includes(status)
}

function RowActions({ 
  row, 
  onViewTable,
  onEditTable,
  onDuplicateTable,
  onDeleteTable,
}: { 
  row: Row<TableItem>
  onViewTable: (id: string) => void
  onEditTable: (id: string) => void
  onDuplicateTable: (id: string) => void
  onDeleteTable: (id: string) => void
}) {
  const table = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            className="shadow-none"
            aria-label="Table actions"
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onViewTable(table.id)}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View</span>
            <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEditTable(table.id)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicateTable(table.id)}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive"
          onClick={() => onDeleteTable(table.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AdvancedTablesView({
  tables,
  onImportCSV,
  onSearchApollo,
  onViewTable,
  onEditTable,
  onDuplicateTable,
  onDeleteTable,
}: AdvancedTablesViewProps) {
  const id = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // Load column visibility from localStorage on mount
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tables-column-visibility')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.warn('Failed to parse saved column visibility')
        }
      }
    }
    return {}
  })

  // Initialize filters from URL params
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    
    // Load search query from URL
    const searchQuery = searchParams.get('search')
    if (searchQuery) {
      filters.push({ id: 'name', value: searchQuery })
    }
    
    // Load source filter from URL
    const sourceFilter = searchParams.get('source')
    if (sourceFilter) {
      const sources = sourceFilter.split(',')
      filters.push({ id: 'source', value: sources })
    }
    
    // Load status filter from URL
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      const statuses = statusFilter.split(',')
      filters.push({ id: 'status', value: statuses })
    }
    
    return filters
  })

  // Initialize pagination from URL params
  const [pagination, setPagination] = useState<PaginationState>(() => {
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')
    
    return {
      pageIndex: page ? parseInt(page) - 1 : 0,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    }
  })

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "lastModified",
      desc: true, // Most recent first
    },
  ])

  const columns: ColumnDef<TableItem>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 28,
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <button
          onClick={() => onViewTable(row.original.id)}
          className="flex items-center gap-2 font-medium transition-colors hover:text-primary text-left"
        >
          <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{row.getValue("name")}</span>
        </button>
      ),
      size: 180,
      filterFn: multiColumnFilterFn,
      enableHiding: false,
    },
    {
      header: "Rows",
      accessorKey: "rows",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
            {(row.getValue("rows") as number).toLocaleString()}
          </Badge>
        </div>
      ),
      size: 80,
    },
    {
      header: "Columns",
      accessorKey: "columns",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className="text-muted-foreground text-sm">
            {row.getValue("columns")}
          </span>
        </div>
      ),
      size: 80,
    },
    {
      header: "Source",
      accessorKey: "source",
      cell: ({ row }) => {
        const source = row.getValue("source") as string
        const variant = source === "Apollo" ? "default" : source === "CSV" ? "secondary" : "outline"
        return (
          <div className="flex items-center">
            <Badge variant={variant} className="text-xs px-2 py-0">
              {source}
            </Badge>
          </div>
        )
      },
      size: 90,
      filterFn: sourceFilterFn,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
          ready: "default",
          processing: "secondary",
          importing: "secondary",
          error: "destructive",
        }
        return (
          <div className="flex items-center">
            <Badge variant={variants[status] || "outline"} className="text-xs px-2 py-0">
              {status}
            </Badge>
          </div>
        )
      },
      size: 100,
      filterFn: statusFilterFn,
    },
    {
      header: "Last Modified",
      accessorKey: "lastModified",
      cell: ({ row }) => {
        const date = row.getValue("lastModified") as Date
        const now = new Date()
        const diffInMs = now.getTime() - date.getTime()
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

        let formatted = ""
        if (diffInDays === 0) {
          formatted = "Today"
        } else if (diffInDays === 1) {
          formatted = "Yesterday"
        } else if (diffInDays < 7) {
          formatted = `${diffInDays} days ago`
        } else {
          formatted = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        }

        return (
          <div className="flex items-center">
            <span className="text-muted-foreground text-sm">{formatted}</span>
          </div>
        )
      },
      size: 120,
    },
    {
      header: "Owner",
      accessorKey: "owner",
      cell: ({ row }) => {
        const owner = row.getValue("owner") as string
        if (!owner) return null
        
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-[10px] text-white">
                {owner.split(" ").map((part) => part[0] ?? "").join("").substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{owner}</span>
          </div>
        )
      },
      size: 140,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions 
          row={row} 
          onViewTable={onViewTable}
          onEditTable={onEditTable}
          onDuplicateTable={onDuplicateTable}
          onDeleteTable={onDeleteTable}
        />
      ),
      size: 60,
      enableHiding: false,
    },
  ], [onViewTable, onEditTable, onDuplicateTable, onDeleteTable])

  const handleDeleteRows = () => {
    const selectedRows = table.getSelectedRowModel().rows
    selectedRows.forEach((row) => {
      onDeleteTable(row.original.id)
    })
    table.resetRowSelection()
  }

  const table = useReactTable({
    data: tables,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
  })

  // Get unique source values
  const uniqueSourceValues = useMemo(() => {
    const sourceColumn = table.getColumn("source")
    if (!sourceColumn) return []
    const values = Array.from(sourceColumn.getFacetedUniqueValues().keys())
    return values.sort()
  }, [table])

  // Get counts for each source
  const sourceCounts = useMemo(() => {
    const sourceColumn = table.getColumn("source")
    if (!sourceColumn) return new Map()
    return sourceColumn.getFacetedUniqueValues()
  }, [table])

  const selectedSources = useMemo(() => {
    const filterValue = table.getColumn("source")?.getFilterValue() as string[]
    return filterValue ?? []
  }, [table.getColumn("source")?.getFilterValue()])

  const handleSourceChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("source")?.getFilterValue() as string[]
    const newFilterValue = filterValue ? [...filterValue] : []

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table
      .getColumn("source")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  // Get unique status values
  const uniqueStatusValues = useMemo(() => {
    const statusColumn = table.getColumn("status")
    if (!statusColumn) return []
    const values = Array.from(statusColumn.getFacetedUniqueValues().keys())
    return values.sort()
  }, [table])

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const statusColumn = table.getColumn("status")
    if (!statusColumn) return new Map()
    return statusColumn.getFacetedUniqueValues()
  }, [table])

  const selectedStatuses = useMemo(() => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[]
    return filterValue ?? []
  }, [table.getColumn("status")?.getFilterValue()])

  const handleStatusChange = (checked: boolean, value: string) => {
    const filterValue = table.getColumn("status")?.getFilterValue() as string[]
    const newFilterValue = filterValue ? [...filterValue] : []

    if (checked) {
      newFilterValue.push(value)
    } else {
      const index = newFilterValue.indexOf(value)
      if (index > -1) {
        newFilterValue.splice(index, 1)
      }
    }

    table
      .getColumn("status")
      ?.setFilterValue(newFilterValue.length ? newFilterValue : undefined)
  }

  /**
   * Effect: Persist column visibility to localStorage
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tables-column-visibility', JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

  /**
   * Effect: Update URL params when filters, pagination, or sorting change
   * 
   * Enables browser back/forward navigation and shareable URLs
   */
  useEffect(() => {
    const params = new URLSearchParams()

    // Add search query to URL
    const searchFilter = columnFilters.find(f => f.id === 'name')
    if (searchFilter && searchFilter.value) {
      params.set('search', String(searchFilter.value))
    }

    // Add source filter to URL
    const sourceFilter = columnFilters.find(f => f.id === 'source')
    if (sourceFilter && Array.isArray(sourceFilter.value) && sourceFilter.value.length > 0) {
      params.set('source', sourceFilter.value.join(','))
    }

    // Add status filter to URL
    const statusFilter = columnFilters.find(f => f.id === 'status')
    if (statusFilter && Array.isArray(statusFilter.value) && statusFilter.value.length > 0) {
      params.set('status', statusFilter.value.join(','))
    }

    // Add pagination to URL
    if (pagination.pageIndex > 0) {
      params.set('page', String(pagination.pageIndex + 1))
    }
    if (pagination.pageSize !== 10) {
      params.set('pageSize', String(pagination.pageSize))
    }

    // Update URL without reloading page
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [columnFilters, pagination, pathname, router])

  return (
    <div className="space-y-6">
      {/* Filters and Table Card */}
      <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Filter by name or description */}
          <div className="relative">
            <Input
              id={`${id}-input`}
              ref={inputRef}
              className={cn(
                "peer min-w-60 ps-9",
                Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9"
              )}
              value={
                (table.getColumn("name")?.getFilterValue() ?? "") as string
              }
              onChange={(e) =>
                table.getColumn("name")?.setFilterValue(e.target.value)
              }
              placeholder="Filter by name or description..."
              type="text"
              aria-label="Filter by name or description"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
              <ListFilter size={16} aria-hidden="true" />
            </div>
            {Boolean(table.getColumn("name")?.getFilterValue()) && (
              <button
                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Clear filter"
                onClick={() => {
                  table.getColumn("name")?.setFilterValue("")
                  if (inputRef.current) {
                    inputRef.current.focus()
                  }
                }}
              >
                <XCircle size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          
          {/* Filter by source */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Source
                {selectedSources.length > 0 && (
                  <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {selectedSources.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Filter by source
                </div>
                <div className="space-y-3">
                  {uniqueSourceValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-source-${i}`}
                        checked={selectedSources.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleSourceChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-source-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {sourceCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter by status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                Status
                {selectedStatuses.length > 0 && (
                  <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {selectedStatuses.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto min-w-36 p-3" align="start">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Filter by status
                </div>
                <div className="space-y-3">
                  {uniqueStatusValues.map((value, i) => (
                    <div key={value} className="flex items-center gap-2">
                      <Checkbox
                        id={`${id}-status-${i}`}
                        checked={selectedStatuses.includes(value)}
                        onCheckedChange={(checked: boolean) =>
                          handleStatusChange(checked, value)
                        }
                      />
                      <Label
                        htmlFor={`${id}-status-${i}`}
                        className="flex grow justify-between gap-2 font-normal"
                      >
                        {value}{" "}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {statusCounts.get(value)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Toggle columns visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns
                  className="-ms-1 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3">
          {/* Delete button */}
          {table.getSelectedRowModel().rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="ml-auto" variant="outline">
                  <Trash2
                    className="-ms-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                  Delete
                  <span className="-me-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                    {table.getSelectedRowModel().rows.length}
                  </span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                    aria-hidden="true"
                  >
                    <AlertCircle className="opacity-80" size={16} />
                  </div>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{" "}
                      {table.getSelectedRowModel().rows.length} selected{" "}
                      {table.getSelectedRowModel().rows.length === 1
                        ? "table"
                        : "tables"}
                      .
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteRows}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Action buttons */}
          <Button variant="outline" onClick={onSearchApollo}>
            <Search className="-ms-1 opacity-60" size={16} aria-hidden="true" />
            Search Apollo
          </Button>
          <Button onClick={onImportCSV}>
            <Upload className="-ms-1 opacity-60" size={16} aria-hidden="true" />
            Import File
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border bg-background">
        <Table className="table-fixed [&_td]:h-[44px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                              "flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            // Enhanced keyboard handling for sorting
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUp
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDown
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-middle last:py-0">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No tables found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Page number information */}
        <div className="flex grow justify-end text-sm whitespace-nowrap text-muted-foreground">
          <p
            className="text-sm whitespace-nowrap text-muted-foreground"
            aria-live="polite"
          >
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{" "}
            of{" "}
            <span className="text-foreground">
              {table.getRowCount().toString()}
            </span>
          </p>
        </div>

        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent>
              {/* First page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirst size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Next page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Last page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLast size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      {/* End of Filters and Table Card */}
      </div>
    </div>
  )
}

