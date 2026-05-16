"use client";

import * as React from "react";
import {
  IconChevronDown, IconLayoutColumns,
  IconRefresh, IconSearch, IconAlertTriangle, IconDatabaseOff,
  IconLayoutSidebar, IconLoader2,
} from "@tabler/icons-react";
import {
  ColumnDef, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// ─── Types ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

export interface DataTableColumn<T = DataRecord> {
  key: string;
  header: string;
  accessor?: (row: T) => unknown;
  align?: "left" | "right" | "center";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  truncate?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  format?: "currency" | "number" | "date" | "phone";
}

export interface DataTableProps<T = DataRecord> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  // Toolbar
  title?: string;
  entityLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  toolbarActions?: React.ReactNode;
  columnVisibility?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  // Infinite scroll
  totalRows?: number;
  hasMore?: boolean;
  onLoadMore?: () => void;
  scrollThreshold?: number;
  batchSize?: number;
  // Column resizing
  resizableColumns?: boolean;
  persistKey?: string;
  userId?: string;
  minColumnWidth?: number;
  maxColumnWidth?: number;
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  // Behavior
  sortable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
  defaultSort?: { id: string; desc: boolean };
  avatarField?: string;
  showSidebarToggle?: boolean;
}

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatHeaderLabel(key: string): string {
  return key
    .replace(/^_/, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(val: unknown): string {
  if (val == null) return "";
  return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPhone(val: unknown): string {
  if (val == null || typeof val !== "string") return String(val ?? "");
  const d = val.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return val;
}

function formatDate(val: unknown): string {
  if (val == null) return "";
  return new Date(String(val)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Cell Components ────────────────────────────────────────────────────────

function EmptyCell() {
  return <span className="text-muted-foreground select-none">—</span>;
}

function TruncatedCell({ value, maxWidth = 200 }: { value: string; maxWidth?: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="block truncate cursor-default"
          style={{ maxWidth }}
        >
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-all">
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusBadge({ value }: { value: string }) {
  const isActive = value === "Active";
  return (
    <Badge
      variant={isActive ? "default" : "outline"}
      className={`min-w-[5rem] justify-center ${isActive ? "bg-green-600 text-white" : "text-muted-foreground"}`}
    >
      {value}
    </Badge>
  );
}

function DefaultCellRenderer({ value, format, truncate, align }: {
  value: unknown;
  format?: DataTableColumn["format"];
  truncate?: boolean;
  align?: DataTableColumn["align"];
}) {
  if (value === null || value === undefined || value === "") return <EmptyCell />;

  // Format overrides
  if (format === "currency") {
    return <span className="tabular-nums">{formatCurrency(value)}</span>;
  }
  if (format === "number") {
    return <span className="tabular-nums">{Number(value).toLocaleString()}</span>;
  }
  if (format === "date") {
    return <span className="tabular-nums text-nowrap">{formatDate(value)}</span>;
  }
  if (format === "phone") {
    return <span className="text-nowrap">{formatPhone(value)}</span>;
  }

  // Type-based
  if (typeof value === "boolean") {
    return <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>;
  }
  if (typeof value === "number") {
    return <span className="tabular-nums">{value.toLocaleString()}</span>;
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return <span className="tabular-nums text-nowrap">{formatDate(value)}</span>;
    }
    if (value === "Active" || value === "Inactive") return <StatusBadge value={value} />;
    if (truncate) {
      return <TruncatedCell value={value} />;
    }
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <EmptyCell />;
    return <span className="text-sm">{value.join(", ")}</span>;
  }
  if (typeof value === "object") {
    return <Badge variant="outline" className="text-muted-foreground">Object</Badge>;
  }
  return <span>{String(value)}</span>;
}

// ─── Skeleton Rows ──────────────────────────────────────────────────────────

function SkeletonRows({ columns, rows = 8 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Sidebar Toggle ─────────────────────────────────────────────────────────

function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <IconLayoutSidebar className="size-4" />
      </Button>
      <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
    </>
  );
}

// ─── Main DataTable Component ───────────────────────────────────────────────

export function DataTable<T extends DataRecord = DataRecord>({
  data,
  columns: columnDefs,
  loading = false,
  loadingMore: loadingMoreProp = false,
  error = null,
  title,
  entityLabel,
  searchable = true,
  searchPlaceholder,
  onSearch,
  toolbarActions,
  columnVisibility: showColumnToggle = true,
  refreshable = true,
  onRefresh,
  // Infinite scroll
  totalRows: totalRowsProp,
  hasMore: hasMoreProp,
  onLoadMore,
  scrollThreshold = 200,
  batchSize: batchSizeProp = 20,
  // Column resizing
  resizableColumns = true,
  persistKey,
  userId,
  minColumnWidth = 80,
  maxColumnWidth = 800,
  onColumnWidthsChange,
  // Behavior
  sortable = true,
  onRowClick,
  emptyState,
  stickyHeader = true,
  defaultSort,
  avatarField,
  showSidebarToggle = false,
}: DataTableProps<T>) {
  const visibilityStorageKey = `ncb-vis-${(persistKey || entityLabel || title || "table").replace(/\s+/g, "_")}`;
  const resizeStorageKey = persistKey && userId
    ? `datatable:${userId}:${persistKey}:columnWidths`
    : persistKey ? `datatable:${persistKey}:columnWidths` : null;

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>(defaultSort ? [defaultSort] : []);
  const [colVisibility, setColVisibility] = React.useState<VisibilityState>({});

  // ─── Column widths (resize persistence) ─────────────────────────────
  const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>({});

  // Hydrate persisted state from localStorage AFTER mount to avoid hydration mismatch
  const hasHydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    try {
      const savedVis = localStorage.getItem(visibilityStorageKey);
      if (savedVis) setColVisibility(JSON.parse(savedVis));
    } catch {}
    if (resizableColumns && resizeStorageKey) {
      try {
        const savedSizing = localStorage.getItem(resizeStorageKey);
        if (savedSizing) setColumnSizing(JSON.parse(savedSizing));
      } catch {}
    }
  }, [visibilityStorageKey, resizableColumns, resizeStorageKey]);

  const resizeDebounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  // Persist column visibility
  React.useEffect(() => {
    try { localStorage.setItem(visibilityStorageKey, JSON.stringify(colVisibility)); } catch {}
  }, [colVisibility, visibilityStorageKey]);

  // Persist column widths (debounced) — skip saving empty objects to avoid wiping saved widths on mount
  React.useEffect(() => {
    if (!resizableColumns || Object.keys(columnSizing).length === 0) return;
    if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current);
    resizeDebounceRef.current = setTimeout(() => {
      if (resizeStorageKey) {
        try { localStorage.setItem(resizeStorageKey, JSON.stringify(columnSizing)); } catch {}
      }
      onColumnWidthsChange?.(columnSizing);
    }, 500);
    return () => { if (resizeDebounceRef.current) clearTimeout(resizeDebounceRef.current); };
  }, [columnSizing, resizableColumns, resizeStorageKey, onColumnWidthsChange]);

  const resetColumnWidths = React.useCallback(() => {
    setColumnSizing({});
    if (resizeStorageKey) {
      try { localStorage.removeItem(resizeStorageKey); } catch {}
    }
  }, [resizeStorageKey]);

  // ─── Infinite scroll state ──────────────────────────────────────────
  const [visibleCount, setVisibleCount] = React.useState(batchSizeProp);
  const [internalLoadingMore, setInternalLoadingMore] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const loadingMore = loadingMoreProp || internalLoadingMore;

  // Reset on data/filter change
  React.useEffect(() => {
    setVisibleCount(batchSizeProp);
    setInternalLoadingMore(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [globalFilter, data.length, batchSizeProp]);

  // Build tanstack columns from our column defs
  const tanstackColumns: ColumnDef<T>[] = React.useMemo(() => {
    return columnDefs.map((col, idx) => ({
      id: col.key,
      accessorFn: col.accessor || ((row: T) => (row as DataRecord)[col.key]),
      header: col.header || formatHeaderLabel(col.key),
      enableSorting: col.sortable !== false && sortable,
      enableResizing: resizableColumns && col.resizable !== false,
      size: columnSizing[col.key] || col.width || 150,
      minSize: col.minWidth ?? minColumnWidth,
      maxSize: col.maxWidth ?? maxColumnWidth,
      cell: ({ row }) => {
        const rawValue = col.accessor ? col.accessor(row.original) : (row.original as DataRecord)[col.key];
        if (avatarField && idx === 0) {
          const imgUrl = (row.original as DataRecord)[avatarField] as string | undefined;
          const isValidUrl = imgUrl && imgUrl.startsWith("http");
          return (
            <div className="flex items-center gap-2">
              {isValidUrl ? (
                <img src={imgUrl} alt="" className="size-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="size-8 rounded-full bg-muted shrink-0" />
              )}
              {col.render ? col.render(rawValue, row.original) : (
                <DefaultCellRenderer value={rawValue} format={col.format} truncate={col.truncate} align={col.align} />
              )}
            </div>
          );
        }
        if (col.render) return col.render(rawValue, row.original);
        return <DefaultCellRenderer value={rawValue} format={col.format} truncate={col.truncate} align={col.align} />;
      },
      meta: { align: col.align, width: col.width, format: col.format },
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnDefs, sortable, avatarField, resizableColumns, minColumnWidth, maxColumnWidth]);

  const table = useReactTable({
    data: data as T[],
    columns: tanstackColumns,
    state: {
      sorting,
      columnVisibility: colVisibility,
      globalFilter,
      columnSizing,
    },
    enableColumnResizing: resizableColumns,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColVisibility,
    onColumnSizingChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnSizing) : updater;
      setColumnSizing(next);
    },
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      onSearch?.(value);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const allFilteredRows = table.getFilteredRowModel().rows;
  const filteredTotal = allFilteredRows.length;
  const visibleRows = allFilteredRows.slice(0, visibleCount);
  const computedHasMore = hasMoreProp !== undefined ? hasMoreProp : visibleCount < filteredTotal;

  // IntersectionObserver-based infinite scroll
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && computedHasMore) {
          if (onLoadMore) {
            setInternalLoadingMore(true);
            onLoadMore();
          } else {
            setVisibleCount((prev) => Math.min(prev + batchSizeProp, filteredTotal));
          }
        }
      },
      { root: container, rootMargin: `0px 0px ${scrollThreshold}px 0px`, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [computedHasMore, loadingMore, onLoadMore, batchSizeProp, filteredTotal, scrollThreshold]);

  // Clear internal loading when external data arrives
  React.useEffect(() => {
    if (!loadingMoreProp) setInternalLoadingMore(false);
  }, [loadingMoreProp, data.length]);

  const totalCount = totalRowsProp ?? data.length;
  const allLoaded = !computedHasMore && filteredTotal > 0;

  // Align helper
  function cellAlignClass(colId: string): string {
    const col = columnDefs.find((c) => c.key === colId);
    if (!col) return "";
    if (col.align === "right" || col.format === "currency" || col.format === "number") return "text-right";
    if (col.align === "center") return "text-center";
    return "";
  }

  const titleId = React.useId();

  return (
    <div
      className="flex flex-col flex-1 min-h-0 rounded-lg border bg-card text-card-foreground overflow-hidden"
      role="region"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 lg:px-5 py-2.5 border-b bg-card shrink-0">
        {/* Left: Sidebar toggle + Title + count */}
        <div className="flex items-center gap-2 min-w-0">
          {showSidebarToggle && <SidebarToggleButton />}
          {title && (
            <h2 id={titleId} className="text-sm font-semibold whitespace-nowrap">
              {title}
            </h2>
          )}
          {title && entityLabel && !loading && (
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              · {totalCount} {entityLabel}
            </span>
          )}
        </div>

        {/* Right: Search + controls + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {searchable && (
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder={searchPlaceholder || `Search${entityLabel ? ` ${entityLabel}` : ""}…`}
                value={globalFilter}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
                className="h-8 w-44 lg:w-64 pl-8 text-sm"
                aria-label={`Search ${entityLabel || "table"}`}
              />
            </div>
          )}

          {showColumnToggle && tanstackColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Toggle columns">
                  <IconLayoutColumns className="size-4" />
                  <span className="hidden lg:inline">Columns</span>
                  <IconChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-72 overflow-auto">
                {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {formatHeaderLabel(col.id)}
                  </DropdownMenuCheckboxItem>
                ))}
                {resizableColumns && Object.keys(columnSizing).length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetColumnWidths} className="text-xs text-muted-foreground">
                      Reset column widths
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {refreshable && onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} aria-label="Refresh data">
              <IconRefresh className="size-4" />
            </Button>
          )}

          {toolbarActions}
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 lg:px-5 py-3 bg-destructive/10 border-b border-destructive/20">
          <IconAlertTriangle className="size-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive flex-1">{error}</span>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="shrink-0">
              <IconRefresh className="size-4" /> Retry
            </Button>
          )}
        </div>
      )}

      {/* ── Table Body ───────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto [&_[data-slot=table-container]]:overflow-visible" style={{ fontVariantNumeric: "tabular-nums" }}>
        <Table role="table" style={{ tableLayout: "fixed", width: table.getCenterTotalSize() }}>
          <TableHeader className={`bg-muted ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const isSorted = h.column.getIsSorted();
                  const canResize = h.column.getCanResize();
                  return (
                    <TableHead
                      key={h.id}
                      colSpan={h.colSpan}
                      className={`relative select-none hover:bg-muted/80 transition-colors ${h.column.getCanSort() ? "cursor-pointer" : ""} ${cellAlignClass(h.column.id)}`}
                      style={{ width: h.getSize() }}
                      onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
                      aria-sort={isSorted === "asc" ? "ascending" : isSorted === "desc" ? "descending" : "none"}
                    >
                      <div className={`flex items-center gap-1 ${cellAlignClass(h.column.id) === "text-right" ? "justify-end" : cellAlignClass(h.column.id) === "text-center" ? "justify-center" : ""}`}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: " ↑", desc: " ↓" }[isSorted as string] ?? null}
                      </div>
                      {canResize && (
                        <div
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          onDoubleClick={() => h.column.resetSize()}
                          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none transition-colors hover:bg-primary/40 ${h.column.getIsResizing() ? "bg-primary/60" : ""}`}
                          role="separator"
                          aria-label={`Resize ${h.column.columnDef.header}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* Loading skeleton */}
            {loading && <SkeletonRows columns={tanstackColumns.length || 5} />}

            {/* Data rows */}
            {!loading && !error && visibleRows.length > 0 && (
              visibleRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row.original); } } : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${cellAlignClass(cell.column.id)}`}
                      style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize(), wordBreak: "break-word" }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}

            {/* Empty state */}
            {!loading && !error && data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={tanstackColumns.length || 1} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    {emptyState || (
                      <>
                        <IconDatabaseOff className="size-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground text-sm">No {entityLabel || "records"} found.</p>
                        {onRefresh && (
                          <Button variant="outline" size="sm" onClick={onRefresh}>
                            <IconRefresh className="size-4" /> Refresh
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* No search results */}
            {!loading && !error && data.length > 0 && filteredTotal === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={tanstackColumns.length || 1} className="h-36">
                  <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <IconSearch className="size-8 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">
                      No {entityLabel || "results"} match &ldquo;{globalFilter}&rdquo;
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Sentinel for IntersectionObserver infinite scroll */}
        <div ref={sentinelRef} className="h-1 shrink-0" aria-hidden />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      {(data.length > 0 || loading) && (
        <div className="flex items-center justify-between px-4 lg:px-5 py-2 border-t bg-card shrink-0">
          {/* Left: count */}
          <div className="text-muted-foreground text-xs">
            {loading ? (
              <Skeleton className="h-3.5 w-32" />
            ) : (
              `Showing ${filteredTotal === 0 ? 0 : 1}\u2013${Math.min(visibleCount, filteredTotal)} of ${filteredTotal}`
            )}
          </div>
          {/* Right: contextual status */}
          {!loading && filteredTotal > 0 && (
            <div className="text-muted-foreground text-xs flex items-center gap-1.5">
              {loadingMore && (
                <><IconLoader2 className="size-3 animate-spin" /> Loading more&hellip;</>
              )}
              {allLoaded && !loadingMore && (
                <span>All records loaded</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helper: Auto-build columns from raw data ──────────────────────────────

export function buildColumnsFromData(
  data: DataRecord[],
  opts?: {
    columnOrder?: string[];
    avatarField?: string;
    currencyFields?: string[];
  }
): DataTableColumn[] {
  if (data.length === 0) return [];
  const keySet = new Set<string>();
  data.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));
  keySet.delete("_id");
  if (opts?.avatarField) keySet.delete(opts.avatarField);

  const currencySet = new Set(opts?.currencyFields || []);

  let keys: string[];
  if (opts?.columnOrder) {
    const filtered = opts.columnOrder.filter((k) => k !== opts.avatarField);
    const ordered = filtered.filter((k) => keySet.has(k));
    const remaining = Array.from(keySet).filter((k) => !filtered.includes(k)).sort();
    keys = [...ordered, ...remaining];
  } else {
    keys = Array.from(keySet).sort();
  }

  return keys.map((key) => ({
    key,
    header: formatHeaderLabel(key),
    format: currencySet.has(key) ? "currency" as const : undefined,
    align: currencySet.has(key) ? "right" as const : undefined,
  }));
}
