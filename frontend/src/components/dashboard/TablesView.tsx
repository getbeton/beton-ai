import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Star,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

export interface TablesViewItem {
  id: string;
  name: string;
  rowCount: number;
  lastModified: Date;
  owner: string;
  isFavorite: boolean;
}

interface TablesViewProps {
  tables: TablesViewItem[];
  onImportCSV: () => void;
  onSearchApollo: () => void;
  onEditTable: (id: string) => void;
  onDuplicateTable: (id: string) => void;
  onDeleteTable: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function TablesView({
  tables,
  onImportCSV,
  onSearchApollo,
  onEditTable,
  onDuplicateTable,
  onDeleteTable,
  onToggleFavorite,
}: TablesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTables = useMemo(() => {
    if (!searchQuery) {
      return tables;
    }

    const lower = searchQuery.toLowerCase();
    return tables.filter((table) => table.name.toLowerCase().includes(lower));
  }, [tables, searchQuery]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    }
    if (diffInDays === 1) {
      return "Yesterday";
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleActionToast = (action: string, tableName: string) => {
    toast.success(`${action} "${tableName}"`, {
      duration: 2500,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm shadow-primary/10 md:flex">
            <Image
              src="/dashboard/beton-glyph.svg"
              alt="Beton glyph"
              width={24}
              height={24}
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Tables
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Upload CSV files, review Apollo searches, and keep your workspace tidy.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-border bg-background pl-9 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={onSearchApollo}
              className="rounded-xl border-border bg-white px-5 shadow-sm hover:border-primary/60 hover:bg-primary/5"
            >
              <Search className="mr-2 h-4 w-4" />
              Search Apollo
            </Button>
            <Button
              size="lg"
              onClick={onImportCSV}
              className="rounded-xl bg-primary px-5 text-primary-foreground shadow-primary/30 hover:bg-primary/90"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import File
            </Button>
          </div>
        </div>
      </div>

      {filteredTables.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery ? "No tables found matching your search" : "No tables yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <UITable>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Name</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTables.map((table) => (
                <TableRow key={table.id} className="group">
                  <TableCell>
                    <button
                      onClick={() => onToggleFavorite(table.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Toggle favorite for ${table.name}`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          table.isFavorite
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <button
                        onClick={() => onEditTable(table.id)}
                        className="font-medium transition-colors hover:text-primary"
                      >
                        {table.name}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {table.rowCount.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(table.lastModified)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-xs text-white">
                          {table.owner
                            .split(" ")
                            .map((part) => part[0] ?? "")
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{table.owner}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            onEditTable(table.id);
                            handleActionToast("Opened", table.name);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            onDuplicateTable(table.id);
                            handleActionToast("Duplicated", table.name);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            onDeleteTable(table.id);
                            handleActionToast("Deleted", table.name);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </UITable>
        </div>
      )}
    </div>
  );
}

export default TablesView;
