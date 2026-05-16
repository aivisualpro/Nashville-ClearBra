"use client";

import * as React from "react";
import {
  IconChevronDown, IconChevronLeft, IconChevronRight,
  IconChevronsLeft, IconChevronsRight, IconLayoutColumns,
  IconRefresh, IconSearch,
} from "@tabler/icons-react";
import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

function buildColumns(data: DataRecord[], columnOrder?: string[], avatarField?: string, currencyFields?: string[]): ColumnDef<DataRecord>[] {
  if (data.length === 0) return [];
  const keySet = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));
  keySet.delete("_id");
  if (avatarField) keySet.delete(avatarField);
  const currencySet = new Set(currencyFields || []);
  let keys: string[];
  if (columnOrder) {
    const filtered = columnOrder.filter((k) => k !== avatarField);
    const ordered = filtered.filter((k) => keySet.has(k));
    const remaining = Array.from(keySet).filter((k) => !filtered.includes(k)).sort((a, b) => a.localeCompare(b));
    keys = [...ordered, ...remaining];
  } else {
    keys = Array.from(keySet).sort((a, b) => a.localeCompare(b));
  }
  return keys.map((key) => ({
    accessorKey: key,
    header: formatHeader(key),
    cell: ({ row }) => {
      // Currency formatting
      if (currencySet.has(key)) {
        const val = row.getValue(key);
        if (val == null) return <span className="text-muted-foreground italic">—</span>;
        return <span className="tabular-nums">${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
      // Avatar in first column
      if (avatarField && key === keys[0]) {
        const imgUrl = row.original[avatarField] as string | undefined;
        const isValidUrl = imgUrl && imgUrl.startsWith("http");
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {isValidUrl ? (
              <img src={imgUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", flexShrink: 0 }} />
            )}
            <CellRenderer value={row.getValue(key)} />
          </div>
        );
      }
      return <CellRenderer value={row.getValue(key)} />;
    },
  }));
}

function formatHeader(key: string): string {
  return key.replace(/^_/, "").replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CellRenderer({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground italic">—</span>;
  if (typeof value === "boolean") return <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>;
  if (typeof value === "number") return <span className="tabular-nums">{value.toLocaleString()}</span>;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return <span className="tabular-nums text-nowrap">{new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>;
    }
    if (value === "Active") return <Badge className="bg-green-600 text-white">{value}</Badge>;
    if (value === "Inactive") return <Badge variant="outline" className="text-muted-foreground">{value}</Badge>;
    if (value.length > 80) return <span title={value} className="cursor-help">{value.slice(0, 80)}…</span>;
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) return <Badge variant="outline" className="text-muted-foreground">{value.length} items</Badge>;
  if (typeof value === "object") return <Badge variant="outline" className="text-muted-foreground">Object</Badge>;
  return <span>{String(value)}</span>;
}

interface GenericDataTableProps {
  apiEndpoint: string;
  emptyLabel: string;
  entityLabel: string;
  columnOrder?: string[];
  avatarField?: string;
  rowLinkPrefix?: string;
  currencyFields?: string[];
  defaultSort?: { id: string; desc: boolean };
  toolbarPortal?: (toolbar: React.ReactNode) => void;
}

export function GenericDataTable({ apiEndpoint, emptyLabel, entityLabel, columnOrder, avatarField, rowLinkPrefix, currencyFields, defaultSort, toolbarPortal }: GenericDataTableProps) {
  const [data, setData] = React.useState<DataRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>(defaultSort ? [defaultSort] : []);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });

  const fetchData = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(apiEndpoint);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.message || `Failed to fetch ${entityLabel}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally { setLoading(false); }
  }, [apiEndpoint, entityLabel]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const columns = React.useMemo(() => buildColumns(data, columnOrder, avatarField, currencyFields), [data, columnOrder, avatarField, currencyFields]);

  const table = useReactTable({
    data, columns,
    state: { sorting, columnVisibility, columnFilters, pagination, globalFilter },
    onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility, onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
  });

  // Toolbar elements for header portal
  const toolbarEl = (
    <>
      <div className="relative">
        <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input placeholder={`Search ${entityLabel}…`} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="h-8 w-48 lg:w-64 pl-8 text-sm" />
      </div>
      <Badge variant="secondary" className="text-muted-foreground text-xs">{table.getFilteredRowModel().rows.length} records</Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm"><IconLayoutColumns className="size-4" /><span className="hidden lg:inline">Columns</span><IconChevronDown className="size-3" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-auto">
          {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
            <DropdownMenuCheckboxItem key={col.id} className="capitalize" checked={col.getIsVisible()} onCheckedChange={(v) => col.toggleVisibility(!!v)}>
              {formatHeader(col.id)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={fetchData}><IconRefresh className="size-4" /></Button>
    </>
  );

  // Push toolbar into header via portal callback
  React.useEffect(() => {
    if (toolbarPortal && !loading && !error && data.length > 0) {
      toolbarPortal(toolbarEl);
    }
  });

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <IconRefresh className="text-muted-foreground size-8 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading {entityLabel}…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <p className="text-destructive text-sm">{error}</p>
      <Button variant="outline" size="sm" onClick={fetchData}><IconRefresh className="size-4" /> Retry</Button>
    </div>
  );

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-2 py-24">
      <p className="text-muted-foreground text-sm">No {entityLabel} found in <code className="text-xs">{emptyLabel}</code>.</p>
      <Button variant="outline" size="sm" onClick={fetchData}><IconRefresh className="size-4" /> Refresh</Button>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Inline toolbar fallback when no portal */}
      {!toolbarPortal && (
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input placeholder={`Search ${entityLabel}…`} value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="h-9 w-64 pl-8" />
            </div>
            <Badge variant="secondary" className="text-muted-foreground text-xs">{table.getFilteredRowModel().rows.length} records</Badge>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><IconLayoutColumns /><span className="hidden lg:inline">Columns</span><IconChevronDown /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-auto">
                {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem key={col.id} className="capitalize" checked={col.getIsVisible()} onCheckedChange={(v) => col.toggleVisibility(!!v)}>
                    {formatHeader(col.id)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={fetchData}><IconRefresh className="size-4" /><span className="hidden lg:inline">Refresh</span></Button>
          </div>
        </div>
      )}

      <div className="overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} colSpan={h.colSpan} className="cursor-pointer select-none text-nowrap hover:bg-muted/80" onClick={h.column.getToggleSortingHandler()}>
                      <div className="flex items-center gap-1">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? null}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={rowLinkPrefix ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                    onClick={rowLinkPrefix ? () => { window.location.href = `${rowLinkPrefix}/${row.original._id}`; } : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-nowrap">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">{table.getFilteredRowModel().rows.length} total row(s)</div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor={`${entityLabel}-rpp`} className="text-sm font-medium">Rows per page</Label>
            <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger size="sm" className="w-20" id={`${entityLabel}-rpp`}><SelectValue placeholder={table.getState().pagination.pageSize} /></SelectTrigger>
              <SelectContent side="top">{[10, 20, 30, 50, 100].map((ps) => <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><IconChevronsLeft /></Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><IconChevronLeft /></Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><IconChevronRight /></Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><IconChevronsRight /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
