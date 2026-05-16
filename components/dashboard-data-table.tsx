"use client";

import * as React from "react";
import { DataTable, buildColumnsFromData } from "@/components/data-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

export function DashboardDataTable({ data }: { data: DataRecord[] }) {
  const columns = React.useMemo(() => buildColumnsFromData(data), [data]);

  return (
    <DataTable
      data={data}
      columns={columns}
      title="Documents"
      entityLabel="documents"
      searchPlaceholder="Search documents…"
      refreshable={false}
      batchSize={10}
    />
  );
}
